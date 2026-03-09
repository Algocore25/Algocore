'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../context/ThemeContext';
import { useParams, useNavigate } from "react-router-dom";

import { Icons, languageTemplates } from '../constants';
import { registerIntelliSense, INTELLISENSE_OPTIONS } from '../../hooks/useMonacoIntelliSense';

import { database } from "../../firebase";
import { ref, get, set, child } from "firebase/database";

import AnimatedTestResults from '../AnimatedTestResults';
import { executeCode } from '../api';
import { useAuth } from '../../context/AuthContext';

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { setItemWithExpiry, getItemWithExpiry } from "../../utils/storageWithExpiry";

function CodePageSingle({ question, data, questionData: propQuestionData, selectedLanguage: propSelectedLanguage }) {
  const [code, setCode] = useState("");
  const [runsubmit, setRunSubmit] = useState('none');
  const [activeTab, setActiveTab] = useState('description');
  const [output, setOutput] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [testCaseTab, setTestCaseTab] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(45);
  const [selectedLanguage, setSelectedLanguage] = useState(propSelectedLanguage || 'cpp');
  const [monacoLanguage, setMonacoLanguage] = useState('plaintext');

  // Sync selectedLanguage from props
  useEffect(() => {
    if (propSelectedLanguage && propSelectedLanguage !== selectedLanguage) {
      setSelectedLanguage(propSelectedLanguage);
    }
  }, [propSelectedLanguage]);
  const [isCompleted, setIsCompleted] = useState(false);
  const { theme } = useTheme();
  const [questionData, setQuestionData] = useState(propQuestionData || null);
  const [testCasesrun, setTestCases] = useState([{ input: '', expectedOutput: '' }]);
  const [allowlanguages, setallowlanguages] = useState([]);
  const [submissionStatus, setSubmissionStatus] = useState('not_attended');
  const [submissions, setSubmissions] = useState([]);
  const [submissionTrigger, setSubmissionTrigger] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const layoutTimeoutRef = useRef(null);

  const { testid } = useParams();
  const { user } = useAuth();
  const userId = user?.uid;

  const sanitizeKey = (key) => {
    if (!key) return '';
    return key.replace(/[.#$/\[\]:]/g, '_');
  };

  const getMonacoLanguage = (lang) => {
    const languageMap = {
      'java': 'java',
      'python': 'python',
      'cpp': 'cpp',
      'c': 'c',
      'c++': 'cpp',
      'javascript': 'javascript',
      'js': 'javascript',
      'typescript': 'typescript',
      'ts': 'typescript'
    };
    return languageMap[lang] || 'plaintext';
  };

  useEffect(() => {
    const mapped = getMonacoLanguage(selectedLanguage);
    setMonacoLanguage(mapped);
  }, [selectedLanguage]);

  const logSubmission = async (status, submittedCode, marks, updatedResults) => {
    if (!user?.uid) return;

    const timestamp = new Date().toISOString();
    const safeTimestamp = sanitizeKey(timestamp);

    const path = `ExamCodeSubmissions/${testid}/${userId}/${question}/${safeTimestamp}`;

    try {
      await set(ref(database, path), {
        language: selectedLanguage,
        status,
        code: submittedCode,
        marks: marks * 100 || 0,
        testResults: updatedResults || [],
      });
      setSubmissionTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error logging submission:", error);
    }
  };

  const handleSubmit2 = async () => {
    if (!questionData || !questionData.testcases) return;

    setRunSubmit('submit');
    const testCases = questionData.testcases;
    const sourceCode = code;

    if (!sourceCode || sourceCode.trim() === '') {
      setTestResults([{
        input: '',
        expected: '',
        output: 'Error: No code to execute.',
        passed: false,
        status: 'done',
        isFirstFailure: true,
        time: 0,
        memory: 0,
        timeout: false,
      }]);
      return;
    }

    const initialResults = testCases.map(tc => ({
      input: tc.input,
      expected: tc.expectedOutput,
      output: '',
      passed: false,
      status: 'running',
      time: 0,
      memory: 0,
      timeout: false,
    }));

    setTestResults(initialResults);
    setOutput(null);
    setActiveTab('output');

    const updatedResults = [...initialResults];

    const promises = testCases.map(async (tc, i) => {
      const { input, expectedOutput } = tc;
      try {
        const { run: result } = await executeCode(selectedLanguage, sourceCode, input);

        const normalize = (text) => {
          if (!text && text !== "") return [];
          const lines = String(text).split('\n');
          const processed = [...lines];
          while (processed.length > 0 && processed[processed.length - 1].trimEnd() === "") {
            processed.pop();
          }
          return processed;
        };

        const resultLines = normalize(result.output);
        const expectedLines = normalize(expectedOutput);

        const passed = resultLines.length === expectedLines.length &&
          resultLines.every((val, idx) => val.trimEnd() === expectedLines[idx].trimEnd());

        const currentResult = {
          input,
          expected: expectedOutput,
          output: result.output,
          passed,
          status: 'done',
          time: result.time || 0,
          memory: result.memory || 0,
          timeout: result.timeout || false,
        };

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
          time: 0,
          memory: 0,
          timeout: false,
          status: 'done',
        };
        updatedResults[i] = errorResult;
        setTestResults([...updatedResults]);
        return errorResult;
      }
    });

    await Promise.all(promises);

    const allPassed = updatedResults.every(tc => tc.passed);
    let vm = 0;
    let hm = 0;
    let tclen = updatedResults.length;

    updatedResults.forEach((tc, index) => {
      if (tc.passed) {
        if (index < 2) vm += 1;
        else hm += 1;
      }
    });

    let marks = (vm / 2) * 0.3 + (hm / (tclen - 2)) * 0.7;
    if (updatedResults.length <= 2) {
      marks = (vm / updatedResults.length) * 1.0;
    }

    await logSubmission(allPassed ? 'correct' : 'wrong', sourceCode, marks, updatedResults);

    toast.success('Submitted');

    const finalResult = allPassed ? 'true' : 'false';
    const resultRef = ref(database, `ExamSubmissions/${testid}/${userId}/${question}/`);
    const markRef = ref(database, `Marks/${testid}/${userId}/${question}/`);

    const prevmarkSnapshot = await get(markRef);
    if (!prevmarkSnapshot.exists() || prevmarkSnapshot.val() < (marks * 100)) {
      await set(resultRef, finalResult);
      await set(markRef, (marks) * 100);
    }

    setSubmissionStatus(allPassed ? 'correct' : 'wrong');
    setIsCompleted(allPassed);
  };

  const runCode = async () => {
    if (!testCasesrun || testCasesrun.length === 0) return;

    setRunSubmit('run');
    const testCases = testCasesrun;
    const sourceCode = code;

    if (!sourceCode || sourceCode.trim() === '') {
      setTestResults([{
        input: '',
        expected: '',
        output: 'Error: No code to execute.',
        passed: false,
        status: 'done',
        isFirstFailure: true,
        time: 0,
        memory: 0,
        timeout: false,
      }]);
      return;
    }

    const initialResults = testCases.map(tc => ({
      input: tc.input || '',
      expected: tc.expectedOutput || '',
      output: '',
      passed: false,
      status: 'running',
      isFirstFailure: false,
      time: 0,
      memory: 0,
      timeout: false,
    }));

    setTestResults(initialResults);
    setOutput(null);
    setActiveTab('output');

    const updatedResults = [...initialResults];

    const promises = testCases.map(async (tc, i) => {
      const { input: testInput, expectedOutput } = tc;
      try {
        const { run: result } = await executeCode(selectedLanguage, sourceCode, testInput);

        const normalize = (text) => {
          if (!text && text !== "") return [];
          const lines = String(text).split('\n');
          const processed = [...lines];
          while (processed.length > 0 && processed[processed.length - 1].trimEnd() === "") {
            processed.pop();
          }
          return processed;
        };

        const resultOutput = result.output || '';
        const resultLines = normalize(resultOutput);
        const expectedLines = normalize(expectedOutput);

        const passed = resultLines.length === expectedLines.length &&
          resultLines.every((val, idx) => val.trimEnd() === expectedLines[idx].trimEnd());

        const currentResult = {
          input: testInput,
          expected: expectedOutput,
          output: resultOutput,
          passed,
          status: 'done',
          isFirstFailure: false,
          time: result.cpuTime || 0,
          memory: result.memory || 0,
          timeout: result.timeout || false,
        };
        updatedResults[i] = currentResult;
        setTestResults([...updatedResults]);
        return currentResult;
      } catch (error) {
        const errorResult = {
          input: testInput,
          expected: expectedOutput || '',
          output: error.message || 'Error',
          passed: false,
          status: 'done',
          isFirstFailure: false,
          time: 0,
          memory: 0,
          timeout: false,
        };
        updatedResults[i] = errorResult;
        setTestResults([...updatedResults]);
        return errorResult;
      }
    });

    await Promise.all(promises);

    let firstFailureIdx = updatedResults.findIndex(tc => !tc.passed);
    if (firstFailureIdx !== -1) {
      updatedResults[firstFailureIdx].isFirstFailure = true;
      setTestCaseTab(firstFailureIdx);
      setTestResults([...updatedResults]);
    }
  };

  const saveCode = useCallback(async (codeToSave) => {
    if (!userId) return;
    try {
      const codeKey = `ExamCode/${testid}/${userId}/${question}/${selectedLanguage}`;
      await set(ref(database, codeKey), codeToSave);
      console.log("✅ Code auto-saved successfully!");
    } catch (error) {
      console.error("❌ Error saving code:", error);
    }
  }, [testid, question, selectedLanguage, userId]);

  const loadCode = useCallback(async () => {
    if (!userId || !testid || !question) return;
    try {
      const dbRef = ref(database);
      const codeKey = `ExamCode/${testid}/${userId}/${question}/${selectedLanguage}`;
      const snapshot = await get(child(dbRef, codeKey));

      if (snapshot.exists()) {
        let savedCode = snapshot.val();
        if (typeof savedCode !== 'string') savedCode = String(savedCode || '');
        setCode(savedCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));
      } else {
        const template = languageTemplates[selectedLanguage] || "";
        setCode(template.replace(/\r\n/g, '\n').replace(/\r/g, '\n'));
      }
    } catch (error) {
      console.error("Error loading code:", error);
      const template = languageTemplates[selectedLanguage] || "";
      setCode(template);
    }
  }, [selectedLanguage, testid, question, userId]);

  const handleCodeChange = useCallback((newValue) => {
    setCode(newValue);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveCode(newValue), 500);
  }, [saveCode]);

  const handleLanguageChange = useCallback((e) => {
    setSelectedLanguage(e.target.value);
    setEditorKey(prev => prev + 1);
  }, []);

  const handleResetCode = useCallback(async () => {
    const template = languageTemplates[selectedLanguage] || "";
    setCode(template);
    await saveCode(template);
    toast.success('Code reset to default template');
    setShowResetModal(false);
  }, [selectedLanguage, saveCode]);

  // Simplification: allowed languages are now fetched similarly to CodePageMultifile or passed down.
  // We'll keep a local fetch for the dropdown options.

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user?.uid || !testid || !question) return;
      const path = `ExamCodeSubmissions/${testid}/${userId}/${question}`;
      const snapshot = await get(ref(database, path));
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSubmissions(Object.entries(data).map(([timestamp, entry]) => ({ timestamp, ...entry })).reverse());
      } else {
        setSubmissions([]);
      }
    };
    fetchSubmissions();
  }, [user, testid, question, submissionTrigger]);

  const fetchSubmissionStatus = useCallback(async () => {
    if (!userId || !testid || !question) return;
    try {
      const resultRef = ref(database, `ExamSubmissions/${testid}/${userId}/${question}/`);
      const snapshot = await get(resultRef);
      if (snapshot.exists()) {
        const result = snapshot.val();
        setSubmissionStatus(result === 'true' ? 'correct' : 'wrong');
        setIsCompleted(result === 'true');
      } else {
        setSubmissionStatus('not_attended');
        setIsCompleted(false);
      }
    } catch (error) {
      setSubmissionStatus('not_attended');
      setIsCompleted(false);
    }
  }, [testid, question, userId]);

  useEffect(() => {
    fetchSubmissionStatus();
  }, [question, fetchSubmissionStatus]);

  useEffect(() => {
    if (questionData && userId) loadCode();
  }, [loadCode, questionData, userId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const questionRef = ref(database, `questions/${question}`);
        const questionSnapshot = await get(questionRef);
        if (questionSnapshot.exists()) {
          const qData = questionSnapshot.val();
          setQuestionData(qData);
          const tCases = [
            { input: qData?.testcases[0]?.input || '', expectedOutput: qData?.testcases[0]?.expectedOutput || '' },
            ...(qData?.testcases[1]?.expectedOutput
              ? [{ input: qData?.testcases[1]?.input || '', expectedOutput: qData?.testcases[1]?.expectedOutput || '' }]
              : [])
          ];
          setTestCases(tCases);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    const fetchAllowedLanguages = async () => {
      try {
        const snapshot = await get(child(ref(database), `Exam/${testid}/allowedLanguages`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          let normalizedArray = Array.isArray(data) ? data : Object.values(data);
          const mappedLangs = normalizedArray.map(lang => {
            const l = String(lang).toLowerCase();
            if (l === 'c/c++' || l === 'c++') return 'cpp';
            return l;
          });
          setallowlanguages(mappedLangs);
        }
      } catch (error) {
        console.error("Error fetching allowed languages:", error);
      }
    };
    fetchData();
    fetchAllowedLanguages();
  }, [question, testid]);

  useEffect(() => {
    setActiveTab('description');
  }, [question]);

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register intellisense immediately
    registerIntelliSense(editor, monaco);

    // Set language immediately
    const model = editor.getModel();
    if (model && selectedLanguage) {
      const mappedLang = getMonacoLanguage(selectedLanguage);
      monaco.editor.setModelLanguage(model, mappedLang);
    }

    resizeObserverRef.current = new ResizeObserver(() => {
      if (layoutTimeoutRef.current) clearTimeout(layoutTimeoutRef.current);
      layoutTimeoutRef.current = setTimeout(() => {
        if (editorRef.current && !editorRef.current.isDisposed()) editorRef.current.layout();
      }, 0);
    });

    const container = editor.getContainerDomNode()?.parentElement?.parentElement;
    if (container) resizeObserverRef.current.observe(container);

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      if (getItemWithExpiry("copyDisabled") === null) {
        toast.error("Copy disabled!", { position: "top-right", autoClose: 3000 });
        setItemWithExpiry("copyDisabled", true, 5000);
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      if (getItemWithExpiry("pasteDisabled") === null) {
        toast.error("Paste disabled!", { position: "top-right", autoClose: 3000 });
        setItemWithExpiry("pasteDisabled", true, 5000);
      }
    });

    editor.updateOptions({ contextmenu: false });
  }, [selectedLanguage]);

  // Update language when monacoLanguage changes
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    const mappedLang = getMonacoLanguage(selectedLanguage);
    monacoRef.current.editor.setModelLanguage(model, mappedLang);
  }, [monacoLanguage, selectedLanguage]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const rect = document.body.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    let newLeftWidth = ((x - rect.left) / rect.width) * 100;
    newLeftWidth = Math.max(18, Math.min(70, newLeftWidth));
    setLeftPanelWidth(newLeftWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

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
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="h-[calc(100vh-5rem)] w-full flex bg-white dark:bg-dark-primary select-none overflow-hidden">
      <ToastContainer />
      <div
        className="bg-white dark:bg-dark-secondary border-r border-gray-200 dark:border-dark-tertiary flex flex-col overflow-hidden h-full"
        style={{ width: `${leftPanelWidth}%` }}
      >
        <div className="flex whitespace-nowrap border-b border-gray-200 dark:border-dark-tertiary overflow-x-auto">
          <button className={`px-4 py-3 text-sm font-medium ${activeTab === 'description' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400'}`} onClick={() => setActiveTab('description')}>
            <div className="flex items-center gap-2"><Icons.FileText />Description</div>
          </button>
          <button className={`px-4 py-3 text-sm font-medium ${activeTab === 'testcases' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400'}`} onClick={() => setActiveTab('testcases')}>
            <div className="flex items-center gap-2"><Icons.Code2 />Test Cases</div>
          </button>
          <button className={`px-4 py-3 text-sm font-medium ${activeTab === 'output' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400'}`} onClick={() => setActiveTab('output')}>
            <div className="flex items-center gap-2"><Icons.Terminal />Output</div>
          </button>
          <button className={`px-4 py-3 text-sm font-medium ${activeTab === 'submissions' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400'}`} onClick={() => setActiveTab('submissions')}>
            <div className="flex items-center gap-2"><Icons.Clock />Submissions</div>
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto h-full">
          {activeTab === 'description' && (
            <div className="text-gray-700 dark:text-gray-400">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{questionData?.questionname}</h1>
                  {isCompleted && (
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="mb-6 whitespace-pre-wrap">{questionData?.question}</p>
              {questionData?.svgContent && (
                <div
                  className="my-4 flex justify-center w-full dark:[&>svg]:invert dark:[&>svg]:hue-rotate-180 [&>svg]:max-w-full [&>svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: questionData.svgContent }}
                />
              )}
              <div className="space-y-6">
                {questionData?.Example?.map((ex, i) => (
                  <div key={i}>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Example {i + 1}:</h3>
                    <pre className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg font-mono text-sm">{ex}</pre>
                  </div>
                ))}
                {questionData?.constraints && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Constraints:</h3>
                    <ul className="list-disc pl-6 space-y-1">
                      {questionData.constraints.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'testcases' && (
            <div className="space-y-6">
              <div className="flex gap-2">
                {testCasesrun.map((_, i) => (
                  <button key={i} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${testCaseTab === i ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-dark-secondary text-gray-500 border-gray-200 dark:border-dark-tertiary'}`} onClick={() => setTestCaseTab(i)}>Case {i + 1}</button>
                ))}
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Input</label>
                  <textarea className="w-full p-4 bg-gray-50/50 dark:bg-dark-tertiary/20 rounded-xl font-mono text-sm resize-none" rows={4} value={testCasesrun[testCaseTab]?.input} onChange={e => {
                    const u = [...testCasesrun]; u[testCaseTab].input = e.target.value; setTestCases(u);
                  }} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expected Output</label>
                  <textarea className="w-full p-4 bg-gray-50/50 dark:bg-dark-tertiary/20 rounded-xl font-mono text-sm resize-none" rows={4} value={testCasesrun[testCaseTab]?.expectedOutput} onChange={e => {
                    const u = [...testCasesrun]; u[testCaseTab].expectedOutput = e.target.value; setTestCases(u);
                  }} />
                </div>
              </div>
              <button onClick={runCode} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">Run Tests</button>
            </div>
          )}

          {activeTab === 'output' && (
            <div className="py-8 px-4 flex flex-col items-center">
              {output ? (
                <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">{output}</pre>
              ) : (
                <AnimatedTestResults testResults={testResults} runsubmit={runsubmit} />
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-4">
              {submissions.map((s, i) => (
                <div key={i} className="p-4 border rounded-xl dark:border-dark-tertiary flex justify-between items-center hover:bg-gray-50 dark:hover:bg-dark-hover transition">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(s.timestamp.replace(/T(\d{2})_(\d{2})_(\d{2})_(\d{3})Z/, 'T$1:$2:$3.$4Z')).toLocaleString()}</span>
                    <span className="text-xs text-gray-500">{s.language}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-bold ${s.status === 'correct' ? 'text-green-600' : 'text-red-500'}`}>{s.status === 'correct' ? 'Accepted' : 'Wrong Answer'}</span>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{s.marks}/100</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-1 bg-gray-200 dark:bg-dark-tertiary cursor-col-resize hover:bg-blue-500 transition-colors" onMouseDown={handleMouseDown} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="p-3 border-b dark:border-dark-tertiary flex justify-between items-center bg-white dark:bg-dark-secondary">
          <div className="flex gap-4 items-center">
            <select className="bg-white dark:bg-dark-tertiary border border-gray-200 dark:border-dark-tertiary p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={selectedLanguage} onChange={handleLanguageChange}>
              {allowlanguages.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={() => setShowResetModal(true)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors">
              <Icons.History size={12} /> Reset
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={runCode} className="px-6 py-2 bg-gray-100 dark:bg-dark-tertiary rounded-xl text-sm font-bold hover:bg-gray-200 transition-all active:scale-95">Run</button>
            <button onClick={handleSubmit2} className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95">Submit</button>
          </div>
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <Editor
            height="100%"
            language={monacoLanguage}
            value={code}
            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              automaticLayout: true,
              wordWrap: 'on',
              tabSize: 2,
              readOnly: false,
              contextmenu: false,
            }}
          />
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-secondary p-8 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Reset Code?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">This will restore the default template. Your current progress in this language will be lost.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowResetModal(false)} className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Cancel</button>
              <button onClick={handleResetCode} className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-red-700 transition-all">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CodePageSingle;
