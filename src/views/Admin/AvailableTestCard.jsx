import React from 'react';
import { FiEdit } from 'react-icons/fi';
import { useRouter } from 'next/navigation';


export default function AvailableTestCard({ test, endTest }) {
  const router = useRouter();

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">{test.name}</h3>

        {/* Notification Badges for Time Range Exams */}
        {(test.Properties?.type === 'scheduled' || test.Properties?.type === 'timeRange') && (
          <div className="ml-3">
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
      </div>

      <div className="space-y-2 mt-3 text-sm text-gray-600 dark:text-gray-400">
        <p>Created: {new Date(test.createdAt).toLocaleDateString()}</p>
        <p>Visibility: <span className={`capitalize font-medium ${test.isVisible !== false ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>{test.isVisible !== false ? '✓ Visible' : '✗ Hidden'}</span></p>
      </div>

      {(test.Properties?.type === 'scheduled' || test.Properties?.type === 'timeRange') && (
        <div className="mt-4 space-y-1 text-xs font-medium">
          {test.Properties?.startTime && (
            <p className="flex items-center text-blue-600 dark:text-blue-400">
              <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
              Started: {new Date(test.Properties.startTime).toLocaleString()}
            </p>
          )}
          {test.Properties?.endTime && (
            <p className="flex items-center text-red-600 dark:text-red-400">
              <span className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full mr-2"></span>
              Deadline: {new Date(test.Properties.endTime).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <button
          onClick={() => endTest(test.id)}
          className="flex-1 bg-red-600 dark:bg-red-600 hover:bg-red-700 dark:hover:bg-red-700 text-white py-2 px-3 rounded-md transition-colors text-sm font-medium"
        >
          End Test
        </button>
        <button
          onClick={() => router.push(`/exammonitor/${test.id}`)}
          className="flex-1 bg-green-600 dark:bg-green-600 hover:bg-green-700 dark:hover:bg-green-700 text-white py-2 px-3 rounded-md transition-colors text-sm font-medium"
        >
          Progress
        </button>
      </div>
    </div>
  );
}
