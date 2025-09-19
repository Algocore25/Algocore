import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';


export default function AnimatedTestResults({ testResults = [] }) {
  const [isTesting, setIsTesting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [testStatus, setTestStatus] = useState('not-started'); // 'not-started', 'running', 'passed', 'failed'
  const [firstFailedTest, setFirstFailedTest] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    const running = testResults.some(test => test.status === 'running');
    const allPassed = testResults.length > 0 && testResults.every(test => test.passed);
    
    if (running) {
      setTestStatus('running');
      setShowResults(false);
    } else if (testResults.length > 0) {
      const failedTest = testResults.find(test => !test.passed);
      if (failedTest) {
        setFirstFailedTest(failedTest);
        setTestStatus('failed');
      } else {
        setTestStatus('passed');
      }
      
      // Show results after a short delay
      const timer = setTimeout(() => {
        setShowResults(true);
      }, 300);
      
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

  if (testStatus === 'not-started') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 mb-4 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
          No Tests Run Yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Run your code to see test results here
        </p>
      </div>
    );
  }

  if (testStatus === 'not-started') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className={`w-16 h-16 ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <svg className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} mb-2`}>
          No Test Results Yet
        </h3>
        <p className={`text-sm max-w-md ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Run or submit your code to view test results and see how your solution performs.
        </p>
      </div>
    );
  }

  if (!showResults) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="relative w-24 h-24 mb-6">
          <div className={`absolute inset-0 rounded-full border-4 ${theme === 'dark' ? 'border-blue-400' : 'border-blue-600'} border-t-transparent animate-spin`}></div>
          <div className={`absolute inset-2 rounded-full border-4 ${theme === 'dark' ? 'border-blue-300' : 'border-blue-400'} border-t-transparent animate-spin animation-delay-200`}></div>
        </div>
        <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'} mb-2`}>
          Running Tests...
        </h3>
        <p className={`text-sm text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Please wait while we execute your test cases
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {testStatus === 'passed' ? (
        <div className="text-center py-8">
          <div className={`w-16 h-16 ${theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <svg className={`w-8 h-8 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className={`text-xl font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
            All Tests Passed!
          </h3>
          <p className={theme === 'dark' ? 'text-green-400' : 'text-green-700'}>
            {testResults.length} test cases passed successfully
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className={`w-16 h-16 ${theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <svg className={`w-8 h-8 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className={`text-xl font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>
              Test Failed
            </h3>
            <p className={theme === 'dark' ? 'text-red-400' : 'text-red-700'}>
              {testResults.filter(t => !t.passed).length} of {testResults.length} test cases failed
            </p>
          </div>

          {firstFailedTest && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className={`px-4 py-3 ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'} border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>First Failed Test Case</h4>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Input</div>
                  <div className={`${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-gray-50 text-gray-800'} p-3 rounded border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} font-mono text-sm max-h-40 overflow-y-auto`}>
                    {formatText(firstFailedTest.input) || 'No input provided'}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col h-full">
                    <div className={`text-sm font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} mb-1`}>Expected Output</div>
                    <div className={`flex-1 ${theme === 'dark' ? 'bg-green-900/10 text-green-100' : 'bg-green-50 text-gray-800'} p-3 rounded border ${theme === 'dark' ? 'border-green-900' : 'border-green-200'} font-mono text-sm overflow-y-auto`}>
                      {formatText(firstFailedTest.expected) || 'No expected output provided'}
                    </div>
                  </div>
                  <div className="flex flex-col h-full">
                    <div className={`text-sm font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'} mb-1`}>Your Output</div>
                    <div className={`flex-1 ${theme === 'dark' ? 'bg-red-900/10 text-red-100' : 'bg-red-50 text-gray-800'} p-3 rounded border ${theme === 'dark' ? 'border-red-900' : 'border-red-200'} font-mono text-sm overflow-y-auto`}>
                      {formatText(firstFailedTest.output) || 'No output'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
