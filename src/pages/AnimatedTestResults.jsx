import React, { useEffect, useState, useRef } from 'react';

export default function AnimatedTestResults({ testResults }) {
  const total = testResults.length;
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed && r.status !== 'running').length;
  const running = testResults.filter(r => r.status === 'running').length;
  const [animatedCount, setAnimatedCount] = useState(0);
  const isProcessing = running > 0;
  const prevPassedRef = useRef(0);
  const animationFrame = useRef(null);

  // Calculate pass percentage based on animated count for smooth transition
  const passPercentage = total > 0 ? Math.round((animatedCount / total) * 100) : 0;

  useEffect(() => {
    // Store the previous passed count when it changes
    prevPassedRef.current = animatedCount;
  }, [animatedCount]);

  useEffect(() => {
    // Clean up any existing animation frame
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    // Only animate if we have test results and we're not already at the target
    if (total > 0 && animatedCount !== passed) {
      const duration = 1000; // Animation duration in ms
      const startTime = performance.now();
      const startValue = animatedCount;
      const endValue = passed;

      const animate = (currentTime) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Ease-out function for smooth deceleration
        const easeOutProgress = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = Math.round(startValue + (endValue - startValue) * easeOutProgress);
        setAnimatedCount(currentValue);

        if (progress < 1) {
          animationFrame.current = requestAnimationFrame(animate);
        }
      };

      animationFrame.current = requestAnimationFrame(animate);
    }

    // Cleanup function to cancel animation on unmount
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [passed, total]);

  // Reset animation when test results are reset
  useEffect(() => {
    if (testResults.length === 0) {
      setAnimatedCount(0);
    }
  }, [testResults]);

  // Format text to handle multiple lines and empty cases
  const formatText = (text) => {
    if (!text && text !== 0) return 'No output';
    if (typeof text === 'string') {
      // If it's a string, split by newlines and trim each line
      const lines = text.split('\n');
      if (lines.length === 1) return text;
      return lines.map((line, i) => (
        <div key={i} className={line ? '' : 'h-5'}>{line || ' '}</div>
      ));
    }
    return String(text);
  };

  // Find the first failed test case
  const firstFailedTest = testResults.find(test => !test.passed && test.status === 'done');

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Processing Indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Running {running} test case{running !== 1 ? 's' : ''}...
          </span>
        </div>
      )}

      {/* Results Summary */}
      <div className="bg-white dark:bg-dark-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-tertiary p-6 mb-6">
        <div className="flex flex-col items-center justify-between sm:flex-row gap-6">
          {/* Progress Circle */}
          <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                className="dark:opacity-30"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={passPercentage === 100 ? "#10B981" : "#EF4444"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - passPercentage / 100)}`}
                transform="rotate(-90 50 50)"
                className="transition-all duration-1000 ease-in-out"
              />
              {/* Center text */}
              <text
                x="50"
                y="50"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-2xl font-bold fill-gray-900 dark:fill-gray-100"
              >
                {passPercentage}%
              </text>
            </svg>
          </div>

          {/* Stats */}
          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {passed}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                Test Cases Passed
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {failed}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                Test Cases Failed
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {total}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Total Test Cases
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {running}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Running
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className={`mt-6 p-4 rounded-lg text-center ${
          isProcessing 
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
            : passPercentage === 100 
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          {isProcessing ? (
            <p>Test cases are being executed. Please wait...</p>
          ) : passPercentage === 100 ? (
            <p className="font-medium">🎉 All test cases passed successfully!</p>
          ) : (
            <div className="space-y-4">
              <p className="font-medium">❌ Some test cases failed. Please review your code and try again.</p>
              
              {firstFailedTest && (
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">First Failed Test Case:</h3>
                  
                  <div className="mb-3">
                    <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Input:</div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 font-mono text-sm max-h-40 overflow-y-auto whitespace-pre">
                      {formatText(firstFailedTest.input) || 'No input provided'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Expected Output:</div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border border-green-200 dark:border-green-900 font-mono text-sm max-h-40 overflow-y-auto whitespace-pre">
                        {formatText(firstFailedTest.expected) || 'No expected output provided'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Your Output:</div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border border-red-200 dark:border-red-900 font-mono text-sm max-h-40 overflow-y-auto whitespace-pre">
                        {formatText(firstFailedTest.output) || 'No output received'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
