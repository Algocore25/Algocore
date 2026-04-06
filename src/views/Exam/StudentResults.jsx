import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

import { database } from '../../firebase';
import { ref, get } from 'firebase/database';
import LoadingPage from '../LoadingPage';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function StudentResult() {
    const { testid } = useParams();
    const [result, setResult] = useState(null);
    const [rankings, setRankings] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [testName, setTestName] = useState('');
    const [examStatus, setExamStatus] = useState('');
    const [examType, setExamType] = useState(''); // 'anytime' or 'timeRange'
    const [endTime, setEndTime] = useState(null); // For time range exams
    const [resultsAvailable, setResultsAvailable] = useState(false);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const pdfRef = useRef();

    useEffect(() => {
        if (!user || !user.uid) {
            setLoading(false);
            return;
        }

        const fetchResultData = async () => {
            try {
                // Fetch exam status
                const testRef = ref(database, `Exam/${testid}`);
                const testSnapshot = await get(testRef);
                const testData = testSnapshot.val();

                if (!testData) {
                    setLoading(false);
                    return;
                }

                // Check visibility - prevent access to hidden tests
                if (testData.isVisible === false) {
                    setLoading(false);
                    return;
                }

                const status = testData.Properties?.status || 'Completed';
                setExamStatus(status);
                setTestName(testData.name || '');

                // Determine exam type and availability
                const type = testData.Properties?.type || 'anytime'; // 'anytime' or 'timeRange'
                setExamType(type);

                let canShowResults = false;
                if (type === 'anytime') {
                    // For anytime exams, show results after first submission
                    canShowResults = status === 'Completed' || status === 'ResultsPublished';
                } else if (type === 'timeRange') {
                    // For time range exams, show results only after the exam end time
                    const endTimeStr = testData.Properties?.endTime;
                    if (endTimeStr) {
                        setEndTime(endTimeStr);
                        const endTimeMs = new Date(endTimeStr).getTime();
                        const currentTimeMs = new Date().getTime();
                        canShowResults = currentTimeMs >= endTimeMs;
                    }
                }

                setResultsAvailable(canShowResults);

                const rawQuestions = testData.questions || {};
                const questionsDataArray = Array.isArray(rawQuestions) ? rawQuestions : Object.keys(rawQuestions);

                // Fetch individual submission and marks
                const [submissionSnapshot, marksSnapshot] = await Promise.all([
                    get(ref(database, `ExamSubmissions/${testid}/${user.uid}`)),
                    get(ref(database, `Marks/${testid}/${user.uid}`))
                ]);
                
                const submissionData = submissionSnapshot.val();
                const userMarks = marksSnapshot.val() || {};

                if (submissionData) {
                    let totalMarksSum = 0;
                    let questionDetails = [];
                    
                    if (questionsDataArray.length > 0) {
                        questionsDataArray.forEach((qId, index) => {
                            const mark = userMarks[qId] || 0;
                            totalMarksSum += mark;
                            questionDetails.push({
                                id: qId,
                                questionNumber: index + 1,
                                correct: submissionData[qId] === 'true',
                                score: mark
                            });
                        });
                        
                        const score = Math.round(totalMarksSum / questionsDataArray.length);
                        const correctCount = questionsDataArray.filter(qId => submissionData[qId] === 'true').length;

                        setResult({
                            uid: user.uid,
                            studentName: user.displayName || user.email,
                            correctCount,
                            totalQuestions: questionsDataArray.length,
                            score,
                            questions: questionDetails,
                            timeTaken: submissionData.timeTaken || 0
                        });
                    }
                }

                // Fetch rankings and analysis if results are available
                // Always fetch and display rankings for anytime exams, or when results are available
                if (canShowResults || type === 'anytime') {
                    // Fetch eligible students
                    const eligibleRef = ref(database, `Exam/${testid}/Eligible`);
                    const eligibleSnapshot = await get(eligibleRef);
                    const eligibleData = eligibleSnapshot.exists() ? eligibleSnapshot.val() : {};
                    let eligibleList = [];
                    if (Array.isArray(eligibleData)) {
                        eligibleList = eligibleData;
                    } else if (typeof eligibleData === 'object' && eligibleData !== null) {
                        // Try both formats: {name: email} and {email: name}
                        eligibleList = Object.entries(eligibleData).map(([key, value]) => {
                            // Check if key looks like an email or value is an email
                            if (key.includes('@')) {
                                return { email: key, name: value || key };
                            } else if (typeof value === 'string' && value.includes('@')) {
                                return { email: value, name: key };
                            }
                            return { email: value, name: key };
                        });
                    }
                    console.log('Eligible students list:', eligibleList);

                    const rawQuestions = testSnapshot.val().questions || {};
                    const questionsDataArray = Array.isArray(rawQuestions) ? rawQuestions : Object.keys(rawQuestions);

                    // Fetch all submissions and all marks
                    const [allSubmissionsSnapshot, allMarksSnapshot] = await Promise.all([
                        get(ref(database, `ExamSubmissions/${testid}`)),
                        get(ref(database, `Marks/${testid}`))
                    ]);
                    
                    const allSubmissions = allSubmissionsSnapshot.val() || {};
                    const allMarks = allMarksSnapshot.val() || {};

                    // Fetch user data
                    const usersRef = ref(database, 'users');
                    const usersSnapshot = await get(usersRef);
                    const usersData = usersSnapshot.val() || {};

                    // Build rankings for all eligible students
                    const studentRankings = eligibleList
                        .filter(student => student && (student.email || student.name)) // Filter out null/empty entries
                        .map((student) => {
                            // Find UID by email
                            let uid = null;
                            let userData = null;
                            const studentEmail = student.email || student.name || '';
                            const studentName = student.name || student.email || '';

                            // Look for user by email first
                            for (const [userId, data] of Object.entries(usersData)) {
                                if (data && data.email && data.email.toLowerCase() === studentEmail.toLowerCase()) {
                                    uid = userId;
                                    userData = data;
                                    break;
                                }
                            }
                            // Fallback to email as UID if not found
                            if (!uid) uid = studentEmail || studentName;
                            if (!userData) userData = { name: studentName, email: studentEmail };

                            const subData = allSubmissions[uid];
                            const studentMarks = allMarks[uid] || {};
                            let totalMarksSum = 0;
                            let correctCount = 0;
                            let score = 0;
                            let timeTaken = null;
                            
                            if (subData && typeof subData === 'object' && questionsDataArray.length > 0) {
                                questionsDataArray.forEach(qId => {
                                    totalMarksSum += (studentMarks[qId] || 0);
                                    if (subData[qId] === 'true') correctCount++;
                                });
                                score = Math.round(totalMarksSum / questionsDataArray.length);
                                timeTaken = subData.timeTaken || 0;
                            }
                            return {
                                uid,
                                name: userData.name || userData.email || uid,
                                score: subData ? score : 0,
                                correctCount: subData ? correctCount : 0,
                                timeTaken: subData ? timeTaken : 0,
                                submitted: !!subData
                            };
                        });

                    // Also add any submissions from students not in eligibleList (e.g., allowAllStudents)
                    const submittedUids = new Set(studentRankings.map(s => s.uid));
                    Object.entries(allSubmissions).forEach(([uid, subData]) => {
                        if (submittedUids.has(uid) || typeof subData !== 'object' || !uid) return;
                        let name = uid;
                        if (usersData[uid]) {
                            name = usersData[uid].name || usersData[uid].email || uid;
                        }
                        
                        const studentMarks = allMarks[uid] || {};
                        let totalMarksSum = 0;
                        let correctCount = 0;
                        
                        if (questionsDataArray.length > 0) {
                            questionsDataArray.forEach(qId => {
                                totalMarksSum += (studentMarks[qId] || 0);
                                if (subData[qId] === 'true') correctCount++;
                            });
                        }
                        
                        const score = questionsDataArray.length > 0 ? Math.round(totalMarksSum / questionsDataArray.length) : 0;
                        
                        studentRankings.push({
                            uid,
                            name,
                            score,
                            correctCount,
                            timeTaken: subData.timeTaken || 0,
                            submitted: true
                        });
                    });
                    console.log('Student rankings before sort:', studentRankings);

                    // Ranking Logic: Submitted first, then Score (desc), then Time Taken (asc), then Name (asc)
                    studentRankings.sort((a, b) => {
                        // Submitted students first
                        if (a.submitted !== b.submitted) return a.submitted ? -1 : 1;
                        // Both submitted or both not submitted
                        if (a.submitted && b.submitted) {
                            // Sort by score descending
                            if (b.score !== a.score) return b.score - a.score;
                            // If same score, sort by time ascending
                            if (a.timeTaken >= 0 && b.timeTaken >= 0) return a.timeTaken - b.timeTaken;
                        }
                        return a.name.localeCompare(b.name);
                    });
                    console.log('Student rankings after sort:', studentRankings);

                    setRankings(studentRankings);

                    // Analysis Logic - only count submitted students for stats
                    if (studentRankings.length > 0) {
                        const submittedStudents = studentRankings.filter(r => r.submitted);
                        const myRank = studentRankings.findIndex(r => r.uid === user.uid) + 1;
                        const myPosition = submittedStudents.findIndex(r => r.uid === user.uid) + 1;

                        let avgScore = 0, topScore = 0;
                        if (submittedStudents.length > 0) {
                            avgScore = Math.round(submittedStudents.reduce((acc, r) => acc + (r.score || 0), 0) / submittedStudents.length);
                            topScore = submittedStudents[0].score || 0;
                        }

                        const percentile = submittedStudents.length > 1 ? Math.round(((submittedStudents.length - myPosition) / submittedStudents.length) * 100) : 0;

                        setAnalysis({
                            rank: myPosition > 0 ? myPosition : myRank,
                            totalStudents: submittedStudents.length,
                            percentile,
                            avgScore,
                            topScore
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching results:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResultData();
    }, [testid, user]);

    const formatTime = (seconds) => {
        if (!seconds) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const downloadPDF = () => {
        const input = pdfRef.current;
        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4', true);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgWidth = pdfWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`Results_${testName || testid}.pdf`);
        });
    };

    if (loading) return <LoadingPage message="Loading your results..." />;

    // For time range exams where results are not yet available
    if (examType === 'timeRange' && !resultsAvailable) {
        const endTimeDate = endTime ? new Date(endTime) : null;

        return (
            <div className="container mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 max-w-lg w-full text-center border border-gray-100 dark:border-gray-700">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-amber-600 dark:text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Results Available Soon</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        This is a time-scheduled exam. Results and class rankings will be available after the exam concludes.
                    </p>
                    {endTimeDate && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4 mb-6">
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">Exam Ends At</p>
                            <p className="text-lg font-bold text-amber-900 dark:text-amber-300">{endTimeDate.toLocaleString()}</p>
                        </div>
                    )}
                    <div className="inline-flex items-center space-x-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full">
                        <span className="w-2 h-2 bg-amber-600 dark:bg-amber-400 rounded-full animate-pulse"></span>
                        <span>Waiting for Exam Conclusion</span>
                    </div>
                </div>
            </div>
        );
    }

    if (examStatus === 'Completed' && !resultsAvailable && examType === 'timeRange') {
        const endTimeDate = endTime ? new Date(endTime) : null;

        return (
            <div className="container mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 max-w-lg w-full text-center border border-gray-100 dark:border-gray-700">
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Exam Submitted Successfully</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Your responses have been recorded successfully. Results and complete student rankings will be published after all participants complete their exam sessions.
                    </p>
                    {endTimeDate && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4 mb-6">
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">Check Results After</p>
                            <p className="text-lg font-bold text-amber-900 dark:text-amber-300">{endTimeDate.toLocaleString()}</p>
                        </div>
                    )}
                    <div className="inline-flex items-center space-x-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full">
                        <span className="w-2 h-2 bg-amber-600 dark:bg-amber-400 rounded-full animate-pulse"></span>
                        <span>Results Publication Pending</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="container mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 max-w-lg w-full text-center border border-gray-100 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Submission Found</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        We couldn't find any submission data for this exam. Please make sure you have completed and submitted the exam.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div ref={pdfRef} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-5xl mx-auto border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="text-center md:text-left mb-4 md:mb-0">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Performance Report</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">{testName || `Test ${testid}`}</p>
                    </div>
                    {analysis && (
                        <div className="flex items-center space-x-4">
                            <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none">
                                <p className="text-xs uppercase tracking-wider font-bold opacity-80">Your Rank</p>
                                <p className="text-3xl font-black">#{analysis.rank}<span className="text-lg opacity-60">/{analysis.totalStudents}</span></p>
                            </div>
                        </div>
                    )}
                </div>

                {result ? (
                    <div className="space-y-10">
                        {/* Analysis Grid or Pending Notice */}
                        {analysis ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Your Rank</p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">#{analysis.rank}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">out of {analysis.totalStudents}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Percentile</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.percentile}%</p>
                                </div>
                                <div className="bg-white dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Your Score</p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.score}%</p>
                                </div>
                                <div className="bg-white dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Class Average</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.avgScore}%</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex flex-col md:flex-row items-center justify-between">
                                <div className="mb-4 md:mb-0">
                                    <h4 className="text-lg font-bold text-blue-900 dark:text-blue-300">Your Performance</h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-400">Class rankings are being finalized and will appear shortly.</p>
                                </div>
                                <div className="bg-white dark:bg-blue-900/40 px-6 py-3 rounded-xl border border-blue-200 dark:border-blue-800">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Your Score</p>
                                    <p className="text-3xl font-black text-blue-600 dark:text-blue-300">{result.score}%</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Detailed Breakdown */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                    Question Breakdown
                                </h3>
                                <div className="grid grid-cols-5 md:grid-cols-8 gap-3">
                                    {result.questions.map((q) => (
                                        <div
                                            key={q.id}
                                            className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${q.correct
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/30 text-green-700 dark:text-green-400'
                                                : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30 text-red-700 dark:text-red-400'
                                                }`}
                                            title={`Question ${q.questionNumber}: ${q.correct ? 'Correct' : 'Incorrect'}`}
                                        >
                                            <span className="text-[10px] font-bold uppercase opacity-60 mb-0.5">Q{q.questionNumber}</span>
                                            {q.correct ? (
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4 text-center">
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time Taken</p>
                                        <p className="text-lg font-bold text-gray-800 dark:text-white">{formatTime(result.timeTaken)}</p>
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Efficiency</p>
                                        <p className="text-lg font-bold text-gray-800 dark:text-white">{Math.round(result.score / (result.timeTaken / 60 || 1))}%/m</p>
                                    </div>
                                </div>
                            </div>

                            {/* Ranking Table or Pending Notice */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    All Student Marks & Rankings
                                </h3>
                                {rankings.length > 0 ? (
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {rankings.map((student, idx) => (
                                            <div
                                                key={student.uid}
                                                className={`flex items-center p-4 rounded-xl border transition-all ${student.uid === user.uid
                                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white border-blue-500 scale-[1.02] shadow-lg shadow-blue-100 dark:shadow-none'
                                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-sm mr-4 ${student.uid === user.uid ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold truncate text-sm">{student.name}</p>
                                                    <p className={`text-[10px] opacity-70 ${student.uid === user.uid ? 'text-white' : ''}`}>
                                                        {student.submitted ? `${formatTime(student.timeTaken)} • ${student.correctCount} correct` : 'Not submitted'}
                                                    </p>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className="font-black text-lg">{student.submitted ? `${student.score}%` : '—'}</p>
                                                    {student.uid === user.uid && (
                                                        <p className="text-[10px] font-bold opacity-80 mt-0.5">You</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-6 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
                                            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">Preparing Your Rankings</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">Student performance data is being compiled...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No results found for your submission.</p>
                    </div>
                )}
            </div>

            {result && (
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={downloadPDF}
                        className="group flex items-center space-x-2 bg-gray-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-3 px-8 rounded-2xl transition-all duration-200 shadow-xl hover:-translate-y-1 active:translate-y-0"
                    >
                        <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="font-bold">Download Performance Report</span>
                    </button>
                </div>
            )}
        </div>
    );
}