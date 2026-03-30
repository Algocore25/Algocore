import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';


export default function AnimatedTestResults({ testResults = [], runsubmit }) {
  const [showResults, setShowResults] = useState(false);
  const [testStatus, setTestStatus] = useState('not-started');
  const [selectedTestIndex, setSelectedTestIndex] = useState(null);
  const [showDifference, setShowDifference] = useState(false);
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
    return String(text);
  };

  const getFirstMismatch = (expected, output) => {
    if (!expected && expected !== "" && !output && output !== "") return null;

    const normalize = (text) => {
      if (!text && text !== "") return [];
      const lines = String(text).split('\n');
      // Follow the logic in CodePage: remove trailing empty lines
      const processed = [...lines];
      while (processed.length > 0 && processed[processed.length - 1].trimEnd() === "") {
        processed.pop();
      }
      return processed;
    };

    const expLines = normalize(expected);
    const outLines = normalize(output);

    const maxLines = Math.max(expLines.length, outLines.length);
    for (let i = 0; i < maxLines; i++) {
      const exp = expLines[i];
      const out = outLines[i];

      const expTrim = exp !== undefined ? exp.trimEnd() : undefined;
      const outTrim = out !== undefined ? out.trimEnd() : undefined;

      if (expTrim !== outTrim) {
        return {
          line: i + 1,
          expected: exp !== undefined ? exp : "(end of output)",
          actual: out !== undefined ? out : "(end of output)"
        };
      }
    }
    return null;
  };

  const HighlightedCode = ({ text, otherText, passed, isExpected, showDiff }) => {
    if (!text && text !== 0 && text !== "") return <div className="p-4 text-gray-400 italic">Hidden Case</div>;

    const normalizeLines = (val) => {
      if (!val && val !== "") return [];
      const lines = String(val).split('\n');
      const processed = [...lines];
      while (processed.length > 0 && processed[processed.length - 1].trimEnd() === "") {
        processed.pop();
      }
      return processed;
    };

    const currentLines = normalizeLines(text);
    const comparisonLines = normalizeLines(otherText);
    const maxLines = Math.max(currentLines.length, comparisonLines.length);
    const displayLinesCount = showDiff ? maxLines : currentLines.length;

    return (
      <div className="font-mono text-xs overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-h-60 overflow-y-auto">
          {Array.from({ length: displayLinesCount }).map((_, i) => {
            const line = currentLines[i];
            const otherLine = comparisonLines[i];
            const lineTrim = line !== undefined ? line.trimEnd() : undefined;
            const otherTrim = otherLine !== undefined ? otherLine.trimEnd() : undefined;
            const isDifferent = showDiff && !passed && lineTrim !== otherTrim;

            return (
              <div
                key={i}
                className={`flex gap-3 px-4 py-0.5 min-h-[1.5rem] group ${isDifferent
                  ? isExpected
                    ? 'bg-red-50/50 dark:bg-red-900/10'
                    : 'bg-red-100/50 dark:bg-red-900/20'
                  : 'hover:bg-gray-100/50 dark:hover:bg-gray-700/30'
                  }`}
              >
                <span className="w-5 text-right opacity-20 select-none font-bold tabular-nums shrink-0">
                  {i + 1}
                </span>
                <span className={`whitespace-pre-wrap break-all ${isDifferent
                  ? 'text-red-600 dark:text-red-400 font-bold'
                  : passed ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                  {line !== undefined ? line : <span className="opacity-20 italic">(end of output)</span>}
                  {line === "" && (showDiff ? <span className="opacity-20 italic">(empty line)</span> : <span className="opacity-20 italic"></span>)}
                </span>
              </div>
            );
          })}
          {displayLinesCount === 0 && (
            <div className="p-4 text-gray-400 italic"> { "Empty output"}</div>
          )}
        </div>
      </div>
    );
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
      <div className="w-full flex flex-col items-center">
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
  // Only restrict if we are in an exam specific context where runsubmit is 'submit'
  // Or if the question specifically has hidden test cases (indices >= 2)
  const isHiddenCase = runsubmit === 'submit' && selectedTestIndex >= 2;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5 max-h-full overflow-y-visible">
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
          const isHidden = runsubmit === 'submit' && index >= 2;
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
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {/* Execution Time */}
              <div className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-800">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{currentTest.time ? `${currentTest.time}ms` : "N/A"}</span>
              </div>

              {/* Memory Used */}
              <div className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-800">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <span>{currentTest.memory ? `${currentTest.memory}KB` : 'N/A'}</span>
              </div>

              {/* Timeout Badge */}
              {currentTest.timeout && (
                <div className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800 animate-pulse">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                  </svg>
                  <span>TIMEOUT</span>
                </div>
              )}

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

              {/* Show Difference Toggle */}
              {!currentTest.passed && !isHiddenCase && (
                <button
                  onClick={() => setShowDifference(!showDifference)}
                  className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded border transition-colors uppercase tracking-widest cursor-pointer ${showDifference
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  title="Toggle differences highlighting"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showDifference ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                  {showDifference ? 'Hide Diff' : 'Show Diff'}
                </button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Diff Section if failed and not hidden */}
            {showDifference && !currentTest.passed && !isHiddenCase && (
              <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 space-y-3 shadow-inner">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Difference Detected</span>
                </div>

                {(() => {
                  const mismatch = getFirstMismatch(currentTest.expected, currentTest.output);
                  if (mismatch) {
                    return (
                      <div className="space-y-3">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                          First mismatch at <span className="text-red-600 dark:text-red-400 font-bold underline decoration-red-500/30 underline-offset-4">Line {mismatch.line}</span>
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter ml-1 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-gray-300" /> Expected
                            </span>
                            <div className="p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800 font-mono text-[11px] text-gray-900 dark:text-white break-all shadow-sm">
                              {mismatch.expected === "" ? <span className="italic opacity-30 text-[10px]">(Empty Line)</span> : mismatch.expected}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-bold text-red-400 uppercase tracking-tighter ml-1 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-red-300" /> Actual
                            </span>
                            <div className="p-3 bg-white dark:bg-gray-950 rounded-lg border border-red-100/50 dark:border-red-900/20 font-mono text-[11px] text-red-600 dark:text-red-400 break-all shadow-sm">
                              {mismatch.actual === "" ? <span className="italic opacity-30 text-[10px]">(Empty Line)</span> : mismatch.actual}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <p className="text-xs text-red-400 italic">
                      Outputs differ in length or whitespace.
                    </p>
                  );
                })()}
              </div>
            )}

            <div className="space-y-5">
              {/* Input Section */}
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Input</span>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl font-mono text-xs border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 max-h-40 overflow-y-auto whitespace-pre-wrap break-words">
                  {formatText(currentTest.input)}
                </div>
              </div>

              {/* Outputs Row - Now Vertical */}
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Expected</span>
                  <HighlightedCode
                    text={isHiddenCase ? null : currentTest.expected}
                    otherText={currentTest.output}
                    passed={currentTest.passed}
                    isExpected={true}
                    showDiff={showDifference}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Output</span>
                  <HighlightedCode
                    text={currentTest.output}
                    otherText={isHiddenCase ? null : currentTest.expected}
                    passed={currentTest.passed}
                    isExpected={false}
                    showDiff={showDifference}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
