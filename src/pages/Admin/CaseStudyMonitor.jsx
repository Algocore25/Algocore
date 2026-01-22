import React, { useState, useEffect, useMemo } from 'react';
import { database } from "../../firebase";
import { ref, get } from "firebase/database";
import {
    FiUser,
    FiSearch,
    FiRefreshCw,
    FiFilter,
    FiEye,
    FiBookOpen,
    FiClock,
    FiFileText,
    FiPrinter,
    FiDownload
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CaseStudyMonitor = () => {
    const [students, setStudents] = useState([]);
    const [users, setUsers] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [filter, setFilter] = useState('');
    const [previewVersions, setPreviewVersions] = useState({}); // { questionId: 'content string' }

    // PDF Generation State
    const reportRef = React.useRef(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfType, setPdfType] = useState(null); // 'overall' or 'individual'
    const [reportData, setReportData] = useState(null); // Data to render in hidden report

    // Helper to extract and sort valid versions
    const getValidVersions = (questionData) => {
        if (!questionData) return [];
        return Object.entries(questionData)
            .filter(([key, val]) => key !== 'current' && val && typeof val === 'object' && val.timestamp && val.text)
            .map(([key, val]) => ({ id: key, ...val }))
            .sort((a, b) => b.timestamp - a.timestamp);
    };

    // Helper to determine if a node is a QuestionData object (has current or versions) 
    // vs a Map of QuestionData objects
    const normalizeCourseData = (courseVal, courseId) => {
        if (!courseVal) return [];

        // precise check: if it has 'current' or keys looking like push IDs (-...)
        const hasCurrent = !!courseVal.current;
        const hasVersions = Object.keys(courseVal).some(k => k.startsWith('-'));

        // If it looks like data, return it as a single entry using courseId as the "Question Name"
        if (hasCurrent || hasVersions) {
            return [[courseId, courseVal]];
        }

        // Otherwise assume it's a map of id -> data
        return Object.entries(courseVal);
    };

    const fetchData = async () => {
        try {
            const [caseStudiesSnap, usersSnap] = await Promise.all([
                get(ref(database, 'caseStudyProgress')),
                get(ref(database, 'users'))
            ]);

            const caseStudiesData = caseStudiesSnap.exists() ? caseStudiesSnap.val() : {};
            const usersData = usersSnap.exists() ? usersSnap.val() : {};

            setUsers(usersData);

            // Process students
            const processedStudents = Object.entries(caseStudiesData).map(([uid, courses]) => {
                const userProfile = usersData[uid] || {};

                // Calculate stats
                let totalVersions = 0;
                let activeDrafts = 0;
                let lastActivity = 0;

                Object.entries(courses).forEach(([cId, cVal]) => {
                    const normalizedQuestions = normalizeCourseData(cVal, cId);

                    normalizedQuestions.forEach(([qId, qData]) => {
                        if (qData.current) activeDrafts++;

                        const versions = getValidVersions(qData);
                        totalVersions += versions.length;

                        if (versions.length > 0 && versions[0].timestamp > lastActivity) {
                            lastActivity = versions[0].timestamp;
                        }
                    });
                });

                return {
                    uid,
                    name: userProfile.name || 'Anonymous',
                    email: userProfile.email || 'No Email',
                    photo: userProfile.profilePhoto || null,
                    courses,
                    stats: {
                        totalVersions,
                        activeDrafts,
                        lastActivity
                    }
                };
            });

            setStudents(processedStudents);
            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error("Error fetching monitor data:", error);
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const filteredStudents = useMemo(() => {
        if (!filter) return students;
        const lowerFilter = filter.toLowerCase();
        return students.filter(student =>
            student.name.toLowerCase().includes(lowerFilter) ||
            student.email.toLowerCase().includes(lowerFilter) ||
            student.uid.includes(lowerFilter)
        );
    }, [students, filter]);

    // Helper to strip HTML tags
    const stripHtml = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '');
    };

    const downloadIndividualReport = (student) => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        let yPosition = margin;

        // Helpers
        const checkNewPage = (requiredSpace) => {
            if (yPosition + requiredSpace > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
                return true;
            }
            return false;
        };

        const addTextWrapper = (text, x, y, maxWidth, fontSize = 10, fontStyle = 'normal', color = [0, 0, 0]) => {
            pdf.setFontSize(fontSize);
            pdf.setFont('helvetica', fontStyle);
            pdf.setTextColor(...color);
            const lines = pdf.splitTextToSize(String(text || ''), maxWidth);
            pdf.text(lines, x, y);
            return lines.length * (fontSize * 0.35 + 1); // Approx line height
        };

        // Header
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(student.name, margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(student.email, margin, yPosition);
        yPosition += 10;

        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 10;

        // Content
        const courses = Object.entries(student.courses);

        courses.forEach(([courseId, cValue]) => {
            if (checkNewPage(20)) yPosition += 10;

            // Course Title
            pdf.setFillColor(240, 245, 255);
            pdf.rect(margin, yPosition - 5, pageWidth - (margin * 2), 10, 'F');
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(courseId.replace(/_/g, ' '), margin + 2, yPosition + 1.5);
            yPosition += 12;

            const normalizedQuestions = normalizeCourseData(cValue, courseId);

            normalizedQuestions.forEach(([questionId, data]) => {
                const versions = getValidVersions(data);
                const currentText = typeof data.current === 'object' ? data.current?.text : data.current;

                if (checkNewPage(30)) yPosition += 10;

                // Question Title
                pdf.setFontSize(11);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(50, 50, 50);
                pdf.text(questionId.replace(/_/g, ' '), margin, yPosition);
                yPosition += 6;

                // Current Draft
                if (currentText) {
                    const stripped = stripHtml(currentText);
                    if (checkNewPage(20)) yPosition += 10;

                    pdf.setFontSize(9);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(34, 197, 94); // Green
                    pdf.text("Active Draft:", margin, yPosition);
                    yPosition += 5;

                    pdf.setFont('courier', 'normal');
                    pdf.setTextColor(0, 0, 0);
                    const height = addTextWrapper(stripped, margin + 5, yPosition, pageWidth - (margin * 2) - 5, 9);
                    yPosition += height + 5;
                }

                // Versions
                if (versions.length > 0) {
                    if (checkNewPage(15)) yPosition += 10;
                    pdf.setFont('helvetica', 'bold');
                    pdf.setFontSize(9);
                    pdf.setTextColor(100, 100, 100);
                    pdf.text(`Saved Versions (${versions.length})`, margin, yPosition);
                    yPosition += 6;

                    versions.forEach((v, i) => {
                        const strippedVersion = stripHtml(v.text);
                        if (checkNewPage(20)) yPosition += 10;

                        // Version Header
                        pdf.setFont('helvetica', 'bold');
                        pdf.setFontSize(9);
                        pdf.setTextColor(70, 70, 70);
                        const dateStr = new Date(v.timestamp).toLocaleString();
                        pdf.text(`v${versions.length - i} - ${dateStr} (${strippedVersion.length} chars)`, margin + 2, yPosition);
                        yPosition += 5;

                        // Version Content
                        pdf.setFont('courier', 'normal');
                        pdf.setTextColor(50, 50, 50);
                        const vHeight = addTextWrapper(strippedVersion, margin + 5, yPosition, pageWidth - (margin * 2) - 5, 8);
                        yPosition += vHeight + 4;

                        // Separator
                        pdf.setDrawColor(240, 240, 240);
                        pdf.line(margin + 5, yPosition - 2, pageWidth - margin - 5, yPosition - 2);
                    });
                    yPosition += 5;
                }

                yPosition += 5; // Spacer between questions
            });
            yPosition += 5; // Spacer between courses
        });

        pdf.save(`Report_${student.name.replace(/\s+/g, '_')}.pdf`);
    };

    const downloadOverallReport = () => {
        setIsGeneratingPdf(true);
        setPdfType('overall');

        // Use setTimeout to allow UI to update (spinner)
        setTimeout(() => {
            try {
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const margin = 15;
                let yPosition = margin;

                // --- Shared Helpers for this scope ---
                const checkNewPage = (requiredSpace) => {
                    if (yPosition + requiredSpace > pageHeight - margin) {
                        pdf.addPage();
                        yPosition = margin;
                        return true;
                    }
                    return false;
                };

                const addTextWrapper = (text, x, y, maxWidth, fontSize = 10, fontStyle = 'normal', color = [0, 0, 0]) => {
                    pdf.setFontSize(fontSize);
                    pdf.setFont('helvetica', fontStyle);
                    pdf.setTextColor(...color);
                    const lines = pdf.splitTextToSize(String(text || ''), maxWidth);
                    pdf.text(lines, x, y);
                    return lines.length * (fontSize * 0.35 + 1); // Approx line height
                };

                // --- SUMMARY SECTION ---

                // Header
                pdf.setFontSize(18);
                pdf.setFont('helvetica', 'bold');
                pdf.text("Case Study Progress Report", margin, yPosition);
                yPosition += 8;

                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
                yPosition += 15;

                // Stats
                const totalDrafts = filteredStudents.reduce((acc, s) => acc + s.stats.activeDrafts, 0);
                const totalVersions = filteredStudents.reduce((acc, s) => acc + s.stats.totalVersions, 0);

                pdf.setFillColor(245, 245, 245);
                pdf.rect(margin, yPosition - 5, pageWidth - margin * 2, 20, 'F');

                pdf.setFont('helvetica', 'bold');
                pdf.text(`${filteredStudents.length} Students`, margin + 5, yPosition);
                pdf.text(`${totalDrafts} Active Drafts`, margin + 60, yPosition);
                pdf.text(`${totalVersions} Saved Versions`, margin + 120, yPosition);
                yPosition += 25;

                // Table Header
                pdf.setFillColor(70, 130, 180);
                pdf.setTextColor(255, 255, 255);
                pdf.rect(margin, yPosition - 6, pageWidth - margin * 2, 8, 'F');
                pdf.setFontSize(9);
                pdf.text('Student', margin + 2, yPosition);
                pdf.text('Email', margin + 60, yPosition);
                pdf.text('Courses', margin + 120, yPosition);
                pdf.text('Drafts', margin + 140, yPosition);
                pdf.text('Versions', margin + 160, yPosition);
                pdf.setTextColor(0, 0, 0);
                yPosition += 10;

                // Tracking for Links
                const summaryLinks = []; // { uid, page, x, y, w, h }
                const studentDestinations = {}; // { uid: { page, y } }

                // Summary Rows
                filteredStudents.forEach((student, idx) => {
                    if (checkNewPage(10)) yPosition += 10;

                    if (idx % 2 !== 0) {
                        pdf.setFillColor(250, 250, 250);
                        pdf.rect(margin, yPosition - 5, pageWidth - margin * 2, 8, 'F');
                    }

                    // Render Name (Blue + Clickable Look)
                    pdf.setTextColor(0, 0, 238);
                    const nameText = student.name.substring(0, 25);
                    pdf.text(nameText, margin + 2, yPosition);

                    const textWidth = pdf.getTextWidth(nameText);
                    summaryLinks.push({
                        uid: student.uid,
                        page: pdf.internal.getCurrentPageInfo().pageNumber,
                        x: margin + 2,
                        y: yPosition - 4,
                        w: textWidth + 2,
                        h: 6
                    });

                    pdf.setTextColor(0, 0, 0);
                    pdf.text(student.email.substring(0, 30), margin + 60, yPosition);
                    pdf.text(Object.keys(student.courses).length.toString(), margin + 120, yPosition);
                    pdf.text(student.stats.activeDrafts.toString(), margin + 140, yPosition);
                    pdf.text(student.stats.totalVersions.toString(), margin + 160, yPosition);

                    yPosition += 8;
                });

                // --- DETAILED BREAKDOWN SECTION ---

                // Start a new page for details
                pdf.addPage();
                yPosition = margin;

                pdf.setFontSize(16);
                pdf.setFont('helvetica', 'bold');
                pdf.text("Detailed Student Breakdown", margin, yPosition);
                yPosition += 15;

                filteredStudents.forEach((student, sIdx) => {
                    if (sIdx > 0) {
                        pdf.addPage();
                        yPosition = margin;
                    }

                    // Record Destination
                    studentDestinations[student.uid] = {
                        page: pdf.internal.getCurrentPageInfo().pageNumber,
                        y: yPosition
                    };

                    // Student Header
                    pdf.setFontSize(14);
                    pdf.setFont('helvetica', 'bold');
                    pdf.setTextColor(0, 0, 0);
                    pdf.text(`${sIdx + 1}. ${student.name}`, margin, yPosition);
                    yPosition += 7;

                    pdf.setFontSize(10);
                    pdf.setFont('helvetica', 'normal');
                    pdf.setTextColor(100, 100, 100);
                    pdf.text(student.email, margin, yPosition);
                    yPosition += 10;

                    pdf.setDrawColor(200, 200, 200);
                    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
                    yPosition += 10;

                    // Reuse Individual Report Logic
                    const courses = Object.entries(student.courses);

                    if (courses.length === 0) {
                        pdf.setFont('helvetica', 'italic');
                        pdf.text("No active courses found.", margin, yPosition);
                        yPosition += 10;
                    }

                    courses.forEach(([courseId, cValue]) => {
                        if (checkNewPage(20)) yPosition += 10;

                        // Course Title
                        pdf.setFillColor(240, 245, 255);
                        pdf.rect(margin, yPosition - 5, pageWidth - (margin * 2), 10, 'F');
                        pdf.setFontSize(12);
                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(0, 0, 0);
                        pdf.text(courseId.replace(/_/g, ' '), margin + 2, yPosition + 1.5);
                        yPosition += 12;

                        const normalizedQuestions = normalizeCourseData(cValue, courseId);

                        normalizedQuestions.forEach(([questionId, data]) => {
                            const versions = getValidVersions(data);
                            const currentText = typeof data.current === 'object' ? data.current?.text : data.current;

                            if (checkNewPage(30)) yPosition += 10;

                            // Question Title
                            pdf.setFontSize(11);
                            pdf.setFont('helvetica', 'bold');
                            pdf.setTextColor(50, 50, 50);
                            pdf.text(questionId.replace(/_/g, ' '), margin, yPosition);
                            yPosition += 6;

                            // Current Draft
                            if (currentText) {
                                const stripped = stripHtml(currentText);
                                if (checkNewPage(20)) yPosition += 10;

                                pdf.setFontSize(9);
                                pdf.setFont('helvetica', 'bold');
                                pdf.setTextColor(34, 197, 94); // Green
                                pdf.text("Active Draft:", margin, yPosition);
                                yPosition += 5;

                                pdf.setFont('courier', 'normal');
                                pdf.setTextColor(0, 0, 0);
                                const height = addTextWrapper(stripped, margin + 5, yPosition, pageWidth - (margin * 2) - 5, 9);
                                yPosition += height + 5;
                            }

                            // Versions
                            if (versions.length > 0) {
                                if (checkNewPage(15)) yPosition += 10;
                                pdf.setFont('helvetica', 'bold');
                                pdf.setFontSize(9);
                                pdf.setTextColor(100, 100, 100);
                                pdf.text(`Saved Versions (${versions.length})`, margin, yPosition);
                                yPosition += 6;

                                versions.forEach((v, i) => {
                                    const strippedVersion = stripHtml(v.text);
                                    if (checkNewPage(20)) yPosition += 10;

                                    // Version Header
                                    pdf.setFont('helvetica', 'bold');
                                    pdf.setFontSize(9);
                                    pdf.setTextColor(70, 70, 70);
                                    const dateStr = new Date(v.timestamp).toLocaleString();
                                    pdf.text(`v${versions.length - i} - ${dateStr} (${strippedVersion.length} chars)`, margin + 2, yPosition);
                                    yPosition += 5;

                                    // Version Content
                                    pdf.setFont('courier', 'normal');
                                    pdf.setTextColor(50, 50, 50);
                                    const vHeight = addTextWrapper(strippedVersion, margin + 5, yPosition, pageWidth - (margin * 2) - 5, 8);
                                    yPosition += vHeight + 4;

                                    // Separator
                                    pdf.setDrawColor(240, 240, 240);
                                    pdf.line(margin + 5, yPosition - 2, pageWidth - margin - 5, yPosition - 2);
                                });
                                yPosition += 5;
                            }

                            yPosition += 5; // Spacer between questions
                        });
                        yPosition += 5; // Spacer between courses
                    });
                });

                // --- APPLY LINKS ---
                summaryLinks.forEach(link => {
                    const dest = studentDestinations[link.uid];
                    if (dest) {
                        pdf.setPage(link.page);
                        pdf.link(link.x, link.y, link.w, link.h, { pageNumber: dest.page, top: dest.y });
                    }
                });

                pdf.save(`Case_Studies_Overall_Report_${new Date().toISOString().split('T')[0]}.pdf`);
                setIsGeneratingPdf(false);
                setPdfType(null);

            } catch (err) {
                console.error("Error generating overall PDF:", err);
                setIsGeneratingPdf(false);
                setPdfType(null);
                alert("Failed to generate overall report.");
            }
        }, 100);
    };





    if (loading && !refreshing) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-300">Case Study Monitor</h1>
                            <p className="text-gray-600 dark:text-gray-400">Track student case study progress and versions</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={downloadOverallReport}
                                disabled={isGeneratingPdf}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                            >
                                {isGeneratingPdf && pdfType === 'overall' ? <FiRefreshCw className="animate-spin" /> : <FiDownload />}
                                Overall Report
                            </button>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
                            >
                                <FiRefreshCw className={`${refreshing ? 'animate-spin' : ''} `} />
                                {refreshing ? 'Refreshing...' : 'Refresh Data'}
                            </button>
                            <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg">
                                <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                                    {filteredStudents.length} Students Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Search */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or UID..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredStudents.map(student => (
                            <motion.div
                                key={student.uid}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center">
                                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center overflow-hidden">
                                                {student.photo ? (
                                                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <FiUser className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                                                )}
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="font-bold text-gray-900 dark:text-gray-100">{student.name}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]" title={student.email}>
                                                    {student.email}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedStudent(student)}
                                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors bg-gray-50 dark:bg-gray-700 rounded-full"
                                        >
                                            <FiEye size={20} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                            <div className="text-xl font-bold text-purple-700 dark:text-purple-400">
                                                {Object.keys(student.courses).length}
                                            </div>
                                            <div className="text-xs text-purple-600 dark:text-purple-300 font-medium">Active Courses</div>
                                        </div>
                                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                            <div className="text-xl font-bold text-green-700 dark:text-green-400">
                                                {student.stats.activeDrafts}
                                            </div>
                                            <div className="text-xs text-green-600 dark:text-green-300 font-medium">Active Drafts</div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <FiFileText /> {student.stats.totalVersions} Versions Saved
                                        </span>
                                        {student.stats.lastActivity > 0 && (
                                            <span className="flex items-center gap-1">
                                                <FiClock /> {new Date(student.stats.lastActivity).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modal */}
            {
                selectedStudent && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-t-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center overflow-hidden">
                                        {selectedStudent.photo ? (
                                            <img src={selectedStudent.photo} alt={selectedStudent.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <FiUser className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {selectedStudent.name}
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{selectedStudent.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => downloadIndividualReport(selectedStudent)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <FiPrinter /> Export Report
                                    </button>
                                    <button
                                        onClick={() => setSelectedStudent(null)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                                {Object.entries(selectedStudent.courses).map(([courseId, cValue]) => (
                                    <div key={courseId} className="mb-8 last:mb-0">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FiBookOpen className="text-blue-600 dark:text-blue-400" />
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                                                {courseId.replace(/_/g, ' ')}
                                            </h3>
                                        </div>

                                        <div className="grid gap-4">
                                            {normalizeCourseData(cValue, courseId).map(([questionId, data]) => {
                                                const versions = getValidVersions(data);
                                                const currentText = typeof data.current === 'object' ? data.current?.text : data.current;
                                                const displayedContent = previewVersions[questionId] || currentText;
                                                const isPreviewing = !!previewVersions[questionId];

                                                return (
                                                    <div key={questionId} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900/50">
                                                        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                                            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                                                                {questionId.replace(/_/g, ' ')}
                                                            </span>
                                                            <span className={`text - xs px - 2 py - 1 rounded - full font - bold ${data.current ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500'} `}>
                                                                {data.current ? 'Active Draft' : 'No Draft'}
                                                            </span>
                                                        </div>

                                                        <div className="p-4 grid md:grid-cols-2 gap-4">
                                                            {/* Current Draft */}
                                                            <div>
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <h4 className="text-xs font-bold text-gray-500 uppercase">{isPreviewing ? 'Selected Version Preview' : 'Current Draft Preview'}</h4>
                                                                    {isPreviewing && (
                                                                        <button
                                                                            onClick={() => setPreviewVersions(prev => {
                                                                                const next = { ...prev };
                                                                                delete next[questionId];
                                                                                return next;
                                                                            })}
                                                                            className="text-[10px] text-blue-600 hover:underline"
                                                                        >
                                                                            Back to Current
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className={`bg-white dark:bg-gray-800 p-3 rounded-lg border ${isPreviewing ? 'border-blue-400 ring-1 ring-blue-100' : 'border-gray-200 dark:border-gray-700'} h-32 overflow-y-auto scrollbar-thin`}>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-300 font-mono whitespace-pre-wrap">
                                                                        {displayedContent ? displayedContent.replace(/<[^>]*>/g, '') : <span className="text-gray-400 italic">Empty draft...</span>}
                                                                    </p>
                                                                    {/* Removed gradient overlay to show full Scroll content */}
                                                                </div>
                                                            </div>

                                                            {/* Version History */}
                                                            <div>
                                                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Saved Versions ({versions.length})</h4>
                                                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 h-32 overflow-y-auto scrollbar-thin">
                                                                    {versions.length > 0 ? (
                                                                        <div className="space-y-2">
                                                                            {versions.map((v, i) => (
                                                                                <div
                                                                                    key={v.id}
                                                                                    onClick={() => setPreviewVersions(prev => ({ ...prev, [questionId]: v.text }))}
                                                                                    className={`flex justify-between items-center text-xs p-2 rounded transition-colors group cursor-pointer ${previewVersions[questionId] === v.text ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                                                                >
                                                                                    <span className={`font-medium ${previewVersions[questionId] === v.text ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`}>
                                                                                        v{versions.length - i} - {new Date(v.timestamp).toLocaleString()}
                                                                                    </span>
                                                                                    <span className="text-gray-400 group-hover:text-blue-500">
                                                                                        {v.text ? stripHtml(v.text).length : 0} chars
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm text-gray-400 italic">No saved versions yet.</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* Hidden Report Template Removed */}

        </div>
    );
};

export default CaseStudyMonitor;
