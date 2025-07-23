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
    const { testid } = useParams();

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

                const currentTestTitle = exam.Properties?.testTitle || 'Untitled Test';
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
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.userName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.status === 'blocked' ? 'bg-red-100 text-red-800' :
                                                user.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    'bg-blue-100 text-blue-800'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${user.violations >= 3 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {user.violations}
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
