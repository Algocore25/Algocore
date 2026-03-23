// components/TestCard.jsx
import React from "react";

const TestCard = ({ test, onStart }) => {
  console.log(test);

  const schedulingType = test?.Properties?.type || 'anytime';
  const startTime = test.Properties?.startTime ? new Date(test.Properties.startTime) : null;
  const endTime = test.Properties?.endTime ? new Date(test.Properties.endTime) : null;
  const now = new Date();

  // Determine exam state based on scheduling
  const getExamState = () => {
    if (schedulingType === 'anytime') {
      return 'available'; // Always available for anytime exams
    }

    // For timeRange exams, check time windows
    if (startTime && now < startTime) {
      return 'notStarted'; // Before start time
    }
    if (endTime && now > endTime) {
      return 'ended'; // After end time
    }
    return 'inProgress'; // Within the time window
  };

  const examState = getExamState();
  const isTimeRangeExam = schedulingType === 'scheduled' || schedulingType === 'timeRange';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">{test.name}</h3>

        {/* Notification Badges for Time Range Exams */}
        {(test.Properties?.type === 'scheduled' || test.Properties?.type === 'timeRange') && (
          <div className="ml-3">
            {examState === 'notStarted' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 animate-pulse">
                ⏰ Coming Soon
              </span>
            )}
            {examState === 'inProgress' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 animate-pulse">
                🔴 Active Now
              </span>
            )}
            {examState === 'ended' && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                ✓ Ended
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 mt-3 text-sm text-gray-600 dark:text-gray-400">
        <p>Duration: {test.duration} minutes</p>
        <p>Questions: {test?.configure?.questionsPerType ? Object.values(test.configure.questionsPerType).reduce((a, b) => a + b, 0) : 0}</p>
      </div>

      {test.Properties?.type === 'scheduled' || test.Properties?.type === 'timeRange' ? (
        <div className="mt-4 space-y-2 text-xs font-medium">
          {startTime && (
            <p className="flex items-center text-blue-600 dark:text-blue-400">
              <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
              Starts: {startTime.toLocaleString()}
            </p>
          )}
          {endTime && (
            <p className="flex items-center text-red-600 dark:text-red-400">
              <span className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full mr-2"></span>
              Deadline: {endTime.toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        <p className="flex items-center text-green-600 dark:text-green-400 text-xs font-medium mt-4">
          <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-2 animate-pulse"></span>
          Anytime Access
        </p>
      )}

      <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
        {examState === 'notStarted' && (
          <button
            className="w-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 py-2 px-4 rounded-md cursor-not-allowed text-sm font-medium"
            disabled
          >
            Available {startTime?.toLocaleDateString()}
          </button>
        )}

        {(examState === 'inProgress' || examState === 'available') && (

          <button
            onClick={() => onStart(test.id)}
            className="w-full bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors font-medium text-sm"
          >
            View Exam
          </button>
        )}

        {examState === 'ended' && isTimeRangeExam && (
          <div className="space-y-2">
            <button
              onClick={() => onStart(test.id)}
              className="w-full bg-blue-600 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors font-medium text-sm"
            >
              View Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestCard;
