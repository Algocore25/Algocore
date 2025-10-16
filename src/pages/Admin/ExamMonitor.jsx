import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, onValue, get, update, set } from 'firebase/database';
import { database } from '../../firebase';
import toast from 'react-hot-toast';
import LoadingPage from '../LoadingPage';

const ExamMonitor = () => {
    const [monitoredData, setMonitoredData] = useState([]);
    const [testTitle, setTestTitle] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRows, setExpandedRows] = useState({});
    const [violationDetails, setViolationDetails] = useState({});
    const [loadingViolations, setLoadingViolations] = useState({});
    const { testid } = useParams();

    const fetchViolationDetails = async (userId) => {
        if (violationDetails[userId]) {
            // Already fetched, just toggle
            return;
        }

        setLoadingViolations(prev => ({ ...prev, [userId]: true }));

        try {
            const violationsRef = ref(database, `Exam/${testid}/Violations/${userId}`);
            const snapshot = await get(violationsRef);
            
            if (snapshot.exists()) {
                const violations = snapshot.val();
                const violationsArray = Object.entries(violations).map(([id, data]) => ({
                    id,
                    ...data
                })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first
                
                setViolationDetails(prev => ({ ...prev, [userId]: violationsArray }));
            } else {
                setViolationDetails(prev => ({ ...prev, [userId]: [] }));
            }
        } catch (error) {
            console.error('Error fetching violation details:', error);
            toast.error('Failed to load violation details.');
            setViolationDetails(prev => ({ ...prev, [userId]: [] }));
        } finally {
            setLoadingViolations(prev => ({ ...prev, [userId]: false }));
        }
    };

    const toggleRow = async (userId) => {
        const isExpanded = expandedRows[userId];
        
        if (!isExpanded) {
            await fetchViolationDetails(userId);
        }
        
        setExpandedRows(prev => ({ ...prev, [userId]: !isExpanded }));
    };

    const unblockUser = async (userId) => {
        if (!window.confirm('Are you sure you want to unblock this user and reset their violations to 0?')) {
            return;
        }
        try {
            const progressRef = ref(database, `Exam/${testid}/Properties/Progress/${userId}`);
            const violationRef = ref(database, `Exam/${testid}/Properties2/Progress/${userId}`);

            // Update status to 'started' and reset violations to 0
            await update(progressRef, { status: 'started' });
            await set(violationRef, 0);

            toast.success('User has been unblocked.');
        } catch (error) {
            console.error('Error unblocking user:', error);
            toast.error('Failed to unblock user.');
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getReasonLabel = (reason) => {
        const labels = {
            'fullscreen_exit': 'Exited Fullscreen',
            'window_blur': 'Window Lost Focus',
            'tab_switch': 'Tab Switch / Page Hidden',
            'mouse_leave': 'Mouse Left Screen'
        };
        return labels[reason] || reason;
    };

    const getReasonColor = (reason) => {
        const colors = {
            'fullscreen_exit': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            'window_blur': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
            'tab_switch': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            'mouse_leave': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
        };
        return colors[reason] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    };

    useEffect(() => {
        if (!testid) {
            setError('No Test ID provided in the URL.');
            setIsLoading(false);
            return;
        }

        const examRef = ref(database, `Exam/${testid}`);

        const unsubscribe = onValue(examRef, async (snapshot) => {
            try {
                const exam = snapshot.val();
                if (!exam) {
                    setError('The specified test does not exist.');
                    setMonitoredData([]);
                    setIsLoading(false);
                    return;
                }

                console.log(exam)
                const currentTestTitle = exam.name || 'Untitled Test';
                setTestTitle(currentTestTitle);

                const usersRef = ref(database, 'users');
                const usersSnapshot = await get(usersRef);
                const users = usersSnapshot.val() || {};

                const monitoredUsers = [];
                const progress = exam.Properties?.Progress;
                const violations = exam.Properties2?.Progress;

                if (progress) {
                    for (const userId in progress) {
                        const userProgress = progress[userId];
                        const userViolations = violations?.[userId] ?? 0;
                        const userInfo = users[userId] || { name: 'Unknown User' };

                        monitoredUsers.push({
                            id: `${testid}-${userId}`,
                            userId: userId,
                            userName: userInfo.name,
                            status: userProgress.status || 'In Progress',
                            violations: userViolations,
                        });
                    }
                }

                setMonitoredData(monitoredUsers);
            } catch (err) {
                console.error("Error processing exam data:", err);
                setError('Failed to load and process exam data.');
            } finally {
                setIsLoading(false);
            }
        }, (err) => {
            console.error("Firebase onValue error:", err);
            setError('Failed to connect to the database.');
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [testid]);

    if (isLoading) {
        return (
            <LoadingPage message="Loading Exam Data, please wait..."/>
        );
    }

    if (error) {
        return <div className="text-center text-red-500 mt-10">Error: {error}</div>;
    }

    return (
        <div className="container mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">Real-Time Exam Monitor</h1>
            <h2 className="text-xl font-semibold mb-6 text-blue-600 dark:text-blue-400">{testTitle}</h2>

            <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Violations</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {monitoredData.length > 0 ? (
                            monitoredData.map((user) => (
                                <React.Fragment key={user.id}>
                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.userName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.status === 'blocked' ? 'bg-red-100 text-red-800' :
                                                    user.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        'bg-blue-100 text-blue-800'}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold ${user.violations >= 2 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {user.violations}
                                                </span>
                                                {user.violations > 0 && (
                                                    <button
                                                        onClick={() => toggleRow(user.userId)}
                                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs underline"
                                                    >
                                                        {expandedRows[user.userId] ? 'Hide Details' : 'View Details'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {user.status === 'blocked' && (
                                                <button
                                                    onClick={() => unblockUser(user.userId)}
                                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors duration-200"
                                                >
                                                    Unblock
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {expandedRows[user.userId] && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                                                {loadingViolations[user.userId] ? (
                                                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading violations...</div>
                                                ) : violationDetails[user.userId]?.length > 0 ? (
                                                    <div className="space-y-3">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Violation History ({violationDetails[user.userId].length} total)</h4>
                                                        <div className="max-h-96 overflow-y-auto space-y-2">
                                                            {violationDetails[user.userId].map((violation, idx) => (
                                                                <div key={violation.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                                                                    <div className="flex items-start justify-between mb-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-gray-500 dark:text-gray-400 text-xs font-mono">#{idx + 1}</span>
                                                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${getReasonColor(violation.reason)}`}>
                                                                                {getReasonLabel(violation.reason)}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {formatTimestamp(violation.timestamp)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                                                                        {violation.details?.duration && (
                                                                            <div>
                                                                                <span className="text-gray-500 dark:text-gray-400">Duration: </span>
                                                                                <span className="font-semibold text-gray-700 dark:text-gray-300">{violation.details.duration}</span>
                                                                            </div>
                                                                        )}
                                                                        {violation.details?.gracePeriod && (
                                                                            <div>
                                                                                <span className="text-gray-500 dark:text-gray-400">Grace Period: </span>
                                                                                <span className="font-semibold text-gray-700 dark:text-gray-300">{violation.details.gracePeriod}</span>
                                                                            </div>
                                                                        )}
                                                                        {violation.windowSize && (
                                                                            <div>
                                                                                <span className="text-gray-500 dark:text-gray-400">Window: </span>
                                                                                <span className="font-mono text-gray-700 dark:text-gray-300">{violation.windowSize}</span>
                                                                            </div>
                                                                        )}
                                                                        {violation.screenSize && (
                                                                            <div>
                                                                                <span className="text-gray-500 dark:text-gray-400">Screen: </span>
                                                                                <span className="font-mono text-gray-700 dark:text-gray-300">{violation.screenSize}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {violation.userAgent && (
                                                                        <div className="mt-2 text-xs">
                                                                            <span className="text-gray-500 dark:text-gray-400">Browser: </span>
                                                                            <span className="text-gray-600 dark:text-gray-400 font-mono text-[10px]">
                                                                                {violation.userAgent.substring(0, 80)}...
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">No violation details found.</div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No active users found for this test.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExamMonitor;
