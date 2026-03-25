'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';
import { useParams, useRouter } from 'next/navigation';


import { Icons, languageTemplates } from './constants';
import { registerIntelliSense, INTELLISENSE_OPTIONS } from '../hooks/useMonacoIntelliSense';

import { database } from "../firebase";
import { ref, get, set, child } from "firebase/database";

import AnimatedTestResults from './AnimatedTestResults';
import { executeCode } from './api';

import CompletionAnimation from '../components/CompletionAnimation';
import { useAuth } from '../context/AuthContext';

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { setItemWithExpiry, getItemWithExpiry } from "../utils/storageWithExpiry";
import { decodeShort } from '../utils/urlEncoder';
import { aiApi } from './api';
import ReactMarkdown from 'react-markdown';


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
  const [showCompletion, setShowCompletion] = useState(false);
  const { theme } = useTheme();
  const [questionData, setQuestionData] = useState(propQuestionData || null);
  const [courseData, setCourseData] = useState(null);
  const [testCasesrun, setTestCases] = useState([{ input: '', expectedOutput: '' }]);
  const [allowlanguages, setallowlanguages] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionTrigger, setSubmissionTrigger] = useState(0);
  const [editorKey, setEditorKey] = useState(0);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [complexity, setComplexity] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null); // { score, improvements: [] }
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Global settings
  const [globalChatbotEnabled, setGlobalChatbotEnabled] = useState(true);
  const [globalCodeEvaluateEnabled, setGlobalCodeEvaluateEnabled] = useState(true);

  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const chatEndRef = useRef(null); // Auto-scroll ref for AI chat

  const { course: encCourse, subcourse: encSubcourse, questionId: encQuestionId } = useParams();
  const course = decodeShort(encCourse);
  const subcourse = decodeShort(encSubcourse);
  const questionId = decodeShort(encQuestionId);
  const { user } = useAuth();
  const router = useRouter();

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

  // ── Firebase AI Chat backup ──────────────────────────────────────────────────
  const getChatRef = useCallback(() => {
    if (!user?.uid || !questionId || !course || !subcourse) return null;
    const safeCourse = sanitizeKey(course);
    const safeSubcourse = sanitizeKey(subcourse);
    const safeQId = sanitizeKey(questionId);
    return ref(database, `AIChat/${user.uid}/${safeCourse}/${safeSubcourse}/${safeQId}`);
  }, [user?.uid, course, subcourse, questionId]);

  // Reset chat state and then restore from Firebase on mount / question change
  useEffect(() => {
    // 1. Clear previous chat immediately when question changes
    setChatMessages([]);
    setIsChatLoading(false);

    // 2. Load new chat
    const load = async () => {
      const chatRef = getChatRef();
      if (!chatRef) return;
      try {
        const snap = await get(chatRef);
        if (snap.exists()) {
          const saved = snap.val();
          if (Array.isArray(saved) && saved.length > 0) {
            setChatMessages(saved);
          }
        }
      } catch (e) {
        console.error('Failed to load chat backup', e);
      }
    };
    load();
  }, [getChatRef]);

  // Auto-save chat to Firebase whenever messages change (debounced)
  const chatSaveTimeoutRef = useRef(null);
  const activeChatIdRef = useRef(questionId);

  useEffect(() => {
    activeChatIdRef.current = questionId;
  }, [questionId]);

  useEffect(() => {
    // If messages are empty, there's nothing to save/backup right now,
    // (Except when clearing, but clearing is handled directly in the Clear Chat button)
    if (chatMessages.length === 0) return;

    // Prevent old messages from bleeding into the new question's save file 
    // by comparing the questionId that triggered this render to the current active one.
    const savedQid = questionId;

    if (chatSaveTimeoutRef.current) clearTimeout(chatSaveTimeoutRef.current);
    chatSaveTimeoutRef.current = setTimeout(async () => {
      if (savedQid !== activeChatIdRef.current) return; // Route changed, don't save

      const chatRef = getChatRef();
      if (!chatRef) return;
      try {
        await set(chatRef, chatMessages);
      } catch (e) {
        console.error('Failed to save chat backup', e);
      }
    }, 800);
    return () => clearTimeout(chatSaveTimeoutRef.current);
  }, [chatMessages, getChatRef, questionId]);

  // Auto-scroll to bottom when new messages arrive or chat tab opens
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading, activeTab]);


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
      time: 0,
      memory: 0,
      timeout: false,
    }));

    setComplexity(null);
    setEvaluation(null);
    try {
      const compRes = await aiApi.analyzeComplexity(code + "\n\n// Please provide ONLY a single line time complexity explanation for this code without any other text.");
      if (compRes.data.success) {
        setComplexity(compRes.data.response);
      }
    } catch (err) {
      console.error("Complexity analysis failed:", err);
    }


    console.log(initialResults);

    setTestResults(initialResults);
    setOutput(null);
    setActiveTab('output');
    setRunSubmit('submit');

    const updatedResults = [...initialResults];

    const promises = testCases.map(async (tc, i) => {
      const { input, expectedOutput } = tc;
      try {
        const response = await executeCode(selectedLanguage, sourceCode, input);
        const result = response.run || response;

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
          input,
          expected: expectedOutput,
          output: resultOutput,
          passed,
          status: 'done',
          time: result.time || result.cpuTime || 0,
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
          status: 'done',
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

    const allPassed = updatedResults.every(tc => tc.passed);
    if (allPassed) {
      setShowCompletion(true);
    }
    await markProblemAsCompleted(allPassed);
    await logSubmission(allPassed ? 'correct' : 'wrong', sourceCode);
  };

  const copySubmissionToEditor = (submission) => {
    setCode(submission.code);
    setSelectedLanguage(submission.language);
    setShowSubmissionModal(false);
    setActiveTab('description');
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
        isFirstFailure: false,
        time: 0,
        memory: 0,
        timeout: false,
      }));

      setComplexity(null);
      setEvaluation(null);
      try {
        const compRes = await aiApi.analyzeComplexity(code + "\n\n// Please provide ONLY a single line time complexity explanation for this code without any other text.");
        if (compRes.data.success) {
          setComplexity(compRes.data.response);
        }
      } catch (err) {
        console.error("Complexity analysis failed:", err);
      }


      setTestResults(initialResults);
      setOutput(null);
      setActiveTab('output');
      setRunSubmit('run');

      const updatedResults = [...initialResults];

      const promises = testCases.map(async (tc, i) => {
        const { input: testInput, expectedOutput } = tc;
        try {
          const response = await executeCode(selectedLanguage, sourceCode, testInput);
          const result = response.run || response;
          const resultOutput = result.output || '';
          
          const normalize = (text) => {
            if (!text && text !== "") return [];
            const lines = String(text).split('\n');
            const processed = [...lines];
            while (processed.length > 0 && processed[processed.length - 1].trimEnd() === "") {
              processed.pop();
            }
            return processed;
          };

          const resultLines = normalize(resultOutput);
          const expectedLines = normalize(expectedOutput);

          const passed = resultLines.length === expectedLines.length &&
            resultLines.every((val, idx) => val.trimEnd() === expectedLines[idx].trimEnd());

          const currentResult = {
            input: testInput,
            expected: expectedOutput,
            output: result?.error || resultOutput,
            passed,
            status: 'done',
            isFirstFailure: false,
            time: result.time || result.cpuTime || 0,
            memory: result.memory || 0,
            timeout: result.timeout || false,
            error: result?.error
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
            isFirstFailure: false,
            time: 0,
            memory: 0,
            timeout: false,
            error: error.message || 'Error executing code'
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
        isFirstFailure: true,
        time: 0,
        memory: 0,
        timeout: false,
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
    setEvaluation(null);
    setComplexity(null);

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
    setEditorKey(prev => prev + 1);
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
    const DEFAULT_LANGUAGES = ['cpp', 'java', 'python', 'javascript'];

    try {
      const snapshot = await get(child(dbRef, `/AlgoCore/${course}/course/allowedLanguages`));

      let mappedLangs = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        let normalizedArray = Array.isArray(data) ? data : Object.values(data);
        
        mappedLangs = normalizedArray.map(lang => {
          const l = String(lang).toLowerCase();
          if (l === 'c/c++' || l === 'c++') return 'cpp';
          return l;
        });
      }

      // If no languages found or empty array, use defaults
      if (mappedLangs.length === 0) {
        console.warn("No allowed languages found in Firebase, using defaults.");
        mappedLangs = DEFAULT_LANGUAGES;
      }

      setallowlanguages(mappedLangs);
      setSelectedLanguage(prev => mappedLangs.includes(prev) ? prev : mappedLangs[0] || '');
      console.log("Allowed languages mapped:", mappedLangs);

    } catch (error) {
      console.error("Failed to fetch templates:", error);
      setallowlanguages(DEFAULT_LANGUAGES);
      setSelectedLanguage(prev => DEFAULT_LANGUAGES.includes(prev) ? prev : DEFAULT_LANGUAGES[0]);
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
    setEvaluation(null);
    setComplexity(null);
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
    const fetchSettings = async () => {
      if (user?.uid) {
        try {
          const snapshot = await get(ref(database, `users/${user.uid}/profile/settings`));
          if (snapshot.exists()) {
            const s = snapshot.val();
            setGlobalChatbotEnabled(s.chatbotEnabled !== false);
            setGlobalCodeEvaluateEnabled(s.codeEvaluateEnabled !== false);
          }
        } catch (e) {
          console.error("Failed to load settings", e);
        }
      }
    };
    fetchSettings();
  }, [user]);

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

    // Register intellisense immediately on mount
    registerIntelliSense(editor, monaco);

    // Force language setting immediately after mount
    if (editor && monaco && selectedLanguage) {
      const model = editor.getModel();
      if (model) {
        const mappedLang = getMonacoLanguage(selectedLanguage);
        console.log('🔧 Setting language on mount:', mappedLang);
        monaco.editor.setModelLanguage(model, mappedLang);
      }
    }

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



    // Completely disable copy command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      toast.warning('Copy is not allowed');
      return false;
    });

    // Completely disable paste command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      toast.warning('Paste is not allowed');
      return false;
    });

    // Completely disable cut command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {
      toast.warning('Cut is not allowed');
      return false;
    });

    // Completely disable Shift+Insert paste
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Insert, () => {
      toast.warning('Paste is not allowed');
      return false;
    });

    // Disable context menu and right-click
    editor.updateOptions({
      contextmenu: false,
    });

    // Prevent right-click context menu
    const editorElement = editor.getDomNode();
    if (editorElement) {
      editorElement.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }, true);

      // Prevent selection copy
      editorElement.addEventListener('copy', (e) => {
        toast.warning('Copy is not allowed');
        e.preventDefault();
        e.stopPropagation();
        return false;
      }, true);

      // Prevent paste
      editorElement.addEventListener('paste', (e) => {
        toast.warning('Paste is not allowed');
        e.preventDefault();
        e.stopPropagation();
        return false;
      }, true);

      // Prevent cut
      editorElement.addEventListener('cut', (e) => {
        toast.warning('Cut is not allowed');
        e.preventDefault();
        e.stopPropagation();
        return false;
      }, true);

      // Prevent drag and drop
      editorElement.addEventListener('drop', (e) => {
        toast.warning('Drag and drop is not allowed');
        e.preventDefault();
        e.stopPropagation();
        return false;
      }, true);

      editorElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }, true);
    }

  }, [selectedLanguage]);

  // Update language when monacoLanguage changes
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    const mappedLang = getMonacoLanguage(selectedLanguage);
    console.log('🔧 Updating language via useEffect:', mappedLang);
    monacoRef.current.editor.setModelLanguage(model, mappedLang);
  }, [monacoLanguage, selectedLanguage]);

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
    <>
      <CompletionAnimation isVisible={showCompletion} onClose={() => setShowCompletion(false)} />
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
            {globalChatbotEnabled && (
              <button
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'chat' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'}`}
                onClick={() => setActiveTab('chat')}
              >
                <div className="flex items-center gap-2">
                  <Icons.MessageSquare />
                  Chat
                </div>
              </button>
            )}
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
                  <div className="break-words text-[15px] leading-relaxed">
                    {questionData?.question && typeof questionData.question === 'string'
                      ? questionData.question.split(/\\n|\n/).map((line, i, arr) => (
                        <React.Fragment key={i}>
                          {line}
                          {i !== arr.length - 1 && <br />}
                        </React.Fragment>
                      ))
                      : questionData?.question}
                  </div>

                  {questionData?.svgContent && (
                    <div
                      className="my-4 flex justify-center w-full dark:[&>svg]:invert dark:[&>svg]:hue-rotate-180 [&>svg]:max-w-full [&>svg]:h-auto"
                      dangerouslySetInnerHTML={{ __html: questionData.svgContent }}
                    />
                  )}

                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Example 1:</h2>
                    <pre className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
                      {questionData?.Example?.[0] && typeof questionData.Example[0] === 'string'
                        ? questionData.Example[0].replace(/\\n/g, '\n')
                        : questionData?.Example?.[0] || 'No example provided'}
                    </pre>
                  </div>

                  {questionData?.Example?.[1] && (
                    <div className="mt-6">
                      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Example 2:</h2>
                      <pre className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
                        {typeof questionData.Example[1] === 'string'
                          ? questionData.Example[1].replace(/\\n/g, '\n')
                          : questionData.Example[1]}
                      </pre>
                    </div>
                  )}

                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Constraints:</h2>
                    <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-400">
                      {questionData?.constraints && questionData.constraints.length > 0 ? (
                        questionData.constraints.map((constraint, index) => (
                          <li key={index}>{constraint}</li>
                        ))
                      ) : (
                        <li>No constraints provided</li>
                      )}
                    </ul>
                  </div>

                  {/* Report Issue Button below Description */}
                  {navigation?.setShowReportModal && (
                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={() => navigation.setShowReportModal(true)}
                        className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-medium transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        Report Issue
                      </button>
                    </div>
                  )}
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
              <div className="py-8 px-4 flex flex-col items-center w-full">

                {output ? (
                  <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">{output}</pre>
                ) : (
                  <div className="w-full">
                    <AnimatedTestResults testResults={testResults} runsubmit={runsubmit} />
                  </div>
                )}
                {complexity && (
                  <div className="w-full mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                    <h3 className="text-indigo-900 dark:text-indigo-100 font-bold mb-2 flex items-center gap-2">
                      <Icons.Zap size={16} /> Complexity Analysis
                    </h3>
                    <p className="text-indigo-800 dark:text-indigo-200 text-sm italic">{complexity}</p>
                  </div>
                )}

                {/* ── Evaluate Section ── */}
                {globalCodeEvaluateEnabled && (
                  <div className="w-full mb-4">
                    <button
                      onClick={async () => {
                        if (!code?.trim()) return;
                        setIsEvaluating(true);
                        setEvaluation(null);
                        try {
                          const prompt = `You are a strict code reviewer. Evaluate the following code for the problem "${questionData?.questionname || 'Unknown'}".\n\nCode:\n${code}\n\nRespond ONLY in this exact JSON format (no markdown, no explanation outside JSON):\n{"score": <number 0-100>, "improvements": ["<point 1>", "<point 2>", ...]}`;
                          const res = await aiApi.evaluateCode(prompt);
                          const raw = res.data?.response || res.data?.reply || res.data?.content || '';
                          // Extract JSON from response
                          const jsonMatch = raw.match(/{[\s\S]*}/);
                          if (jsonMatch) {
                            const parsed = JSON.parse(jsonMatch[0]);
                            setEvaluation(parsed);
                          } else {
                            setEvaluation({ score: null, improvements: [raw] });
                          }
                        } catch (e) {
                          console.error('Evaluation failed:', e);
                          setEvaluation({ score: null, improvements: ['Evaluation failed. Please try again.'] });
                        } finally {
                          setIsEvaluating(false);
                        }
                      }}
                      disabled={isEvaluating || !code?.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow transition-all"
                    >
                      {isEvaluating ? (
                        <><Icons.Loader size={14} className="animate-spin" /> Evaluating…</>
                      ) : (
                        <><Icons.Star size={14} /> Evaluate Code</>
                      )}
                    </button>

                    {evaluation && (
                      <div className="mt-4 p-4 bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                        {/* Score ring */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-black border-4 ${evaluation.score >= 80 ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                            : evaluation.score >= 50 ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                              : 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                            }`}>
                            {evaluation.score ?? '?'}
                          </div>
                          <div>
                            <p className="text-base font-bold text-gray-800 dark:text-gray-100">Code Score</p>
                            <p className={`text-sm font-semibold ${evaluation.score >= 80 ? 'text-green-600 dark:text-green-400'
                              : evaluation.score >= 50 ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-red-600 dark:text-red-400'
                              }`}>
                              {evaluation.score >= 80 ? '🎉 Great job!' : evaluation.score >= 50 ? '👍 Room to improve' : '⚠️ Needs work'}
                            </p>
                          </div>
                        </div>

                        {/* Improvements */}
                        {evaluation.improvements?.length > 0 && evaluation.score < 100 && (
                          <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">What to improve:</p>
                            <ul className="space-y-1.5">
                              {evaluation.improvements.map((point, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                  <span className="mt-0.5 text-violet-500 shrink-0">•</span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}


              </div>

            )}

            {activeTab === 'chat' && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-dark-tertiary bg-white dark:bg-dark-secondary">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">AI Chat</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 p-4 min-h-0">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-gray-400 py-10">
                      <Icons.Bot size={48} className="mx-auto mb-4 opacity-20" />
                      <p>Ask anything about this problem or your code!</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => setChatMessages(prev => prev.filter((_, idx) => idx !== i))}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-opacity self-center mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Delete message"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}

                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-gray-100 dark:bg-dark-tertiary text-gray-800 dark:text-gray-200 rounded-tl-none prose dark:prose-invert max-w-none'
                        } overflow-x-auto relative`}
                      >
                        {msg.role === 'user' ? (
                          <p className="whitespace-pre-wrap m-0">{msg.content}</p>
                        ) : (
                          <ReactMarkdown
                            components={{
                              pre: ({ node, ...props }) => (
                                <div className="overflow-x-auto bg-gray-900 text-gray-100 rounded p-2 my-2">
                                  <pre {...props} />
                                </div>
                              ),
                              code: ({ node, inline, ...props }) => (
                                inline
                                  ? <code className="bg-gray-300 dark:bg-gray-700 rounded px-1" {...props} />
                                  : <code {...props} />
                              )
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <button
                          onClick={() => setChatMessages(prev => prev.filter((_, idx) => idx !== i))}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-opacity self-center ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Delete message"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-dark-tertiary p-3 rounded-2xl rounded-tl-none text-sm animate-pulse">
                        Thinking...
                      </div>
                    </div>
                  )}
                  {/* Auto-scroll anchor */}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-dark-tertiary bg-white dark:bg-dark-secondary">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!chatInput.trim() || isChatLoading) return;

                      const newMessages = [...chatMessages, { role: 'user', content: chatInput }];
                      setChatMessages(newMessages);
                      setChatInput('');
                      setIsChatLoading(true);

                      try {
                        const messageCount = chatMessages.length;
                        const additionalInstructions = messageCount < 20 
                          ? "\\n\\nIMPORTANT: We have had fewer than 20 messages in this chat. You MUST NOT give direct answers or full code solutions. Provide ONLY hints, suggestions, and pseudo-code. If the user asks for the answer, tell them you can only give hints for now."
                          : "\\n\\nWe have reached 20 messages. You may now provide direct answers and full code solutions if applicable.";

                        const systemMessage = {
                          role: 'system',
                          content: `Context: Solving coding problem "${questionData?.questionname}".\nDescription: ${questionData?.question || ''}\n\nCurrent Code:\n${code}\n\nPlease use the above code context to answer the user's questions, but only use it if needed or relevant to the user's question.${additionalInstructions}`
                        };
                        const apiMessages = [systemMessage, ...newMessages];
                        const res = await aiApi.chat(apiMessages);
                        if (res.data.success) {
                          setChatMessages([...newMessages, { role: 'assistant', content: res.data.response }]);
                        }
                      } catch (err) {
                        toast.error("Failed to get AI response");
                      } finally {
                        setIsChatLoading(false);
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask the AI..."
                      className="flex-1 bg-gray-50 dark:bg-dark-tertiary border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={isChatLoading || !chatInput.trim()}
                      className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      <Icons.Send size={20} />
                    </button>
                  </form>
                </div>
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                          <td className="px-4 py-2 text-sm flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedSubmission(s);
                                setShowSubmissionModal(true);
                              }}
                              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-medium transition"
                            >
                              View
                            </button>
                            {/* <button
                              onClick={() => copySubmissionToEditor(s)}
                              className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-xs font-medium transition"
                            >
                              Copy to Editor
                            </button> */}
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
      </div>

      <ToastContainer />

      {/* Submission Modal */}
      {
        showSubmissionModal && selectedSubmission && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-dark-secondary border-b border-gray-200 dark:border-dark-tertiary p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submission Details</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {((timestamp) => {
                      const fixed = timestamp.replace(/T(\d{2})_(\d{2})_(\d{2})_(\d{3})Z/, 'T$1:$2:$3.$4Z');
                      const date = new Date(fixed);
                      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
                    })(selectedSubmission.timestamp)}
                  </p>
                </div>
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Language
                    </label>
                    <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-dark-tertiary p-3 rounded">
                      {selectedSubmission.language}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <p className={`p-3 rounded font-medium ${selectedSubmission.status === 'correct'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                      {selectedSubmission.status}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Code
                  </label>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96">
                    {selectedSubmission.code}
                  </pre>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => copySubmissionToEditor(selectedSubmission)}
                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 rounded-lg transition"
                  >
                    Copy to Editor
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedSubmission.code);
                      toast.success('Code copied to clipboard!');
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition"
                  >
                    Copy Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default CodePageSingle;
