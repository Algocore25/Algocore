import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { FiX, FiAlertCircle, FiClock } from 'react-icons/fi';
import { useScheduledExams } from '../hooks/useScheduledExams';
import { useAuth } from '../context/AuthContext';

const ExamNotificationBanner = () => {
    const { user } = useAuth();
    const { exams, loading } = useScheduledExams(user);
    const router = useRouter();
    const [isDismissed, setIsDismissed] = useState(false);

    // Debug logging
    React.useEffect(() => {
        if (user) {
            console.log('ExamNotificationBanner - User:', user.email);
            console.log('ExamNotificationBanner - Exams:', exams);
        }
    }, [exams, user]);

    // Don't show if exams are admin pages or if user is not logged in
    const isAdminPage = /^\/(admin|testedit|exammonitor|adminresults|monitor)/i.test(window.location.pathname);

    if (!user || isDismissed || isAdminPage || (exams.active.length === 0 && exams.upcoming.length === 0 && exams.anytime.length === 0)) {
        return null;
    }

    const totalScheduled = exams.active.length + exams.upcoming.length + exams.anytime.length;
    const hasActive = exams.active.length > 0;

    return (
        <div className={`fixed top-16 left-0 right-0 z-40 ${hasActive ? 'bg-green-50 dark:bg-green-900/20 border-b-2 border-green-500' : 'bg-amber-50 dark:bg-amber-900/20 border-b-2 border-amber-500'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    {hasActive ? (
                        <>
                            <div className="flex-shrink-0">
                                <FiAlertCircle className="h-5 w-5 text-green-600 dark:text-green-400 animate-pulse" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                                    🔴 Active Exam Now!
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                                    {exams.active.length} exam{exams.active.length !== 1 ? 's' : ''} is currently happening.
                                    {exams.upcoming.length > 0 && ` ${exams.upcoming.length} scheduled coming up.`}
                                    {exams.anytime.length > 0 && ` ${exams.anytime.length} anytime exam${exams.anytime.length !== 1 ? 's' : ''} pending.`}
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex-shrink-0">
                                <FiClock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                                    ⏰ Exams Waiting for You
                                </p>
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                                    {exams.upcoming.length > 0 && `${exams.upcoming.length} exam${exams.upcoming.length !== 1 ? 's' : ''} scheduled. `}
                                    {exams.anytime.length > 0 && `${exams.anytime.length} anytime exam${exams.anytime.length !== 1 ? 's' : ''} available anytime.`}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Quick action buttons */}
                <div className="flex items-center gap-2 ml-4">
                    <button
                        onClick={() => router.push('/tests')}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${hasActive
                            ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white'
                            : 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white'
                            }`}
                    >
                        View Exams
                    </button>
                    <button
                        onClick={() => setIsDismissed(true)}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Dismiss"
                    >
                        <FiX className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Exam list preview */}
            {(exams.active.length > 0 || exams.upcoming.length > 0 || exams.anytime.length > 0) && (
                <div className="bg-white/50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                            {exams.active.map((exam) => (
                                <button
                                    key={exam.id}
                                    onClick={() => router.push('/tests')}
                                    className="text-left p-2 rounded bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                >
                                    <p className="font-semibold text-green-800 dark:text-green-200 truncate">🔴 {exam.name}</p>
                                    <p className="text-green-700 dark:text-green-300">Active now</p>
                                </button>
                            ))}
                            {exams.upcoming.map((exam) => (
                                <button
                                    key={exam.id}
                                    onClick={() => router.push('/tests')}
                                    className="text-left p-2 rounded bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                                >
                                    <p className="font-semibold text-amber-800 dark:text-amber-200 truncate">⏰ {exam.name}</p>
                                    <p className="text-amber-700 dark:text-amber-300 text-xs">
                                        {exam.Properties?.startTime && new Date(exam.Properties.startTime).toLocaleDateString()}
                                    </p>
                                </button>
                            ))}
                            {exams.anytime.map((exam) => (
                                <button
                                    key={exam.id}
                                    onClick={() => router.push('/tests')}
                                    className="text-left p-2 rounded bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                    <p className="font-semibold text-blue-800 dark:text-blue-200 truncate">📚 {exam.name}</p>
                                    <p className="text-blue-700 dark:text-blue-300 text-xs">Take anytime</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamNotificationBanner;
