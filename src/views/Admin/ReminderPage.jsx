import React, { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../../firebase';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    FiBell, FiSend, FiClock, FiCheckCircle, FiAlertCircle,
    FiUsers, FiCalendar, FiArrowRight, FiRefreshCw, FiMail,
    FiCheck, FiX, FiActivity
} from 'react-icons/fi';

const formatTimestamp = (ts, includeSeconds = false) => {
    if (!ts) return 'Unknown Time';
    try {
        let isoStr = typeof ts === 'string' ? ts : ts.toString();
        if (isoStr.includes('T') && isoStr.includes('_')) {
            const [datePart, timePart] = isoStr.split('T');
            let fixedTime = timePart.replace(/_([0-9]{3})Z?$/, '.$1Z');
            fixedTime = fixedTime.replace(/_/g, ':');
            if (!fixedTime.endsWith('Z') && !fixedTime.includes('+') && !fixedTime.includes('-')) {
                fixedTime += 'Z';
            }
            isoStr = `${datePart}T${fixedTime}`;
        }

        if (isoStr.includes('T')) {
            const d = new Date(isoStr);
            if (!isNaN(d)) {
                const opts = { hour: '2-digit', minute: '2-digit' };
                if (includeSeconds) opts.second = '2-digit';
                return d.toLocaleTimeString([], opts);
            }
        } else if (isoStr.includes('_')) {
            const parts = isoStr.split('_');
            if (parts.length >= 2) {
                return `${parts[0]}:${parts[1]}` + (includeSeconds && parts[2] ? `:${parts[2]}` : '');
            }
        }
        return ts.toString();
    } catch {
        return ts.toString();
    }
};

const getSlotFromTimestamp = (ts) => {
    if (!ts) return 'Unknown Slot';
    try {
        let isoStr = typeof ts === 'string' ? ts : ts.toString();
        if (isoStr.includes('T') && isoStr.includes('_')) {
            const [datePart, timePart] = isoStr.split('T');
            let fixedTime = timePart.replace(/_([0-9]{3})Z?$/, '.$1Z');
            fixedTime = fixedTime.replace(/_/g, ':');
            if (!fixedTime.endsWith('Z') && !fixedTime.includes('+') && !fixedTime.includes('-')) {
                fixedTime += 'Z';
            }
            isoStr = `${datePart}T${fixedTime}`;
        }

        if (isoStr.includes('T')) {
            const d = new Date(isoStr);
            if (!isNaN(d)) {
                return d.getUTCHours() < 12 ? 'Slot 1' : 'Slot 2';
            }
        } else if (isoStr.includes('_')) {
            const parts = isoStr.split('_');
            if (parts.length >= 1) {
                return parseInt(parts[0], 10) < 12 ? 'Slot 1' : 'Slot 2';
            }
        }
        return 'Unknown Slot';
    } catch {
        return 'Unknown Slot';
    }
};

