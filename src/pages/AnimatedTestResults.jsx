import React, { useEffect, useState } from 'react';

export default function AnimatedTestResults({ testResults }) {
  const total = testResults.length;
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed && r.status !== 'running').length;
  const [animatedCount, setAnimatedCount] = useState(0);

  const isProcessing = testResults.some(r => r.status === 'running');

  useEffect(() => {
    let frame;
    let count = 0;

    const animate = () => {
      if (count < passed) {
        count += 1;
        setAnimatedCount(count);
        frame = setTimeout(animate, 100);
      } else {
        setAnimatedCount(passed);
        clearTimeout(frame);
      }
    };

    count = 0;
    setAnimatedCount(0);
    animate();

    return () => clearTimeout(frame);
  }, [passed, total]);

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Spinning Processing Loader */}
      {isProcessing && (
        <div className="flex items-center justify-center mb-4 text-blue-500">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-2"></div>
          <span className="text-sm font-medium">Processing test cases...</span>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="relative w-64 h-6 bg-gray-200 dark:bg-dark-tertiary rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500"
            style={{ width: `${total ? (animatedCount / total) * 100 : 0}%` }}
          />
        </div>
        <div className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-4">
          <span className="text-green-500">{animatedCount} Passed</span>
          <span className="text-red-500">{failed} Failed</span>
          <span className="text-gray-500">{total} Total</span>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-dark-tertiary rounded-lg shadow bg-white dark:bg-dark-secondary">
        {testResults.map((res, idx) => (
          <div key={idx} className="flex items-center px-4 py-3 gap-4">
            <span className={`text-2xl ${res.status === 'running' ? 'text-yellow-500 animate-pulse' : res.passed ? 'text-green-500' : 'text-red-500'}`}>
              {res.status === 'running' ? '⏳' : res.passed ? '✔️' : '❌'}
            </span>
            <div className="flex-1">
              <div className="text-gray-800 dark:text-gray-100 font-mono text-sm">
                <span className="font-semibold">Input:</span> {res.input || '-'}
              </div>
              <div className="text-gray-600 dark:text-gray-300 font-mono text-xs mt-1 space-y-1">
                <div><span className="font-semibold">Expected:</span> {res.expected}</div>
                <div>
                  <span className="font-semibold">Your Output:</span>
                  <span className={`ml-2 font-bold text-base ${res.passed ? 'text-green-500' : 'text-red-500'}`}>{res.output || '...'}</span>
                </div>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${res.status === 'running' ? 'bg-yellow-100 text-yellow-700' : res.passed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {res.status === 'running' ? 'Running' : res.passed ? 'Passed' : 'Failed'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
