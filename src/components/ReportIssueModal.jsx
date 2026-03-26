import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ref, push, set } from 'firebase/database';
import { database } from '../firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ReportIssueModal = ({ isOpen, onClose, targetId, context, targetType }) => {
    const [issueDesc, setIssueDesc] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!issueDesc.trim()) {
            toast.error('Description cannot be empty');
            return;
        }

        setLoading(true);
        try {
            const reportsRef = ref(database, 'reports');
            const newReportRef = push(reportsRef);
            await set(newReportRef, {
                description: issueDesc,
                targetId: targetId || 'Unknown',
                targetType: targetType || 'Unknown',
                context: context || 'Unknown',
                userId: user?.uid || 'Unknown',
                userEmail: user?.email || 'Unknown',
                status: 'Pending',
                timestamp: Date.now(),
            });
            toast.success('Issue reported successfully!');
            setIssueDesc('');
            onClose();
        } catch (error) {
            console.error('Error reporting issue:', error);
            toast.error('Failed to report issue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    onClick={onClose}
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Report an Issue</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Issue Description
                        </label>
                        <textarea
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            rows="4"
                            placeholder="Describe the issue you are facing..."
                            value={issueDesc}
                            onChange={(e) => setIssueDesc(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center"
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportIssueModal;