const ReminderPage = () => {
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [allReports, setAllReports] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchAllReports();
    }, []);

    const fetchAllReports = async (newReportId = null) => {
        setLoading(true);
        try {
            const reportsRef = ref(database, 'remainders');
            const reportsSnap = await get(reportsRef);

            if (reportsSnap.exists()) {
                const dayData = reportsSnap.val();

                const flatReports = [];
                Object.keys(dayData).forEach(day => {
                    const reportsForDay = dayData[day];
                    if (typeof reportsForDay === 'object' && reportsForDay !== null) {
                        Object.keys(reportsForDay).forEach(ts => {
                            const reportObj = reportsForDay[ts];

                            if (reportObj && typeof reportObj === 'object') {
                                let details = [];

                                // Support format with explicit 'details' array or object
                                if (Array.isArray(reportObj.details)) {
                                    details = reportObj.details;
                                } else if (reportObj.details && typeof reportObj.details === 'object') {
                                    details = Object.entries(reportObj.details).map(([uid, data]) => ({ uid, ...data }));
                                } else {
                                    // Handle new format (UIDs directly under timestamp alongside summary)
                                    details = Object.entries(reportObj)
                                        .filter(([key, val]) =>
                                            key !== 'summary' &&
                                            key !== 'date' &&
                                            key !== 'timestamp' &&
                                            val &&
                                            typeof val === 'object' &&
                                            (val.email || val.name || val.status)
                                        )
                                        .map(([uid, data]) => ({
                                            uid,
                                            ...data
                                        }));
                                }

                                let summary = reportObj.summary;

                                // Calculate summary on the fly if missing
                                if (!summary && details.length > 0) {
                                    summary = {
                                        totalUsers: details.length,
                                        remindersSent: details.filter(d => d.status === 'Success').length,
                                        successCount: details.filter(d => d.status === 'Success').length,
                                        failedCount: details.filter(d => d.status === 'Failed').length
                                    };
                                }

                                if (summary || details.length > 0) {
                                    flatReports.push({
                                        id: ts,
                                        date: reportObj.date || day,
                                        timestamp: reportObj.timestamp || ts,
                                        summary: summary || { totalUsers: 0, remindersSent: 0 },
                                        details: details
                                    });
                                }
                            }
                        });
                    }
                });

                // Sort by date and then by timestamp descending
                const sorted = flatReports.sort((a, b) => {
                    if (a.date !== b.date) return b.date.localeCompare(a.date);
                    return b.id.localeCompare(a.id);
                });

                setAllReports(sorted);

                // Select either the newly created report or the latest one
                let targetSlot = selectedSlot;
                if (newReportId) {
                    const newRep = sorted.find(r => r.id === newReportId);
                    if (newRep) {
                        targetSlot = getSlotFromTimestamp(newRep.timestamp);
                        setSelectedDate(newRep.date);
                    }
                } else if (sorted.length > 0 && !selectedSlot) {
                    targetSlot = getSlotFromTimestamp(sorted[0].timestamp);
                    setSelectedDate(sorted[0].date);
                }

                if (targetSlot) {
                    setSelectedSlot(targetSlot);
                }
            } else {
                setAllReports([]);
            }
        } catch (error) {
            console.error("Failed to fetch reports:", error);
            toast.error("Failed to load historical reports");
        } finally {
            setLoading(false);
        }
    };

    const triggerReminders = async () => {
        setSending(true);
        const toastId = toast.loading("Checking submissions and sending reminders...");

        try {
            const response = await axios.post(
                "https://algocorefunctions.netlify.app/.netlify/functions/remainder"
            );

            if (response.data.success) {
                toast.success(response.data.message, { id: toastId });

                // Extract report ID from the returned path (remainders/date/id)
                const pathParts = response.data.reminderPath?.split('/') || [];
                const newId = pathParts[pathParts.length - 1];

                fetchAllReports(newId);
            } else {
                toast.error(response.data.message || "Failed to process reminders", { id: toastId });
            }
        } catch (error) {
            console.error("Reminder API failed:", error);
            toast.error(`Error: ${error.message}`, { id: toastId });
        } finally {
            setSending(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            "Success": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
            "Failed": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800",
            "Submitted": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border border-sky-200 dark:border-sky-800",
            "Skipped (No Email)": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
            "Skipped (Already Reminded in Slot)": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800"
        };

        const icons = {
            "Success": <FiCheck className="mr-1" />,
            "Failed": <FiX className="mr-1" />,
            "Submitted": <FiActivity className="mr-1" />,
            "Skipped (No Email)": <FiAlertCircle className="mr-1" />,
            "Skipped (Already Reminded in Slot)": <FiClock className="mr-1" />
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || styles["Skipped (No Email)"]}`}>
                {icons[status] || <FiAlertCircle className="mr-1" />} {status}
            </span>
        );
    };

    let report = null;
    let dailySlot1Sent = 0;
    let dailySlot2Sent = 0;

    if (selectedDate && allReports.length > 0) {
        const dayReports = allReports.filter(r => r.date === selectedDate);
        
        // Calculate daily totals
        dayReports.forEach(r => {
            if (r.details && Array.isArray(r.details)) {
                r.details.forEach(d => {
                    if (d.status === 'Success') {
                        const s = d.slot || getSlotFromTimestamp(d.timestamp);
                        if (s === 'Slot 1') dailySlot1Sent++;
                        if (s === 'Slot 2') dailySlot2Sent++;
                    }
                });
            }
        });

        // Compute merged report for the exact selected slot
        const slotReports = dayReports.filter(r => getSlotFromTimestamp(r.timestamp) === selectedSlot);
        if (slotReports.length > 0) {
            let totalUsers = 0;
            let remindersSent = 0;
            const detailsMap = new Map();

            // Reverse to process oldest first, latest overwrites
            [...slotReports].reverse().forEach(r => {
                if (r.details) {
                    r.details.forEach(d => {
                        detailsMap.set(d.uid, { ...d });
                    });
                }
            });

            const mergedDetails = Array.from(detailsMap.values());
            totalUsers = mergedDetails.length;
            remindersSent = mergedDetails.filter(d => d.status === 'Success').length;

            report = {
                date: selectedDate,
                slot: selectedSlot,
                id: slotReports[0].id, // loosely keep latest ID
                timestamp: slotReports[0].timestamp,
                summary: {
                    totalUsers,
                    remindersSent,
                    remaindersSent: remindersSent
                },
                details: mergedDetails.sort((a,b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
            };
        }
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] p-4 md:p-8">
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/20 text-white">
                                <FiBell size={28} />
                            </div>
                            Reminder Service
                        </h1>
                        <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium text-lg">
                            Monitor and trigger automated practice reminders for your users.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchAllReports()}
                            disabled={loading}
                            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                            title="Refresh Data"
                        >
                            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={20} />
                        </button>

                        <button
                            onClick={triggerReminders}
                            disabled={sending}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            {sending ? <FiRefreshCw className="animate-spin" /> : <FiSend />}
                            {sending ? "Processing..." : "Trigger Reminders"}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Sidebar: History List */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm overflow-hidden">
                            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">
                                Execution History
                            </h3>

                            <div className="space-y-5">
                                {allReports.length === 0 && !loading && (
                                    <div className="text-center py-10 text-slate-400 text-sm italic">
                                        No reports found
                                    </div>
                                )}

                                {allReports.length > 0 && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1 flex items-center gap-2">
                                                <FiCalendar size={14} /> Date
                                            </label>
                                            <div className="relative">
                                                <select
                                                    className="w-full p-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                                    value={selectedDate}
                                                    onChange={(e) => {
                                                        const newDate = e.target.value;
                                                        setSelectedDate(newDate);
                                                        const firstForDate = allReports.find(r => r.date === newDate);
                                                        if (firstForDate) setSelectedSlot(getSlotFromTimestamp(firstForDate.timestamp));
                                                    }}
                                                >
                                                    {[...new Set(allReports.map(r => r.date))].map(d => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 ml-1 flex items-center gap-2">
                                                <FiClock size={14} /> Slot
                                            </label>
                                            <div className="relative">
                                                <select
                                                    className="w-full p-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                                    value={selectedSlot}
                                                    onChange={(e) => setSelectedSlot(e.target.value)}
                                                >
                                                    <option value="Slot 1">Slot 1</option>
                                                    <option value="Slot 2">Slot 2</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Summary Stats (Mobile/Sidebar Version) */}
                        {report && report.summary && (
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-500/20">
                                    <div className="flex items-center justify-between mb-4">
                                        <FiUsers size={20} className="opacity-80" />
                                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg uppercase">Users</span>
                                    </div>
                                    <div className="text-3xl font-black">{report.summary.totalUsers}</div>
                                    <div className="text-xs font-medium opacity-80 mt-1 uppercase tracking-tight">Total Scanned</div>
                                </div>

                                <div className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl text-white shadow-xl shadow-emerald-500/20">
                                    <div className="flex items-center justify-between mb-4">
                                        <FiMail size={20} className="opacity-80" />
                                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg uppercase">Sent</span>
                                    </div>
                                    <div className="text-3xl font-black">{report.summary.remindersSent !== undefined ? report.summary.remindersSent : (report.summary.remaindersSent || 0)}</div>
                                    <div className="text-xs font-medium opacity-80 mt-1 uppercase tracking-tight">Emails Delivered</div>
                                </div>

                                <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                     <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                                     <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Daily Sent ({selectedDate})</h3>
                                     
                                     <div className="space-y-3">
                                         <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                             <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Slot 1 Total</span>
                                             <span className="text-lg font-black text-blue-600 dark:text-blue-400">{dailySlot1Sent}</span>
                                         </div>
                                         <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                             <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Slot 2 Total</span>
                                             <span className="text-lg font-black text-orange-600 dark:text-orange-400">{dailySlot2Sent}</span>
                                         </div>
                                     </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content: Report Table */}
                    <div className="lg:col-span-3 space-y-6">
                        {!report && !loading ? (
                            <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-20 text-center shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <FiClock className="text-slate-300" size={40} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No Reports Available</h2>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                    Trigger your first reminder execution to see the detailed analytics and status reports here.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[760px]">
                                {/* Table Header */}
                                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/20">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <FiActivity className="text-blue-500" />
                                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Detailed Report</h2>
                                        </div>
                                        <p className="text-slate-400 text-sm font-medium">
                                            Full breakdown of users and notification status
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="text-right mr-2 hidden md:block">
                                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Execution Date</div>
                                            <div className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-end gap-2">
                                                {report?.date || 'N/A'}
                                                {report && (
                                                    <span className="text-[10px] uppercase font-black bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md">
                                                        {getSlotFromTimestamp(report.timestamp)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block" />
                                        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                                            ID: {report?.id?.substring(0, 16)}...
                                        </div>
                                    </div>
                                </div>

                                {/* Table Body */}
                                <div className="flex-1 overflow-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-white dark:bg-slate-800 z-20">
                                            <tr>
                                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">User Profile</th>
                                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Email Address</th>
                                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Slot</th>
                                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Status</th>
                                                <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 text-right">Processed At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                            {Array.isArray(report?.details) && report.details.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-sm shadow-inner group-hover:scale-110 transition-transform">
                                                                {row.name?.charAt(0) || '?'}
                                                            </div>
                                                            <div className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate max-w-[150px]">
                                                                {row.name}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium italic">
                                                            <FiMail className="opacity-50" />
                                                            {row.email}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">{row.slot || 'Unknown'}</span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <StatusBadge status={row.status} />
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                                                            {formatTimestamp(row.timestamp, true)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Table Footer */}
                                <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-medium">
                                    <div className="text-slate-400 flex items-center gap-2">
                                        <FiCheckCircle className="text-emerald-500" />
                                        Admin report synced to <span className="text-blue-500 font-bold">algocore25@gmail.com</span>
                                    </div>
                                    <div className="text-slate-500">
                                        {report?.details?.length || 0} Total Entries
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Global Loader Indicator */}
            {loading && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-bounce">
                    <FiRefreshCw className="animate-spin text-blue-500" />
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Syncing with Firebase...</span>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}} />
        </div>
    );
};

export default ReminderPage;
