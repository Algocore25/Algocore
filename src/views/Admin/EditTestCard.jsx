import React, { useState } from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

import { ref, remove } from 'firebase/database';
import { database } from '../../firebase';
import { toast } from 'react-hot-toast';

export default function EditTestCard({ test, onDelete }) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine exam state for time range exams
  const schedulingType = test?.Properties?.type || 'anytime';
  const startTime = test.Properties?.startTime ? new Date(test.Properties.startTime) : null;
  const endTime = test.Properties?.endTime ? new Date(test.Properties.endTime) : null;
  const now = new Date();

  const getExamState = () => {
    if (schedulingType === 'anytime') {
      return 'available';
    }
    if (startTime && now < startTime) {
      return 'notStarted';
    }
    if (endTime && now > endTime) {
      return 'ended';
    }
    return 'inProgress';
  };

  const examState = getExamState();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await remove(ref(database, `Exam/${test.id}`));
      toast.success('Test deleted successfully');
      setIsConfirmOpen(false);
      if (onDelete) {
        onDelete(test.id);
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 group">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">{test.name}</h3>
          <div className="flex gap-2 items-center">
            {/* Notification Badges for Time Range Exams */}
            {(test.Properties?.type === 'scheduled' || test.Properties?.type === 'timeRange') && (
              <div>
                {examState === 'notStarted' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 animate-pulse whitespace-nowrap">
                    ⏰ Coming Soon
                  </span>
                )}
                {examState === 'inProgress' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 animate-pulse whitespace-nowrap">
                    🔴 Active Now
                  </span>
                )}
                {examState === 'ended' && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 whitespace-nowrap">
                    ✓ Ended
                  </span>
                )}
              </div>
            )}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/testedit/${test.id}`);
                }}
                className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                title="Edit test"
              >
                <FiEdit size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsConfirmOpen(true);
                }}
                className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                title="Delete test"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>Created: {new Date(test.createdAt).toLocaleDateString()}</p>
          <p>Visibility: <span className={`capitalize font-medium ${test.isVisible !== false ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>{test.isVisible !== false ? '✓ Visible' : '✗ Hidden'}</span></p>
        </div>

        {(test.Properties?.type === 'scheduled' || test.Properties?.type === 'timeRange') && (
          <div className="mt-4 space-y-1 text-xs font-medium">
            {test.Properties?.startTime && (
              <p className="flex items-center text-blue-600 dark:text-blue-400">
                <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
                Starts: {new Date(test.Properties.startTime).toLocaleString()}
              </p>
            )}
            {test.Properties?.endTime && (
              <p className="flex items-center text-red-600 dark:text-red-400">
                <span className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full mr-2"></span>
                Ends: {new Date(test.Properties.endTime).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Test
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "<strong>{test.name}</strong>"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsConfirmOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}