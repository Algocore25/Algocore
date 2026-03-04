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

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { setItemWithExpiry, getItemWithExpiry } from "../utils/storageWithExpiry";
import { decodeShort } from '../utils/urlEncoder';

function CodePageSingle({ data, navigation, questionData: propQuestionData, selectedLanguage: propSelectedLanguage }) {
  const [code, setCode] = useState("");
  const [runsubmit, setRunSubmit] = useState('none');
  const [activeTab, setActiveTab] = useState('description');
  const [output, setOutput] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [testCaseTab, setTestCaseTab] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(45);
  const [selectedLanguage, setSelectedLanguage] = useState(propSelectedLanguage || '');
  const [monacoLanguage, setMonacoLanguage] = useState('plaintext');
  const [isCompleted, setIsCompleted] = useState(false);
  const { theme } = useTheme();
  const [questionData, setQuestionData] = useState(propQuestionData || null);
  const [courseData, setCourseData] = useState(null);
  const [testCasesrun, setTestCases] = useState([{ input: '', expectedOutput: '' }]);
  const [allowlanguages, setallowlanguages] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionTrigger, setSubmissionTrigger] = useState(0);

  const inputRef = useRef(null);
  const outputRef = useRef(null);

  const { course: encCourse, subcourse: encSubcourse, questionId: encQuestionId } = useParams();
  const course = decodeShort(encCourse);
  const subcourse = decodeShort(encSubcourse);
  const questionId = decodeShort(encQuestionId);
  const { user } = useAuth();
  const navigate = useNavigate();

  const saveTimeoutRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationIdsRef = useRef([]);
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
      setSubmissionTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error logging submission:", error);
    }
  };

  const handleSubmit2 = async () => {
    const testCases = questionData.testcases;
    const sourceCode = code;

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
        const { run: result } = await executeCode(selectedLanguage, sourceCode, input);

        const resultlist = result.output ? result.output.split("\n") : ["No output received."];
        while (resultlist[resultlist.length - 1] === "") resultlist.pop();

        const expectedLines = expectedOutput.split("\n");
        while (expectedLines[expectedLines.length - 1] === "") expectedLines.pop();

        const passed = resultlist.length === expectedLines.length &&
          resultlist.every((val, idx) => val.trimEnd() === expectedLines[idx].trimEnd());

        const currentResult = {
          input,
          expected: expectedOutput,
          output: result.output,
          passed,
          status: 'done',
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
    await logSubmission(allPassed ? 'correct' : 'wrong', sourceCode);
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
      setIsCompleted(isCorrect);
    } catch (error) {
      console.error("Error saving user progress:", error);
    }
  };

  const runCode = async () => {
    const testCases = testCasesrun;
    console.log('Running test cases:', testCases);

    try {
      const sourceCode = code;

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

      const promises = testCases.map(async (tc, i) => {
        const { input: testInput, expectedOutput } = tc;
        try {
          const { run: result } = await executeCode(selectedLanguage, sourceCode, testInput);
          const resultOutput = result.output || '';
          const resultLines = resultOutput ? resultOutput.split("\n").filter(line => line !== '') : [];
          const expectedLines = expectedOutput ? expectedOutput.split("\n").filter(line => line !== '') : [];

          const passed = resultLines.length === expectedLines.length &&
            resultLines.every((val, idx) => val.trimEnd() === expectedLines[idx].trimEnd());

          const currentResult = {
            input: testInput,
            expected: expectedOutput,
            output: resultOutput,
            passed,
            status: 'done',
            isFirstFailure: false
          };
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

      let firstFailureIdx = -1;
      for (let i = 0; i < updatedResults.length; i++) {
        if (!updatedResults[i].passed) {
          firstFailureIdx = i;
          break;
        }
      }

      if (firstFailureIdx !== -1) {
        updatedResults[firstFailureIdx].isFirstFailure = true;
        setTestCaseTab(firstFailureIdx);
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
    if (!user?.uid) return;

    try {
      const dbRef = ref(database);
      const codeKey = `savedCode/${user.uid}/${course}/${questionId}/${selectedLanguage}`;

      const snapshot = await get(child(dbRef, codeKey));
      if (snapshot.exists()) {
        let rawCode = snapshot.val();
        console.log('Single-file load:', rawCode);

        if (typeof rawCode !== 'string') {
          console.warn('Single file saved code is not a string:', typeof rawCode, rawCode);
          rawCode = String(rawCode || '');
        }

        if (rawCode === '[object Object]' || rawCode.includes('object')) {
          console.error('Detected [object Object] in single file code, using template');
          rawCode = languageTemplates[selectedLanguage] || '';
          rawCode = typeof rawCode === 'string' ? rawCode : String(rawCode || '');
        }

        setCode(rawCode);
      } else {
        let rawCode = languageTemplates[selectedLanguage] || "";

        console.log('📄 Loading language template:', {
          selectedLanguage,
          hasTemplate: !!languageTemplates[selectedLanguage],
          templateLength: rawCode?.length,
          templateType: typeof rawCode,
          availableTemplates: Object.keys(languageTemplates)
        });

        if (typeof rawCode !== 'string') {
          console.warn('Template is not a string:', typeof rawCode, rawCode);
          rawCode = String(rawCode || '');
        }

        if (rawCode === '[object Object]' || rawCode.includes('object')) {
          console.error('Detected [object Object] in template, using empty string');
          rawCode = '';
        }

        setCode(rawCode);
      }
    } catch (error) {
      console.error("Error loading code:", error);
      const template = languageTemplates[selectedLanguage] || "";
      setCode(typeof template === 'string' ? template : String(template || ''));
    }
  }, [course, questionId, selectedLanguage, questionData, user?.uid]);

  const saveCode = useCallback(async (codeToSave) => {
    if (!user?.uid) return;

    try {
      const codeKey = `savedCode/${user.uid}/${course}/${questionId}/${selectedLanguage}`;
      const dbRef = ref(database, codeKey);
      console.log('💾 Saving single-file code to:', codeKey);

      await set(dbRef, codeToSave);
      console.log("✅ Code auto-saved successfully!");
    } catch (error) {
      console.error("❌ Error saving code:", error);
    }
  }, [course, questionId, selectedLanguage, user?.uid]);

  const handleCodeChange = useCallback((newValue) => {
    if (!questionData) {
      console.log('Waiting for questionData...');
      return;
    }

    setCode(newValue);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveCode(newValue);
    }, 500);
  }, [saveCode, questionData]);

  const handleLanguageChange = useCallback((e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
  }, []);

  const resetCode = () => {
    const rawCode = languageTemplates[selectedLanguage] || '';
    const template = typeof rawCode === 'string' ? rawCode : String(rawCode || '');
    setCode(template);
    console.log(`Reset to template for ${selectedLanguage}:`, template);

    saveCode(template);
  };

  async function getAllowedLanguageTemplates() {
    const dbRef = ref(database);

    try {
      const snapshot = await get(child(dbRef, `/AlgoCore/${course}/course/allowedLanguages`));

      if (!snapshot.exists()) {
        console.warn("No data found in Firebase.");
        return {};
      }

      const data = snapshot.val();
      console.log(data);
      let normalizedArray = [];
      if (Array.isArray(data)) {
        normalizedArray = data;
      } else {
        normalizedArray = Object.values(data);
      }

      const mappedLangs = normalizedArray.map(lang => {
        const l = String(lang).toLowerCase();
        if (l === 'c/c++' || l === 'c++' || l === 'c') return 'cpp';
        return l;
      });

      setallowlanguages(mappedLangs);
      setSelectedLanguage(prev => mappedLangs.includes(prev) ? prev : mappedLangs[0] || '');
      console.log("Allowed languages mapped:", mappedLangs);

    } catch (error) {
      console.error("Failed to fetch templates:", error);
      return [];
    }
  }

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
  }, [user, course, subcourse, questionId, submissionTrigger]);

  useEffect(() => {
    if (selectedLanguage === "") {
      return;
    }

    if (!questionData) {
      console.log('Waiting for questionData...');
      return;
    }

    console.log('✅ ALL CONDITIONS MET - Loading code...');
    loadCode();
  }, [loadCode, questionData, selectedLanguage]);

  useEffect(() => {
    setActiveTab('description');
  }, [questionId]);

  useEffect(() => {
    if (propQuestionData !== questionData) {
      console.log('🔄 Question data changed, updating state');
      setQuestionData(propQuestionData);
    }
  }, [propQuestionData]);

  useEffect(() => {
    const fetchCompletionStatus = async () => {
      if (user?.uid && questionData) {
        const progressRef = ref(
          database,
          `userprogress/${user.uid}/${course}/${subcourse}/${questionId}`
        );
        const progressSnapshot = await get(progressRef);
        setIsCompleted(progressSnapshot.exists() && progressSnapshot.val() === true);
      }
    };
    fetchCompletionStatus();
  }, [user, course, subcourse, questionId, questionData]);

  useEffect(() => {
    if (questionData) {
      const testCases = [
        { input: questionData?.testcases?.[0]?.input || '', expectedOutput: questionData?.testcases?.[0]?.expectedOutput || '' },
        ...(questionData?.testcases?.[1]?.expectedOutput
          ? [{ input: questionData?.testcases?.[1]?.input || '', expectedOutput: questionData?.testcases?.[1]?.expectedOutput || '' }]
          : [])
      ];
      setTestCases(testCases);
    }
  }, [questionData]);

  useEffect(() => {
    getAllowedLanguageTemplates();
  }, [course]);

  useEffect(() => {
    const mapped = getMonacoLanguage(selectedLanguage);
    console.log('🎨 Updating monacoLanguage state:', selectedLanguage, '->', mapped);
    setMonacoLanguage(mapped);
  }, [selectedLanguage]);

  useEffect(() => {
    // Enhanced initialization with retry mechanism
    if (selectedLanguage && !editorRef.current && monacoRef.current) {
      console.log('🔄 Enhanced initialization attempt for language:', selectedLanguage);

      let retryCount = 0;
      const maxRetries = 5;
      const retryDelay = 200;

      const initializeLanguage = () => {
        try {
          const model = editorRef.current.getModel();
          if (model) {
            const mappedLang = getMonacoLanguage(selectedLanguage);
            console.log('🔄 Setting model language to:', mappedLang, 'attempt:', retryCount + 1);
            monacoRef.current.editor.setModelLanguage(model, mappedLang);

            // Verify it worked
            setTimeout(() => {
              if (editorRef.current) {
                const currentLanguage = editorRef.current.getModel()?.getLanguageId();
                console.log('� Language verification:', 'expected:', mappedLang, 'actual:', currentLanguage);

                if (currentLanguage === mappedLang) {
                  console.log('✅ Language initialization successful');
                  // Force UI refresh
                  editorRef.current.updateOptions({
                    ...editorRef.current.getOptions(),
                    language: mappedLang
                  });
                } else if (retryCount < maxRetries) {
                  console.log('🔄 Retrying language initialization...');
                  retryCount++;
                  setTimeout(initializeLanguage, retryDelay);
                } else {
                  console.error('❌ Language initialization failed after', maxRetries, 'attempts');
                }
              }
            }, 100);
          } else {
            console.log('🔄 No model found during initialization');
          }
        } catch (error) {
          console.error('❌ Error during language initialization:', error);
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(initializeLanguage, retryDelay);
          }
        }
      };

      // Start initialization
      setTimeout(initializeLanguage, 100);
    }
  }, [selectedLanguage, questionData]);

  const handleEditorDidMount = useCallback((editor, monaco) => {
    console.log('🔧 Editor mounted with language:', selectedLanguage, 'mapped to:', getMonacoLanguage(selectedLanguage));
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Force language setting after mount
    setTimeout(() => {
      if (editor && monaco && selectedLanguage) {
        const model = editor.getModel();
        if (model) {
          const mappedLang = getMonacoLanguage(selectedLanguage);
          console.log('🔧 Force setting language on mount:', mappedLang);
          monaco.editor.setModelLanguage(model, mappedLang);

          // Additional force refresh
          setTimeout(() => {
            editor.updateOptions({
              ...editor.getOptions(),
              language: mappedLang
            });
          }, 50);
        }
      }
    }, 200);

    resizeObserverRef.current = new ResizeObserver((entries) => {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }

      layoutTimeoutRef.current = setTimeout(() => {
        try {
          if (editorRef.current && !editorRef.current.isDisposed()) {
            editorRef.current.layout();
          }
        } catch (error) {
          console.warn('Editor layout error:', error);
        }
      }, 0);
    });

    const container = editor.getContainerDomNode()?.parentElement?.parentElement;
    if (container && resizeObserverRef.current) {
      resizeObserverRef.current.observe(container);
    }

    registerIntelliSense(editor, monaco);

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

    editor.updateOptions({
      contextmenu: false,
    });

  }, []);

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

  const adjustTextareaHeight = (element) => {
    if (element) {
      element.style.height = 'auto';
      const newHeight = Math.min(200, Math.max(80, element.scrollHeight));
      element.style.height = newHeight + 'px';
    }
  };

  const getMonacoLanguage = (lang) => {
    console.log('🎨 getMonacoLanguage called with:', lang);
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
    const result = languageMap[lang] || 'plaintext';
    console.log('🎨 Mapped language:', lang, '->', result);
    return result;
  };

  useEffect(() => {
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

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex bg-white dark:bg-dark-primary select-none overflow-hidden">
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
        </div>

        <div className="p-6 flex-1 min-h-0 overflow-auto h-full">
          {activeTab === 'description' && (
            <div className="text-gray-700 dark:text-gray-400">
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words">{String(questionData?.questionname)}</h1>
                  {isCompleted && (
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">Easy</span>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Icons.Trophy />
                    <span className="text-sm">2.5K</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Icons.Clock />
                    <span className="text-sm">15 min</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="break-words">
                  {questionData?.question}
                </p>

                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Example 1:</h2>
                  <pre className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
                    {questionData?.Example?.[0] || 'No example provided'}
                  </pre>
                </div>

                {questionData?.Example?.[1] && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Example 2:</h2>
                    <pre className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
                      {questionData?.Example?.[1]}
                    </pre>
                  </div>
                )}

                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Constraints:</h2>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-400">
                    <li>{questionData?.constraints?.[0] || 'No constraints provided'}</li>
                    <li>{questionData?.constraints?.[1]}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'testcases' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                    <Icons.Code2 size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Manual Test Cases</h3>
                </div>
                <button
                  onClick={runCode}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  <Icons.Play size={16} />
                  Run Tests
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-6">
                {testCasesrun.map((_, idx) => (
                  <button
                    key={idx}
                    className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${testCaseTab === idx
                      ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white shadow-md'
                      : 'bg-white dark:bg-dark-secondary text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dark-tertiary hover:border-gray-400 dark:hover:border-gray-600'
                      }`}
                    onClick={() => setTestCaseTab(idx)}
                  >
                    <span>Case {idx + 1}</span>
                    {testCasesrun.length > 1 && testCaseTab === idx && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = testCasesrun.filter((_, i) => i !== idx);
                          setTestCases(updated);
                          setTestCaseTab(prev => Math.max(0, prev - 1));
                        }}
                        className="p-0.5 rounded-md hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Icons.X size={12} />
                      </div>
                    )}
                  </button>
                ))}
                <button
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-dark-tertiary text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-dashed border-gray-300 dark:border-gray-600"
                  onClick={() => {
                    setTestCases([...testCasesrun, { input: '', expectedOutput: '' }]);
                    setTestCaseTab(testCasesrun.length);
                  }}
                  title="Add New Case"
                >
                  <Icons.Plus size={18} />
                </button>
              </div>

              <div className="bg-white dark:bg-dark-secondary rounded-2xl border border-gray-200 dark:border-dark-tertiary overflow-hidden shadow-sm">
                <div className="p-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-dark-tertiary">
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Input Data</label>
                      <span className="text-[10px] font-bold text-gray-400 italic">Standard In</span>
                    </div>
                    <textarea
                      ref={inputRef}
                      className="w-full p-4 border-none focus:ring-0 bg-gray-50/50 dark:bg-dark-tertiary/20 rounded-xl text-gray-900 dark:text-gray-200 font-mono text-sm min-h-[120px] resize-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                      value={testCasesrun[testCaseTab]?.input || ''}
                      onChange={e => {
                        const updated = [...testCasesrun];
                        updated[testCaseTab].input = e.target.value;
                        setTestCases(updated);
                        requestAnimationFrame(() => adjustTextareaHeight(e.target));
                      }}
                      placeholder="e.g. 5 10 15"
                    />
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expected Output</label>
                      <span className="text-[10px] font-bold text-gray-400 italic">Correct Response</span>
                    </div>
                    <textarea
                      ref={outputRef}
                      className="w-full p-4 border-none focus:ring-0 bg-gray-50/50 dark:bg-dark-tertiary/20 rounded-xl text-gray-900 dark:text-gray-200 font-mono text-sm min-h-[120px] resize-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                      value={testCasesrun[testCaseTab]?.expectedOutput || ''}
                      onChange={e => {
                        const updated = [...testCasesrun];
                        updated[testCaseTab].expectedOutput = e.target.value;
                        setTestCases(updated);
                        requestAnimationFrame(() => adjustTextareaHeight(e.target));
                      }}
                      placeholder="e.g. 30"
                    />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[11px] text-gray-400 dark:text-gray-500 text-center italic">
                Tests are run against current code version in editor.
              </p>
            </div>
          )}

          {activeTab === 'output' && (
            <div className="py-8 px-4 flex flex-col items-center">
              {output ? (
                <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">{output}</pre>
              ) : (
                <>
                  <AnimatedTestResults testResults={testResults} runsubmit={runsubmit} />
                </>
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
        </div>
      </div>

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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="bg-white dark:bg-dark-secondary border-t border-gray-200 dark:border-dark-tertiary p-2 flex justify-between items-center gap-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={resetCode}
              title="Reset to initial code"
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md flex items-center gap-1 text-xs transition-colors duration-150"
            >
              <Icons.History className="w-3 h-3" />
              Reset
            </button>
            <select
              className="bg-white dark:bg-dark-secondary text-gray-900 dark:text-white border border-gray-300 dark:border-dark-tertiary rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent"
              value={selectedLanguage}
              onChange={handleLanguageChange}
            >
              {allowlanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={runCode}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-tertiary text-gray-700 dark:text-gray-300 font-bold text-xs transition-all hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95"
            >
              <Icons.Play size={14} className="group-hover:text-indigo-600 transition-colors" />
              Run Code
            </button>

            <button
              onClick={handleSubmit2}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xs transition-all shadow-lg shadow-green-500/20 active:scale-95"
            >
              <Icons.ChevronRight size={14} />
              Submit Solution
            </button>
          </div>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-900 min-w-0 overflow-hidden">
          {console.log('🔧 Editor rendering with:', { selectedLanguage, monacoLanguage })}
          <Editor
            key={monacoLanguage}
            height="100%"
            path="single-file"
            defaultLanguage='text'
            language={monacoLanguage}
            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
            value={typeof code === 'string' ? code : String(code || '')}
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
              readOnly: false,
            }}
          />
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default CodePageSingle;
