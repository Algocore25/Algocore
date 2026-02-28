import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function AnimatedTestResults({ testResults = [], runsubmit }) {
  const [showResults, setShowResults] = useState(false);
  const [testStatus, setTestStatus] = useState('not-started');
  const [selectedTestIndex, setSelectedTestIndex] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (testResults.some(t => t.status === 'running')) {
      setTestStatus('running');
      setShowResults(false);
      return;
    }

    if (testResults.length > 0) {
      const allPassed = testResults.every(t => t.passed);
      setTestStatus(allPassed ? 'passed' : 'failed');

      const firstFailedIndex = testResults.findIndex(t => !t.passed);
      setSelectedTestIndex(firstFailedIndex !== -1 ? firstFailedIndex : 0);

      const timer = setTimeout(() => setShowResults(true), 300);
      return () => clearTimeout(timer);
    }
  }, [testResults]);

  const formatText = (text) => {
    if (!text && text !== 0) return 'No output';
    if (typeof text === 'string') {
      return text.split('\n').map((line, i) => (
        <div key={i} className={line ? '' : 'h-5'}>{line || ' '}</div>
      ));
    }
    return String(text);
  };

  if (runsubmit === 'none') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">No tests run yet</p>
      </div>
    );
  }

  // Loader
  if (testStatus === 'running' || !showResults) {
    const completedCount = testResults.filter(t => t.status === 'done').length;
    const totalCount = testResults.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
      <div className="w-full max-w-sm mx-auto py-20 flex flex-col items-center">
        <div className="w-full space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white flex items-center gap-2">
                {completedCount === totalCount ? 'Finalizing' : 'Running Analysis'}
                {completedCount !== totalCount && (
                  <span className="flex gap-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-pulse [animation-delay:200ms]" />
                    <span className="w-1 h-1 bg-gray-400 rounded-full animate-pulse [animation-delay:400ms]" />
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase">
                {completedCount} of {totalCount} test cases processed
              </p>
            </div>
            <span className="text-xs font-mono font-black text-gray-900 dark:text-white">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-900 dark:bg-white transition-all duration-700 ease-in-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-around pt-2 opacity-50">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Completed</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">{completedCount}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Remaining</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">{totalCount - completedCount}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Total Cases</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">{totalCount}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (testResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">No tests run yet</p>
      </div>
    );
  }

  const currentTest = testResults[selectedTestIndex];
  const isHiddenCase = !(runsubmit === 'run' || selectedTestIndex === 0 || selectedTestIndex === 1);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      {/* Neutral Summary Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            {testStatus === 'passed' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {testStatus === 'passed' ? 'Verification Successful' : 'Verification Failed'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {testResults.filter(t => t.passed).length} of {testResults.length} test cases passed
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
            {Math.round((testResults.filter(t => t.passed).length / testResults.length) * 100)}%
          </div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Score</div>
        </div>
      </div>

      {/* Modern Minimalistic Case Selector */}
      <div className="flex flex-wrap gap-2">
        {testResults.map((test, index) => {
          const isActive = index === selectedTestIndex;
          const isHidden = !(runsubmit === 'run' || index === 0 || index === 1);
          return (
            <button
              key={index}
              onClick={() => setSelectedTestIndex(index)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${isActive
                ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${test.passed ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>Case {index + 1}</span>
                {isHidden && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Clean Detail Card */}
      {currentTest && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${currentTest.passed ? 'bg-green-500' : 'bg-red-500'}`} />
              <h4 className="font-bold text-gray-900 dark:text-white">Case {selectedTestIndex + 1} Result</h4>
            </div>
            <div className="flex items-center gap-4">
              {isHiddenCase && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Hidden
                </span>
              )}
              <span className={`text-xs font-black uppercase tracking-wider ${currentTest.passed ? 'text-green-600' : 'text-red-600'}`}>
                {currentTest.passed ? 'Passed' : 'Failed'}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-5">
              {/* Input Section */}
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Input</span>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl font-mono text-xs border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 overflow-x-auto whitespace-pre">
                  {formatText(currentTest.input)}
                </div>
              </div>

              {/* Outputs Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Expected</span>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl font-mono text-xs border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 min-h-[80px] whitespace-pre">
                    {isHiddenCase ? <span className="italic opacity-30">Restricted</span> : formatText(currentTest.expected)}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Output</span>
                  <div className={`p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl font-mono text-xs border min-h-[80px] whitespace-pre ${currentTest.passed
                    ? 'border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300'
                    : 'border-red-100/50 dark:border-red-900/10 text-red-600 dark:text-red-400'
                    }`}>
                    {formatText(currentTest.output)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
