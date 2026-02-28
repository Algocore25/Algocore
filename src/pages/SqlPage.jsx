'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';
import { useParams, useNavigate } from "react-router-dom";

import { Icons, languageTemplates } from './constants';
import { registerIntelliSense, INTELLISENSE_OPTIONS } from '../hooks/useMonacoIntelliSense';

import { database } from "../firebase";
import { ref, get, set, child } from "firebase/database";

import AnimatedTestResults from './AnimatedTestResults';
import { executeCode } from './api';
import { useAuth } from '../context/AuthContext';
import AISuggestionsTab from '../components/AISuggestions';

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { setItemWithExpiry, getItemWithExpiry } from "../utils/storageWithExpiry";
import { decodeShort } from '../utils/urlEncoder';

// Helper: Render pipe-separated SQL output as a styled table
const SqlResultTable = ({ text, className = '' }) => {
  if (!text || typeof text !== 'string') return <span className="text-gray-400 italic">No output</span>;
  const lines = text.split('\n').filter(l => l.trim() !== '');
  if (lines.length === 0) return <span className="text-gray-400 italic">Empty result</span>;

  const rows = lines.map(line => line.split('|'));
  const maxCols = Math.max(...rows.map(r => r.length));

  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <table className="min-w-full text-sm">
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-1.5 font-mono text-xs text-gray-800 dark:text-gray-200 whitespace-nowrap">
                  {cell.trim()}
                </td>
              ))}
              {/* pad empty cells if needed */}
              {Array.from({ length: maxCols - row.length }).map((_, k) => (
                <td key={`pad-${k}`} className="px-3 py-1.5"></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper: Parse and display CREATE TABLE schema visually
const SqlSchemaDisplay = ({ schema }) => {
  if (!schema) return null;

  // Parse CREATE TABLE statements
  const tableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(([^)]+)\)/gi;
  const tables = [];
  let match;
  while ((match = tableRegex.exec(schema)) !== null) {
    const tableName = match[1];
    const columnsStr = match[2];
    const columns = columnsStr.split(',').map(col => {
      const parts = col.trim().split(/\s+/);
      return { name: parts[0], type: parts.slice(1).join(' ') };
    });
    tables.push({ name: tableName, columns });
  }

  // Parse INSERT statements to count rows per table
  const insertRegex = /INSERT\s+INTO\s+(\w+)/gi;
  const rowCounts = {};
  while ((match = insertRegex.exec(schema)) !== null) {
    const tbl = match[1];
    rowCounts[tbl] = (rowCounts[tbl] || 0) + 1;
  }

  if (tables.length === 0) {
    return (
      <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap border border-gray-200 dark:border-gray-700">
        {schema}
      </pre>
    );
  }

  return (
    <div className="space-y-3">
      {tables.map((table, idx) => (
        <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
              </svg>
              <span className="font-semibold text-sm text-blue-700 dark:text-blue-300">{table.name}</span>
            </div>
            {rowCounts[table.name] && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{rowCounts[table.name]} rows</span>
            )}
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-4 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Column</th>
                <th className="px-4 py-1.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {table.columns.map((col, ci) => (
                <tr key={ci} className={ci % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}>
                  <td className="px-4 py-1.5 font-mono text-xs text-gray-800 dark:text-gray-200">{col.name}</td>
                  <td className="px-4 py-1.5 font-mono text-xs text-gray-500 dark:text-gray-400">{col.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

// SQL-specific test results display with table formatting
const SqlAnimatedTestResults = ({ testResults = [], runsubmit }) => {
  const [selectedTestIndex, setSelectedTestIndex] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (testResults.length > 0) {
      const firstFailedIndex = testResults.findIndex(t => !t.passed);
      setSelectedTestIndex(firstFailedIndex !== -1 ? firstFailedIndex : 0);
    }
  }, [testResults]);

  if (runsubmit === 'none' || testResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">No tests run yet</p>
      </div>
    );
  }

  const allPassed = testResults.every(t => t.passed);
  const currentTest = testResults[selectedTestIndex];
  const isHiddenCase = !(runsubmit === 'run' || selectedTestIndex === 0 || selectedTestIndex === 1);
  const testStatus = allPassed ? 'passed' : 'failed';

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Summary Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${testStatus === 'passed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
            {testStatus === 'passed' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div>
            <h3 className={`text-xl font-bold ${testStatus === 'passed' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {testStatus === 'passed' ? 'All Tests Passed' : `${testResults.filter(t => !t.passed).length} Tests Failed`}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Successfully executed {testResults.length} test cases
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Score:</span>
          <span className={`text-lg font-bold ${testStatus === 'passed' ? 'text-green-600' : 'text-blue-600'}`}>
            {Math.round((testResults.filter(t => t.passed).length / testResults.length) * 100)}%
          </span>
        </div>
      </div>

      {/* Main Results Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col md:flex-row min-h-[400px]">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-48 bg-gray-50 dark:bg-gray-800/30 border-r border-gray-200 dark:border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Test Cases</span>
            <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
              {testResults.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {testResults.map((test, index) => {
              const isActive = index === selectedTestIndex;
              const isHidden = !(runsubmit === 'run' || index === 0 || index === 1);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedTestIndex(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm'
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full ${test.passed ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  <span className="flex-1 text-left">Case {index + 1}</span>
                  {isHidden && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  {isActive && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {currentTest && (
            <>
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-900 dark:text-white">Case {selectedTestIndex + 1}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${currentTest.passed
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30'
                    }`}>
                    {currentTest.passed ? 'Passed' : 'Failed'}
                  </span>
                </div>
                {isHiddenCase && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Hidden Test Case
                  </span>
                )}
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Expected Block */}
                  <div>
                    <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Expected Output</span>
                    <div className="bg-green-50/50 dark:bg-green-900/10 rounded-xl p-4 border border-green-100 dark:border-green-900/30 min-h-[100px]">
                      {isHiddenCase ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 opacity-60 italic py-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Content Hidden</span>
                        </div>
                      ) : currentTest.expected?.includes('|') ? (
                        <SqlResultTable text={currentTest.expected} className="border-green-200 dark:border-green-800" />
                      ) : (
                        <div className="font-mono text-sm text-gray-800 dark:text-green-200 whitespace-pre-wrap">
                          {currentTest.expected || 'No output'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actual Block */}
                  <div>
                    <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Your Output</span>
                    <div className={`${currentTest.passed
                        ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30'
                        : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                      } rounded-xl p-4 border min-h-[100px]`}>
                      {currentTest.output?.includes('|') ? (
                        <SqlResultTable text={currentTest.output} className={currentTest.passed ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'} />
                      ) : (
                        <div className={`font-mono text-sm whitespace-pre-wrap ${currentTest.passed ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          {currentTest.output || 'No output'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


function SqlPage({ data, navigation }) {
  const [code, setCode] = useState("");
  const [runsubmit, setRunSubmit] = useState('none');

  // Prevent copy, cut, and paste
  useEffect(() => {
    const preventDefault = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Disable right-click context menu
    const preventContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // More aggressive paste prevention
    const blockPaste = (e) => {
      // Block all paste events
      e.preventDefault();
      e.stopPropagation();

      // Clear clipboard data if possible
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', '');
        e.clipboardData.clearData();
      }

      // Show a message to the user
      toast.error('Copy-paste is disabled in this environment');
      return false;
    };

    // Block drag and drop
    const blockDragDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Add event listeners with capture phase
    const options = { capture: true, passive: false };

    // Block copy/paste events
    document.addEventListener('copy', preventDefault, options);
    document.addEventListener('cut', preventDefault, options);
    document.addEventListener('paste', blockPaste, options);
    document.addEventListener('contextmenu', preventContextMenu, options);

    // Block drag and drop
    document.addEventListener('drop', blockDragDrop, options);
    document.addEventListener('dragover', blockDragDrop, options);

    // Disable keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+X, etc.)
    const preventShortcuts = (e) => {
      const isPaste = (e.ctrlKey || e.metaKey) && ['v', 'V', 'Insert'].includes(e.key);
      const isCopy = (e.ctrlKey || e.metaKey) && ['c', 'C', 'c', 'C', 'Insert', 'F3', 'F16', 'F24'].includes(e.key);
      const isCut = (e.ctrlKey || e.metaKey) && ['x', 'X', 'Delete'].includes(e.key);

      if (isPaste || isCopy || isCut) {
        e.preventDefault();
        e.stopPropagation();

        // Clear any selected text
        window.getSelection().removeAllRanges();

        // Show feedback
        if (isPaste) {
          toast.error('Pasting is disabled in this environment');
        }

        return false;
      }
    };

    document.addEventListener('keydown', preventShortcuts, { capture: true });

    // Block contentEditable elements
    const blockEditable = (e) => {
      if (e.target.isContentEditable) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('paste', blockEditable, { capture: true });

    // Block iframe events
    window.addEventListener('blur', () => {
      if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
        document.activeElement.blur();
      }
    });

    // Cleanup function
    return () => {
      document.removeEventListener('copy', preventDefault, options);
      document.removeEventListener('cut', preventDefault, options);
      document.removeEventListener('paste', blockPaste, options);
      document.removeEventListener('contextmenu', preventContextMenu, options);
      document.removeEventListener('drop', blockDragDrop, options);
      document.removeEventListener('dragover', blockDragDrop, options);
      document.removeEventListener('keydown', preventShortcuts, { capture: true });
      document.removeEventListener('paste', blockEditable, { capture: true });
      window.removeEventListener('blur', () => { });
    };
  }, []);
  const [activeTab, setActiveTab] = useState('description');
  const [output, setOutput] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [testCaseTab, setTestCaseTab] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(45);
  const [selectedLanguage, setSelectedLanguage] = useState('sql');
  const { theme } = useTheme();
  const [questionData, setQuestionData] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [testCasesrun, setTestCases] = useState([{ input: '', expectedOutput: '' }]);
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  const adjustTextareaHeight = (element) => {
    if (element) {
      // Force reflow to ensure scrollHeight is accurate
      element.style.height = 'auto';
      // Set height to scrollHeight, but ensure it's at least 80px and at most 200px
      const newHeight = Math.min(200, Math.max(80, element.scrollHeight));
      element.style.height = newHeight + 'px';
    }
  };

  useEffect(() => {
    // Use a small timeout to ensure the DOM is fully updated
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
      }
      if (outputRef.current) {
        outputRef.current.style.height = 'auto';
        outputRef.current.style.height = outputRef.current.scrollHeight + 'px';
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [testCaseTab, testCasesrun, activeTab]);

  const [submissions, setSubmissions] = useState([]);
  const [submissionTrigger, setSubmissionTrigger] = useState(0); // New state to trigger submission refresh

  const { course: encCourse, subcourse: encSubcourse, questionId: encQuestionId } = useParams();
  const course = decodeShort(encCourse);
  const subcourse = decodeShort(encSubcourse);
  const questionId = decodeShort(encQuestionId);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Refs for cleanup and debouncing
  const saveTimeoutRef = useRef(null);
  const editorRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const layoutTimeoutRef = useRef(null);

  const sanitizeKey = (key) => {
    if (!key) return '';
    return key.replace(/[.#$/\[\]:]/g, '_');
  };

  const logSubmission = async (status, submittedCode) => {
    console.log("logging submission");
    console.log(user?.email);

    if (!user?.uid) return;

    const timestamp = new Date().toISOString();
    const safeCourse = sanitizeKey(course);
    const safeSubcourse = sanitizeKey(subcourse);
    const safeQuestionId = sanitizeKey(questionId);
    const safeTimestamp = sanitizeKey(timestamp);

    const path = `Submissions/${user.uid}/${safeCourse}/${safeSubcourse}/${safeQuestionId}/${safeTimestamp}`;

    try {
      await set(ref(database, path), {
        language: selectedLanguage,
        status,
        code: submittedCode,
      });
      console.log("Submission logged successfully.");
      setSubmissionTrigger(prev => prev + 1); // Trigger submission refresh
    } catch (error) {
      console.error("Error logging submission:", error);
    }
  };

  const handleSubmit2 = async () => {
    const testCases = questionData.testcases;
    const initialResults = testCases.map(tc => ({
      input: tc.input,
      expected: tc.expectedOutput,
      output: '',
      passed: false,
      status: 'running',
    }));

    console.log(initialResults);

    setTestResults(initialResults);
    setOutput(null);
    setActiveTab('output');
    setRunSubmit('submit');

    const updatedResults = [...initialResults];

    const promises = testCases.map(async (tc, i) => {
      const { input, expectedOutput } = tc;
      try {
        const sqlSourceCode = (questionData?.schema || "") + "\n\n" + code;
        const { run: result } = await executeCode('sql', sqlSourceCode, input);

        let currentResult;

        if (questionData.testcases[2]?.input === "regex2") {
          const regex = new RegExp(/^PID of example\.c = \d+\n[A-Za-z]{3} [A-Za-z]{3} +\d{1,2} \d{2}:\d{2}:\d{2} [A-Z]+ \d{4}\n?$/);
          currentResult = {
            input,
            expected: expectedOutput,
            output: result.output,
            passed: regex.test(result.output),
            status: 'done',
          };
        }
        else if (questionData.testcases[2]?.input === "regex") {
          const regex = new RegExp(/^Child => PPID: \d+, PID: \d+\nParent => PID: \d+\nWaiting for child process to finish\.\nChild process finished\.\n?$/);
          currentResult = {
            input,
            expected: expectedOutput,
            output: result.output,
            passed: regex.test(result.output),
            status: 'done',
          };
        }
        else {
          const resultlist = result.output ? result.output.split("\n") : ["No output received."];
          while (resultlist[resultlist.length - 1] === "") resultlist.pop();

          const expectedLines = expectedOutput.split("\n");
          while (expectedLines[expectedLines.length - 1] === "") expectedLines.pop();

          const passed = resultlist.length === expectedLines.length &&
            resultlist.every((val, idx) => val.trimEnd() === expectedLines[idx].trimEnd());

          currentResult = {
            input,
            expected: expectedOutput,
            output: result.output,
            passed,
            status: 'done',
          };
        }

        updatedResults[i] = currentResult;
        setTestResults([...updatedResults]);
        return currentResult;
      } catch (error) {
        console.error(`Error executing test case ${i + 1}:`, error);
        const errorResult = {
          input,
          expected: expectedOutput,
          output: error.message || 'Error',
          passed: false,
          status: 'done',
        };
        updatedResults[i] = errorResult;
        setTestResults([...updatedResults]);
        return errorResult;
      }
    });

    await Promise.all(promises);


    const allPassed = updatedResults.every(tc => tc.passed);
    await markProblemAsCompleted(allPassed);
    await logSubmission(allPassed ? 'correct' : 'wrong', code);
  };

  const markProblemAsCompleted = async (isCorrect) => {
    if (!user?.uid) return;

    try {
      const progressRef = ref(
        database,
        `userprogress/${user.uid}/${course}/${subcourse}/${questionId}`
      );

      await set(progressRef, isCorrect);
      console.log(`userprogress saved: ${questionId} = ${isCorrect}`);
    } catch (error) {
      console.error("Error saving user progress:", error);
    }
  };

  const runCode = async () => {
    const testCases = testCasesrun;
    console.log('Running test cases:', testCases);

    try {
      // Initialize test results with 'running' status
      const initialResults = testCases.map(tc => ({
        input: tc.input || '',
        expected: tc.expectedOutput || '',
        output: '',
        passed: false,
        status: 'running',
        isFirstFailure: false
      }));

      setTestResults(initialResults);
      setOutput(null);
      setActiveTab('output');
      setRunSubmit('run');

      const updatedResults = [...initialResults];
      let firstFailureShown = false;

      const promises = testCases.map(async (tc, i) => {
        const { input: testInput, expectedOutput } = tc;
        try {
          const sqlSourceCode = (questionData?.schema || "") + "\n\n" + code;
          const { run: result } = await executeCode('sql', sqlSourceCode, testInput);

          let currentResult;

          if (questionData.testcases[2]?.input === "regex2") {
            const regex = new RegExp(/^PID of example\.c = \d+\n[A-Za-z]{3} [A-Za-z]{3} +\d{1,2} \d{2}:\d{2}:\d{2} [A-Z]+ \d{4}\n?$/);
            currentResult = {
              input: testInput,
              expected: expectedOutput,
              output: result.output,
              passed: regex.test(result.output),
              status: 'done',
              isFirstFailure: false
            };
          }
          else if (questionData.testcases[2]?.input === "regex") {
            const regex = new RegExp(/^Child => PPID: \d+, PID: \d+\nParent => PID: \d+\nWaiting for child process to finish\.\nChild process finished\.\n?$/);
            currentResult = {
              input: testInput,
              expected: expectedOutput,
              output: result.output,
              passed: regex.test(result.output),
              status: 'done',
              isFirstFailure: false
            };
          }
          else {
            const resultOutput = result.output || '';
            const resultLines = resultOutput ? resultOutput.split("\n").filter(line => line !== '') : [];
            const expectedLines = expectedOutput ? expectedOutput.split("\n").filter(line => line !== '') : [];

            const passed = resultLines.length === expectedLines.length &&
              resultLines.every((val, idx) => val.trimEnd() === expectedLines[idx].trimEnd());

            currentResult = {
              input: testInput,
              expected: expectedOutput,
              output: resultOutput,
              passed,
              status: 'done',
              isFirstFailure: false
            };
          }

          updatedResults[i] = currentResult;
          setTestResults([...updatedResults]);
          return currentResult;
        } catch (error) {
          console.error(`Error executing test case ${i + 1}:`, error);
          const errorResult = {
            input: testInput,
            expected: expectedOutput || '',
            output: error.message || 'Error executing code',
            passed: false,
            status: 'done',
            isFirstFailure: false
          };
          updatedResults[i] = errorResult;
          setTestResults([...updatedResults]);
          return errorResult;
        }
      });

      await Promise.all(promises);

      // Handle first failure expansion after all parallel tests finish
      let firstFailureIndex = -1;
      for (let i = 0; i < updatedResults.length; i++) {
        if (!updatedResults[i].passed) {
          firstFailureIndex = i;
          break;
        }
      }

      if (firstFailureIndex !== -1) {
        updatedResults[firstFailureIndex].isFirstFailure = true;
        setTestCaseTab(firstFailureIndex);
        setTestResults([...updatedResults]);
      }
    } catch (error) {
      console.error("Error during test cases:", error);
      setTestResults([{
        input: '',
        expected: '',
        output: error.message || 'Error executing test cases',
        passed: false,
        status: 'done',
        isFirstFailure: true
      }]);
    }
  };

  const loadCode = useCallback(async () => {
    try {
      const dbRef = ref(database);
      const codeKey = `savedCode/${user.uid}/${course}/${questionId}/${selectedLanguage}`;
      const snapshot = await get(child(dbRef, codeKey));

      console.log(snapshot.val());

      if (snapshot.exists()) {
        const savedCode = snapshot.val();
        setCode(savedCode);
        console.log("Code loaded successfully!");
      } else {
        setCode(languageTemplates[selectedLanguage] || "");
        console.log("No saved code found, using default template");
      }
    } catch (error) {
      console.error("Error loading code:", error);
      setCode(languageTemplates[selectedLanguage] || "");
    }
  }, [course, questionId, selectedLanguage]);

  const saveCode = useCallback(async (codeToSave) => {
    try {
      const codeKey = `savedCode/${user.uid}/${course}/${questionId}/${selectedLanguage}`;
      const dbRef = ref(database, codeKey);
      await set(dbRef, codeToSave);
      console.log("Code auto-saved successfully!");
    } catch (error) {
      console.error("Error saving code:", error);
    }
  }, [course, questionId, selectedLanguage]);

  // Fetch submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user?.uid || !course || !subcourse || !questionId) return;

      const safeCourse = sanitizeKey(course);
      const safeSubcourse = sanitizeKey(subcourse);
      const safeQuestionId = sanitizeKey(questionId);

      const path = `Submissions/${user.uid}/${safeCourse}/${safeSubcourse}/${safeQuestionId}`;
      const snapshot = await get(ref(database, path));

      if (snapshot.exists()) {
        const data = snapshot.val();
        const parsed = Object.entries(data).map(([timestamp, entry]) => ({
          timestamp,
          ...entry,
        }));
        setSubmissions(parsed.reverse());
      } else {
        setSubmissions([]);
      }
    };

    fetchSubmissions();
  }, [user, course, subcourse, questionId, submissionTrigger]); // Added submissionTrigger as dependency

  const handleCodeChange = useCallback((newValue) => {
    setCode(newValue);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveCode(newValue);
    }, 500);
  }, [saveCode]);



  // Load code when component mounts or language changes
  useEffect(() => {
    if (questionData) {
      loadCode();
    }
  }, [loadCode, questionData, selectedLanguage]);



  // Fetch question data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`AlgoCore/${String(course).replace(" ", "")}/${subcourse}/${questionId}`)
        const questionRef = ref(database, `questions/${questionId}`);

        const [questionSnapshot] = await Promise.all([
          get(questionRef),
        ]);

        if (questionSnapshot.exists()) {
          const question = questionSnapshot.val();
          console.log('question', question.type)

          const testCases = [
            { input: question?.testcases[0]?.input, expectedOutput: question?.testcases[0]?.expectedOutput },
            ...(question?.testcases[1]?.expectedOutput
              ? [{ input: question?.testcases[1]?.input, expectedOutput: question?.testcases[1]?.expectedOutput }]
              : [])
          ];

          setTestCases(testCases);


          console.log(question);
          setQuestionData(question);
        }
      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
      }
    };

    fetchData();
    loadCode();

  }, [questionId]);

  // Fixed Monaco Editor layout handling
  const handleEditorDidMount = useCallback((editor, monaco) => {
    registerIntelliSense(editor, monaco);
    editorRef.current = editor;

    // Clean up previous observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    // Disable Copy (Ctrl + C)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      const copyDisabled = getItemWithExpiry("copyDisabled");
      console.log(copyDisabled)
      if (copyDisabled === null) {
        toast.error("Copy disabled!", {
          position: "top-right",
          autoClose: 3000,
        });
        setItemWithExpiry("copyDisabled", true, 5000);

        return;
      }


    });

    // Disable Paste (Ctrl + V)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      const pasteDisabled = getItemWithExpiry("pasteDisabled");
      if (pasteDisabled === null) {
        toast.error("Paste disabled!", {
          position: "top-right",
          autoClose: 3000,
        });
        setItemWithExpiry("pasteDisabled", true, 5000);
        return;
      }


    });

    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Insert, () => {
      const shiftInsertDisabled = getItemWithExpiry("shiftInsertDisabled");
      if (shiftInsertDisabled === null) {
        toast.error("Shift insert disabled!😭", {
          position: "top-right",
          autoClose: 3000,
        });
        setItemWithExpiry("shiftInsertDisabled", true, 5000);

        return;
      }


    });


    // 🚫 2. Remove Paste from Right-Click Menu
    editor.updateOptions({
      contextmenu: false, // Disables right-click menu
    });

    // 🚫 3. Block Clipboard Events (Prevents extensions & force-paste)
    const blockPaste = (event) => {
      event.preventDefault();
      alert("Pasting is completely disabled!");
    };



    // Create new ResizeObserver with proper error handling
    resizeObserverRef.current = new ResizeObserver((entries) => {
      // Clear any existing timeout
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }

      // Use setTimeout to prevent ResizeObserver loop
      layoutTimeoutRef.current = setTimeout(() => {
        try {
          if (editorRef.current && !editorRef.current.isDisposed()) {
            editorRef.current.layout();
          }
        } catch (error) {
          // Silently handle disposed editor errors
          console.warn('Editor layout error:', error);
        }
      }, 0);
    });

    // Observe the editor container
    const container = editor.getContainerDomNode();
    if (container) {
      resizeObserverRef.current.observe(container);
    }
  }, []);

  // Handle panel width changes
  useEffect(() => {
    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current);
    }

    layoutTimeoutRef.current = setTimeout(() => {
      if (editorRef.current && !editorRef.current.isDisposed()) {
        try {
          editorRef.current.layout();
        } catch (error) {
          console.warn('Editor layout error:', error);
        }
      }
    }, 100);
  }, [leftPanelWidth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Panel resize handlers
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const container = document.body;
    const rect = container.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    let newLeftWidth = ((x - rect.left) / rect.width) * 100;
    newLeftWidth = Math.max(18, Math.min(70, newLeftWidth));
    setLeftPanelWidth(newLeftWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, `/AlgoCore/${course}`));

        if (snapshot.exists()) {
          setCourseData(snapshot.val());
        } else {
          console.warn("No course data found in Firebase.");
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
      }
    };

    fetchCourseData();
  }, [course]);

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex bg-white dark:bg-dark-primary select-none overflow-hidden">      {/* Left Panel */}
      <div
        className="bg-white dark:bg-dark-secondary border-r border-gray-200 dark:border-dark-tertiary flex flex-col overflow-hidden h-full"
        style={{ width: `${leftPanelWidth}%` }}
      >
        <div className="flex whitespace-nowrap border-b border-gray-200 dark:border-dark-tertiary overflow-x-auto">
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'description' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'
              }`}
            onClick={() => setActiveTab('description')}
          >
            <div className="flex items-center gap-2">
              <Icons.FileText />
              Description
            </div>
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'testcases' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'
              }`}
            onClick={() => setActiveTab('testcases')}
          >
            <div className="flex items-center gap-2">
              <Icons.Code2 />
              Test Cases
            </div>
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'output' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'
              }`}
            onClick={() => setActiveTab('output')}
          >
            <div className="flex items-center gap-2">
              <Icons.Terminal />
              Output
            </div>
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'submissions' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'}`}
            onClick={() => setActiveTab('submissions')}
          >
            <div className="flex items-center gap-2">
              <Icons.Clock />
              Submissions
            </div>
          </button>
          {/* <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'suggestions' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'}`}
            onClick={() => setActiveTab('suggestions')}
          >
            <div className="flex items-center gap-2">
              <Icons.Play />
              AI Suggestions
            </div>
          </button> */}
        </div>

        <div className="p-6 flex-1 min-h-0 overflow-auto h-full">
          {activeTab === 'description' && (
            <div className="text-gray-700 dark:text-gray-400">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words">{String(questionData?.questionname)}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${questionData?.difficulty === 'Hard' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : questionData?.difficulty === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    }`}>{questionData?.difficulty || 'Easy'}</span>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" /></svg>
                    SQL
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <p className="break-words leading-relaxed">
                  {questionData?.question}
                </p>

                {/* Schema Section */}
                {questionData?.schema && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
                      </svg>
                      Database Schema
                    </h2>
                    <SqlSchemaDisplay schema={questionData.schema} />
                  </div>
                )}

                {/* Example using table format */}
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Example Output:</h2>
                  {questionData?.Example?.[0]?.includes('|') ? (
                    <div>
                      <SqlResultTable text={questionData.Example[0].split('Output:')[1]?.trim() || questionData.Example[0]} />
                    </div>
                  ) : (
                    <pre className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
                      {questionData?.Example?.[0]}
                    </pre>
                  )}
                </div>

                {questionData?.Example?.[1] && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Example 2:</h2>
                    {questionData.Example[1].includes('|') ? (
                      <SqlResultTable text={questionData.Example[1].split('Output:')[1]?.trim() || questionData.Example[1]} />
                    ) : (
                      <pre className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
                        {questionData.Example[1]}
                      </pre>
                    )}
                  </div>
                )}

                {questionData?.constraints && questionData.constraints.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Constraints:</h2>
                    <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-400">
                      {questionData.constraints.filter(Boolean).map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            </div>
          )}

          {activeTab === 'testcases' && (

            <div className="space-y-6">

              {
                (questionData?.testcases?.length >= 3 && questionData?.testcases?.[2].input === "regex") ?
                  (
                    <h1>No input</h1>
                  )
                  :
                  (


                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white"> Manual Test Cases </h3>
                      <div className="flex items-center gap-2 mb-4">
                        {testCasesrun.map((_, idx) => (
                          <button
                            key={idx}
                            className={`px-4 py-2 rounded-t-lg font-medium border-b-2 transition-colors duration-150 focus:outline-none ${testCaseTab === idx ? 'border-[#4285F4] text-[#4285F4] bg-white dark:bg-dark-secondary' : 'border-transparent text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-dark-tertiary hover:text-[#4285F4]'
                              }`}
                            onClick={() => setTestCaseTab(idx)}
                          >
                            Case {idx + 1}
                          </button>
                        ))}
                        <button
                          className="ml-2 px-3 py-2 rounded-full bg-[#4285F4] text-white hover:bg-[#357ae8] text-lg font-bold"
                          onClick={() => {
                            setTestCases([...testCasesrun, { input: '', expectedOutput: '' }]);
                            setTestCaseTab(testCasesrun.length);
                          }}
                        >
                          +
                        </button>
                      </div>
                      <div className="bg-gray-50 dark:bg-dark-secondary rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Input</label>
                            <textarea
                              ref={inputRef}
                              className="w-full p-2 border border-gray-300 dark:border-dark-tertiary rounded-md bg-white dark:bg-dark-secondary text-gray-900 dark:text-white font-mono text-base min-h-[80px] resize-y"
                              value={testCasesrun[testCaseTab]?.input || ''}
                              onChange={e => {
                                const updated = [...testCasesrun];
                                updated[testCaseTab].input = e.target.value;
                                setTestCases(updated);
                                // Force update height after state update
                                requestAnimationFrame(() => {
                                  adjustTextareaHeight(e.target);
                                });
                              }}
                              onInput={e => adjustTextareaHeight(e.target)}
                              placeholder="Enter input (supports multiple lines)"
                              rows={1}
                              style={{ minHeight: '40px', maxHeight: '200px', overflowY: 'auto' }}
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Expected Output</label>
                            <textarea
                              ref={outputRef}
                              className="w-full p-2 border border-gray-300 dark:border-dark-tertiary rounded-md bg-white dark:bg-dark-secondary text-gray-900 dark:text-white font-mono text-base min-h-[80px] resize-y"
                              value={testCasesrun[testCaseTab]?.expectedOutput || ''}
                              onChange={e => {
                                const updated = [...testCasesrun];
                                updated[testCaseTab].expectedOutput = e.target.value;
                                setTestCases(updated);
                                // Force update height after state update
                                requestAnimationFrame(() => {
                                  adjustTextareaHeight(e.target);
                                });
                              }}
                              onInput={e => adjustTextareaHeight(e.target)}
                              placeholder="Enter expected output (supports multiple lines)"
                              rows={1}
                              style={{ minHeight: '40px', maxHeight: '200px', overflowY: 'auto' }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end mt-4">
                          <button
                            className="text-red-500 hover:text-red-700 font-medium"
                            onClick={() => {
                              const updated = testCasesrun.filter((_, idx) => idx !== testCaseTab);
                              setTestCases(updated.length ? updated : [{ input: '', expectedOutput: '' }]);
                              setTestCaseTab(prev => Math.max(0, prev - 1));
                            }}
                            disabled={testCasesrun.length <= 1}
                            title="Delete this test case"
                          >
                            Delete Case
                          </button>
                        </div>
                      </div>
                    </div>
                  )
              }
            </div>
          )}

          {activeTab === 'output' && (
            <div className="py-8 px-4 flex flex-col items-center">
              {output ? (
                <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">{output}</pre>
              ) : testResults.length > 0 && testResults.every(t => t.status === 'done') ? (
                <SqlAnimatedTestResults testResults={testResults} runsubmit={runsubmit} />
              ) : (
                <AnimatedTestResults testResults={testResults} runsubmit={runsubmit} />
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-4">
              {submissions.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">No submissions yet for this question.</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-tertiary">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-tertiary">
                    {submissions.map((s, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                          {(() => {
                            const fixed = s.timestamp.replace(/T(\d{2})_(\d{2})_(\d{2})_(\d{3})Z/, 'T$1:$2:$3.$4Z');
                            const date = new Date(fixed);
                            return isNaN(date.getTime())
                              ? 'N/A'
                              : date.toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              });
                          })()}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                          {s.language}
                        </td>
                        <td className={`px-4 py-2 text-sm font-medium ${s.status === 'correct' ? 'text-green-600' : 'text-red-500'}`}>
                          {s.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {activeTab === 'suggestions' && (
            <AISuggestionsTab
              questionData={questionData}
              userCode={code}
              userId={user.uid}
            />
          )}
        </div>
      </div>

      {/* Draggable Divider */}
      <div
        className={`w-1 bg-gray-200 dark:bg-dark-tertiary hover:bg-[#4285F4] cursor-col-resize flex items-center justify-center group transition-colors duration-150 ${isDragging ? 'bg-[#4285F4]' : ''}`}
        onMouseDown={handleMouseDown}
        style={{ zIndex: 10 }}
      >
        <Icons.GripVertical
          size={16}
          className="text-gray-400 group-hover:text-[#4285F4] opacity-0 group-hover:opacity-100"
        />
      </div>

      {/* Right Panel (Code Editor) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <div className="bg-white dark:bg-dark-secondary border-t border-gray-200 dark:border-dark-tertiary p-2 flex justify-end gap-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">SQLite</span>
            <button
              onClick={() => setCode('')}
              title="Reset to initial code"
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md flex items-center gap-1 text-xs transition-colors duration-150"
            >
              <Icons.History className="w-3 h-3" />
              Reset
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runCode}
              className="bg-[#4285F4] hover:bg-[#4285F4]/90 text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs transition-colors duration-150"
            >
              <Icons.Play />
              Run Code
            </button>

            <button
              onClick={handleSubmit2}
              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs transition-colors duration-150"
            >
              <Icons.ChevronRight />
              Submit
            </button>

            {/* Navigation Buttons */}
            {/* {navigation?.showNavigation && (
              <>
                <button
                  onClick={navigation.onPrevious}
                  // disabled={navigation.currentQuestionIndex === 0}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium text-[11px] transition-all duration-200 ${navigation.currentQuestionIndex === 0 || false
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                    }`}
                >
                  <navigation.NavigationIcons.ChevronLeft />
                  Previous
                </button>

                <button
                  onClick={navigation.onNext}
                  // disabled={navigation.currentQuestionIndex === navigation.totalQuestions - 1}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium text-[11px] transition-all duration-200 ${navigation.currentQuestionIndex === navigation.totalQuestions - 1 || false
                    ? 'bg-red-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                    }`}
                >
                  {navigation.currentQuestionIndex === navigation.totalQuestions - 1 ? 'Next Chapter' : 'Next'}
                  <navigation.NavigationIcons.ChevronRight />
                </button>
              </> */}
            {/* )} */}
          </div>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-900 min-w-0 overflow-auto">
          <Editor
            height="100%"
            defaultLanguage="sql"
            language="sql"
            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            options={{
              ...INTELLISENSE_OPTIONS,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              tabSize: 2,
              dragAndDrop: true,
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>
      </div>



      <ToastContainer />
    </div>
  );
};

export default SqlPage;











