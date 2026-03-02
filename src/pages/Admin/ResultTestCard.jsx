import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, remove } from 'firebase/database';
import { FiTrash2 } from 'react-icons/fi';
import { database } from '../../firebase';

export default function ResultTestCard({ test, publishResults }) {
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

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
      setIsConfirmOpen(false);
    } catch (error) {
      console.error('Error deleting exam:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
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
          <button
            onClick={(event) => {
              event.stopPropagation();
              setIsConfirmOpen(true);
            }}
            className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete exam"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <p>Created: {new Date(test.createdAt).toLocaleDateString()}</p>
        <p>Visibility: <span className={`capitalize font-medium ${test.isVisible !== false ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>{test.isVisible !== false ? '✓ Visible' : '✗ Hidden'}</span></p>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate(`/adminresults/${test.id}`)}
          className="w-full bg-green-600 dark:bg-green-600 hover:bg-green-700 dark:hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium"
        >
          Show Results
        </button>
      </div>
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete exam?</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              This action cannot be undone. Are you sure you want to delete `{test.name}`?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
