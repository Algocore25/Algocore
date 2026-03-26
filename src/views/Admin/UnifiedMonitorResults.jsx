import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import { BarChart3, Activity } from 'lucide-react';
import AdminResult from './AdminResults';
import ExamMonitor from './ExamMonitor';
import LoadingPage from '../LoadingPage';

const UnifiedMonitorResults = () => {
    const params = useParams();
    // Handle both testId (camelCase) and testid (lowercase) parameter names
    const testId = params.testId || params.testid;
    const [activeSubTab, setActiveSubTab] = useState('monitor');
    const [loading, setLoading] = useState(false);

    if (!testId) {
        return (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-200">Error: No Test ID provided in the URL.</p>
            </div>
        );
    }

    // Save preference to localStorage
    useEffect(() => {
        const saved = localStorage.getItem('monitorResultsSubTab');
        if (saved) {
            setActiveSubTab(saved);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('monitorResultsSubTab', activeSubTab);
    }, [activeSubTab]);

    if (loading) {
        return <LoadingPage message="Loading..." />;
    }

    return (
        <div className="space-y-6">
            {/* Sub Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex space-x-0" aria-label="Monitor and Results">
                        <button
                            onClick={() => setActiveSubTab('monitor')}
                            className={`flex-1 py-4 px-4 font-medium text-sm border-b-2 transition-all duration-200 ${activeSubTab === 'monitor'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <Activity className="inline mr-2 h-4 w-4" />
                            Live Monitor
                        </button>

                        <button
                            onClick={() => setActiveSubTab('results')}
                            className={`flex-1 py-4 px-4 font-medium text-sm border-b-2 transition-all duration-200 ${activeSubTab === 'results'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            <BarChart3 className="inline mr-2 h-4 w-4" />
                            Results & Analysis
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="p-6">
                    {activeSubTab === 'monitor' && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Live Exam Monitor
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Real-time monitoring of student activities, violations, and exam progress.
                            </p>
                            <ExamMonitor />
                        </div>
                    )}

                    {activeSubTab === 'results' && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Exam Results & Analysis
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Detailed results, performance metrics, and comprehensive analysis of student submissions.
                            </p>
                            <AdminResult testId={testId} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnifiedMonitorResults;
