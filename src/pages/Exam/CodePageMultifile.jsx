'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../context/ThemeContext';
import { useParams, useNavigate } from "react-router-dom";

import { Icons, languageTemplates } from '../constants';
import { registerIntelliSense, INTELLISENSE_OPTIONS } from '../../hooks/useMonacoIntelliSense';
import { useActiveFileManagement } from '../../hooks/useActiveFileManagement';

import { database } from "../../firebase";
import { ref, get, set, child } from "firebase/database";

import AnimatedTestResults from '../AnimatedTestResults';
import { executeCode } from '../api';
import { useAuth } from '../../context/AuthContext';

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { setItemWithExpiry, getItemWithExpiry } from "../../utils/storageWithExpiry";

function CodePageMultifile({ question, data, navigation, questionData: propQuestionData, selectedLanguage: propSelectedLanguage }) {
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
  // syncing propQuestionData to local state if needed, though using props directly is usually better.
  // We'll keep the local state for consistency with the course version.
  const [questionData, setQuestionData] = useState(propQuestionData || null);
  const [testCasesrun, setTestCases] = useState([{ input: '', expectedOutput: '' }]);
  const [allowlanguages, setallowlanguages] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionTrigger, setSubmissionTrigger] = useState(0);
  const [editorKey, setEditorKey] = useState(0);

  const inputRef = useRef(null);
  const outputRef = useRef(null);

  const { testid } = useParams();
  const { user } = useAuth();
  const questionId = question;
  const userId = user?.uid;
  const navigate = useNavigate();

  const [availableFiles, setAvailableFiles] = useState([]);
  const [multiFileData, setMultiFileData] = useState({});
  const [combinedCodeDisplay, setCombinedCodeDisplay] = useState('');
  const [isStateFinalized, setIsStateFinalized] = useState(false);

  const activeFileManagement = useActiveFileManagement({
    clearPendingOperations: () => {
      if (saveTimeoutRef.current) {
        console.log('🧹 Clearing autosave timeout due to file change');
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    },
    questionId,
    selectedLanguage,
    isMultiFile: true
  });

  const {
    activeFile,
    previousActiveFile,
    activeFileChangeInfo,
    setActiveFile: setActiveFileWithTracking,
    setActiveFileDirect,
    clearFileChangeHistory,
    getFileChangeStats,
    hasActiveFile,
    hasFileChanged,
    changeCount
  } = activeFileManagement;

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

  const loadAllMultiFileData = useCallback(async () => {
    if (!user?.uid || !questionData?.defaultCode?.[selectedLanguage]) {
      return;
    }

    console.log('🔄 Loading all multi-file data...');
    const dbRef = ref(database);
    const languageFiles = questionData.defaultCode[selectedLanguage];
    const allFileData = {};

    for (const fileName of Object.keys(languageFiles)) {
      const fileData = languageFiles[fileName];

      if (fileData?.editable) {
        const fileCodeKey = `ExamCode/${testid}/${userId}/${question}/${selectedLanguage}/${fileName}`;
        try {
          const fileSnapshot = await get(child(dbRef, fileCodeKey));
          if (fileSnapshot.exists()) {
            let savedCode = fileSnapshot.val();
            savedCode = savedCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            allFileData[fileName] = {
              code: savedCode,
              editable: true,
              defaultCode: fileData.code || '',
              visible: fileData.visible !== false
            };
          } else {
            let defaultCode = fileData.code || '';
            defaultCode = defaultCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            allFileData[fileName] = {
              code: defaultCode,
              editable: true,
              defaultCode: defaultCode,
              visible: fileData.visible !== false
            };
          }
        } catch (error) {
          console.error(`Error loading ${fileName}:`, error);
          let fallbackCode = fileData.code || '';
          fallbackCode = fallbackCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

          allFileData[fileName] = {
            code: fallbackCode,
            editable: true,
            defaultCode: fallbackCode,
            visible: fileData.visible !== false
          };
        }
      } else {
        let defaultCode = fileData.code || '';
        defaultCode = defaultCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        allFileData[fileName] = {
          code: defaultCode,
          editable: false,
          defaultCode: defaultCode,
          visible: fileData.visible !== false
        };
      }
    }

    setMultiFileData(allFileData);
    console.log('✅ All multi-file data loaded:', {
      totalFiles: Object.keys(allFileData).length,
      fileNames: Object.keys(allFileData),
      editableFiles: Object.keys(allFileData).filter(name => allFileData[name].editable),
      visibleFiles: Object.keys(allFileData).filter(name => allFileData[name].visible)
    });
  }, [user?.uid, questionData, selectedLanguage, questionId]);

  const combineMultiFileCode = useCallback(() => {
    console.log('🔗 Combining multi-files for execution...');
    const combinedParts = [];

    const languageFiles = questionData?.defaultCode?.[selectedLanguage] || {};

    const order = questionData?.defaultCode?.[selectedLanguage]?.order;
    let fileNames = Object.keys(languageFiles).sort();

    if (order != null || order != undefined) {
      fileNames = order;
    }

    console.log('📋 Available files:', fileNames);

    for (const fileName of fileNames) {
      const fileData = multiFileData[fileName];
      if (fileData && fileData.code) {
        const isVisible = languageFiles[fileName]?.visible !== false;

        if (isVisible) {
          const normalizedCode = fileData.code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          combinedParts.push(normalizedCode);
          console.log(`✅ Added file to combination: ${fileName}`);
        } else {
          console.log(`👁️ Skipping invisible file: ${fileName}`);
        }
      } else {
        console.log(`❌ File data not found: ${fileName}`);
      }
    }

    const combinedCode = combinedParts.join('\n');
    console.log('✅ Combined code created:', {
      totalFiles: fileNames.length,
      visibleFiles: combinedParts.length,
      combinedLength: combinedCode.length,
    });

    return combinedCode;
  }, [multiFileData, questionData, selectedLanguage]);

  const logSubmission = async (status, submittedCode, marks, updatedResults) => {
    console.log("logging submission");
    console.log(user?.email);

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
      console.log("Submission logged successfully.");
      setSubmissionTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error logging submission:", error);
    }
  };

  const handleSubmit2 = async () => {
    console.log(JSON.stringify(multiFileData));

    const testCases = questionData.testcases;
    const sourceCode = combineMultiFileCode();
    console.log('🚀 Submitting code with:', {
      sourceLength: sourceCode.length,
      language: selectedLanguage
    });

    setCombinedCodeDisplay(sourceCode);

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
    let vm = 0;
    let hm = 0;
    let tclen = updatedResults.length;

    updatedResults.forEach((tc, index) => {
      if (tc.passed) {
        if (index < 2) {
          vm += 1;  // first two test cases (visible)
        } else {
          hm += 1;  // remaining test cases (hidden)
        }
      }
    });

    let marks = (vm / 2) * 0.3 + (hm / (tclen - 2)) * 0.7;

    if (updatedResults.length <= 2) {
      marks = (vm / 2) * 1.0;
    }

    await logSubmission(allPassed ? 'correct' : 'wrong', sourceCode, marks, updatedResults);

    // Save exam result and marks
    const finalResult = allPassed ? 'true' : 'false';
    const resultRef = ref(database, `ExamSubmissions/${testid}/${userId}/${question}/`);
    const markRef = ref(database, `Marks/${testid}/${userId}/${question}/`);

    const prevmark = await get(markRef);
    if (!prevmark.exists() || prevmark.val() < (marks * 100)) {
      await set(resultRef, finalResult);
      await set(markRef, (marks) * 100);
    }

    setIsCompleted(allPassed);
  };

  const runCode = async () => {
    const testCases = testCasesrun;
    console.log('Running test cases:', testCases);

    try {
      const sourceCode = combineMultiFileCode();
      console.log('🚀 Executing code with:', {
        sourceLength: sourceCode.length,
        language: selectedLanguage
      });

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

    if (!isStateFinalized) {
      console.log('⏳ Waiting for state finalization...');
      return;
    }

    try {
      const dbRef = ref(database);
      const fileCodeKey = `ExamCode/${testid}/${userId}/${question}/${selectedLanguage}/${activeFile}`;

      console.log('Multi-file load:', {
        fileCodeKey,
        defaultCode: questionData?.defaultCode[selectedLanguage][activeFile]?.code
      });

      if (!questionData?.defaultCode[selectedLanguage][activeFile]?.editable) {
        let rawCode = questionData?.defaultCode[selectedLanguage][activeFile]?.code || "";

        if (typeof rawCode !== 'string') {
          rawCode = String(rawCode || '');
        }

        if (rawCode === '[object Object]' || rawCode.includes('object')) {
          rawCode = '';
        }

        setCode(rawCode);
        return;
      }

      const fileSnapshot = await get(child(dbRef, fileCodeKey));

      if (fileSnapshot.exists()) {
        let rawCode = fileSnapshot.val();

        if (typeof rawCode !== 'string') {
          rawCode = String(rawCode || '');
        }

        if (rawCode === '[object Object]' || rawCode.includes('object')) {
          rawCode = questionData?.defaultCode[selectedLanguage][activeFile]?.code || '';
          rawCode = typeof rawCode === 'string' ? rawCode : String(rawCode || '');
        }

        setCode(rawCode);
      } else {
        let rawCode = questionData?.defaultCode[selectedLanguage][activeFile]?.code || "";

        if (typeof rawCode !== 'string') {
          rawCode = String(rawCode || '');
        }

        if (rawCode === '[object Object]' || rawCode.includes('object')) {
          rawCode = '';
        }

        setCode(rawCode);
      }
    } catch (error) {
      console.error("Error loading code:", error);
      const template = languageTemplates[selectedLanguage] || "";
      setCode(typeof template === 'string' ? template : String(template || ''));
    }
  }, [testid, questionId, selectedLanguage, questionData, activeFile, user?.uid, isStateFinalized]);

  const saveCode = useCallback(async (codeToSave) => {
    if (!user?.uid) return;

    try {
      if (activeFile && questionData?.defaultCode[selectedLanguage][activeFile]?.editable === true) {
        const codeKey = `ExamCode/${testid}/${userId}/${question}/${selectedLanguage}/${activeFile}`;
        const dbRef = ref(database, codeKey);
        console.log('💾 Saving multi-file code to:', codeKey);

        await set(dbRef, codeToSave);
        console.log(`✅ Code auto-saved for ${activeFile} successfully!`);
      } else {
        console.log('❌ Not saving - file is not editable or no active file');
      }
    } catch (error) {
      console.error("❌ Error saving code:", error);
    }
  }, [testid, questionId, selectedLanguage, activeFile, questionData, user?.uid]);

  const handleCodeChange = useCallback((newValue) => {
    if (!questionData) {
      console.log('Waiting for questionData...');
      return;
    }

    if (!activeFile) {
      console.log('Waiting for activeFile...');
      return;
    }

    if (!questionData?.defaultCode?.[selectedLanguage]?.[activeFile]) {
      console.log('🚫 Stale activeFile detected - ignoring change');
      return;
    }

    const currentFileData = questionData?.defaultCode?.[selectedLanguage]?.[activeFile];
    const currentEditable = currentFileData?.editable;

    if (!currentFileData) {
      console.log('🚫 Stale code change detected - ignoring');
      return;
    }

    if (!currentEditable === true) {
      console.log('Waiting for editable file...');
      return;
    }

    if (!currentEditable) {
      console.log('🚫 Code change blocked - file is not editable');
      return;
    }

    setCode(newValue);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (!currentEditable) {
      return;
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveCode(newValue);
    }, 500);
  }, [saveCode, activeFile, questionData]);

  const handleLanguageChange = useCallback((e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    setEditorKey(prev => prev + 1);
  }, []);

  const resetCode = () => {
    if (activeFile) {
      const rawCode = questionData?.defaultCode[selectedLanguage][activeFile]?.code || "";
      const defaultCode = typeof rawCode === 'string' ? rawCode : String(rawCode || '');
      setCode(defaultCode);
      console.log(`Reset ${activeFile} to default:`, defaultCode);

      saveCode(defaultCode);
    }
  };

  // Sync selectedLanguage from props
  useEffect(() => {
    if (propSelectedLanguage && propSelectedLanguage !== selectedLanguage) {
      setSelectedLanguage(propSelectedLanguage);
    }
  }, [propSelectedLanguage]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user?.uid || !questionId) return;

      const path = `ExamCodeSubmissions/${testid}/${userId}/${question}`;
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
  }, [user, questionId, submissionTrigger]);

  useEffect(() => {
    if (selectedLanguage === "") {
      return;
    }

    if (!isStateFinalized) {
      console.log('⏳ Waiting for state finalization...');
      return;
    }

    if (!questionData) {
      console.log('Waiting for questionData...');
      return;
    }

    if (!activeFile || !questionData?.defaultCode[selectedLanguage][activeFile]) {
      console.log('Waiting for multi-file initialization...');
      return;
    }

    console.log('✅ ALL CONDITIONS MET - Loading code...');
    loadCode();
  }, [loadCode, questionData, selectedLanguage, activeFile, questionData?.defaultCode, isStateFinalized]);

  useEffect(() => {
    if (!activeFile || !questionData?.defaultCode?.[selectedLanguage]?.[activeFile] || !questionData) {
      return;
    }

    console.log('✅ ACTIVE FILE CHANGE CONDITIONS MET - Loading code...');
    loadCode();
  }, [activeFile, questionData?.defaultCode, isStateFinalized]);

  useEffect(() => {
    if (!questionData) {
      console.log('Waiting for questionData...');
      return;
    }

    // Reset initialization state when language changes
    setIsStateFinalized(false);

    if (!questionData?.defaultCode?.[selectedLanguage] || selectedLanguage === "") {
      console.log('❌ NO LANGUAGE CODE FOUND OR VOID LANGUAGE:', selectedLanguage);
      setAvailableFiles([]);
      setActiveFileDirect(null);
      setIsStateFinalized(true);
      return;
    }

    const langFiles = questionData?.defaultCode[selectedLanguage];
    const fileNames = Object.keys(langFiles).filter(key => key !== 'order');
    const isMultiFileStructure = fileNames.length >= 1;

    console.log('📁 INITIALIZING MULTIFILE STRUCTURE:', { selectedLanguage, fileNames });

    if (isMultiFileStructure) {
      const nonEditable = {};

      fileNames.forEach(fileName => {
        const fileData = langFiles[fileName];
        const fileCode = fileData?.code || fileData || "";
        const isEditable = fileData?.editable !== undefined ? fileData.editable :
          (fileName.toLowerCase() === 'drivecode' || fileName.toLowerCase().includes('drive'));

        const stringCode = typeof fileCode === 'string' ? fileCode : String(fileCode || '');

        nonEditable[fileName] = {
          code: stringCode,
          editable: isEditable
        };
      });

      setAvailableFiles(fileNames);

      const savedActiveFile = localStorage.getItem(`activeFile_${questionId}_${selectedLanguage}`);
      const validSavedFile = savedActiveFile && fileNames.includes(savedActiveFile) ? savedActiveFile : null;
      const defaultActiveFile = fileNames.find(f => nonEditable[f]?.editable) || fileNames[0];

      const newActiveFile = validSavedFile || defaultActiveFile;
      console.log('🎯 Setting initial active file:', newActiveFile);
      setActiveFileDirect(newActiveFile);

      setIsStateFinalized(true);
    }
  }, [selectedLanguage, questionData]);

  useEffect(() => {
    if (isStateFinalized) {
      loadAllMultiFileData();
    }
  }, [isStateFinalized, loadAllMultiFileData]);

  useEffect(() => {
    if (activeFile && code !== undefined) {
      const normalizedCode = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      setMultiFileData(prev => ({
        ...prev,
        [activeFile]: {
          ...prev[activeFile],
          code: normalizedCode
        }
      }));
    }
  }, [code, activeFile]);

  useEffect(() => {
    setActiveTab('description');
  }, [questionId]);

  useEffect(() => {
    if (propQuestionData !== questionData) {
      console.log('🔄 Question data changed, updating state');
      setQuestionData(propQuestionData);

      if (propQuestionData?.defaultCode?.[selectedLanguage]) {
        const files = Object.keys(propQuestionData.defaultCode[selectedLanguage]);
        const newActiveFile = files.find(f => propQuestionData.defaultCode[selectedLanguage][f]?.editable) || files[0];
        setActiveFileDirect(newActiveFile);
      }
    }
  }, [propQuestionData]);

  useEffect(() => {
    const fetchSubmissionStatus = async () => {
      if (userId && questionData) {
        try {
          const resultRef = ref(database, `ExamSubmissions/${testid}/${userId}/${question}/`);
          const snapshot = await get(resultRef);
          if (snapshot.exists()) {
            setIsCompleted(snapshot.val() === 'true');
          } else {
            setIsCompleted(false);
          }
        } catch (error) {
          console.error('Error fetching submission status:', error);
        }
      }
    };
    fetchSubmissionStatus();
  }, [userId, questionData, testid, question]);

  useEffect(() => {
    if (questionData) {
      const testCases = [
        { input: questionData?.testcases[0]?.input, expectedOutput: questionData?.testcases[0]?.expectedOutput },
        ...(questionData?.testcases[1]?.expectedOutput
          ? [{ input: questionData?.testcases[1]?.input, expectedOutput: questionData?.testcases[1]?.expectedOutput }]
          : [])
      ];
      setTestCases(testCases);
    }
  }, [questionData]);

  useEffect(() => {
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
    fetchAllowedLanguages();
  }, [testid]);

  useEffect(() => {
    const mapped = getMonacoLanguage(selectedLanguage);
    setMonacoLanguage(mapped);
  }, [selectedLanguage]);

  useEffect(() => {
    if (selectedLanguage && editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const mappedLang = getMonacoLanguage(selectedLanguage);
        monacoRef.current.editor.setModelLanguage(model, mappedLang);
      }
    }
  }, [selectedLanguage, activeFile, questionData]);

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

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      const copyDisabled = getItemWithExpiry("copyDisabled");
      if (copyDisabled === null) {
        toast.error("Copy disabled!", { position: "top-right", autoClose: 3000 });
        setItemWithExpiry("copyDisabled", true, 5000);
        return;
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      const pasteDisabled = getItemWithExpiry("pasteDisabled");
      if (pasteDisabled === null) {
        toast.error("Paste disabled!", { position: "top-right", autoClose: 3000 });
        setItemWithExpiry("pasteDisabled", true, 5000);
        return;
      }
    });

    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Insert, () => {
      const shiftInsertDisabled = getItemWithExpiry("shiftInsertDisabled");
      if (shiftInsertDisabled === null) {
        toast.error("Shift insert disabled!😭", { position: "top-right", autoClose: 3000 });
        setItemWithExpiry("shiftInsertDisabled", true, 5000);
        return;
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

  useEffect(() => {
    if (layoutTimeoutRef.current) clearTimeout(layoutTimeoutRef.current);
    layoutTimeoutRef.current = setTimeout(() => {
      if (editorRef.current && !editorRef.current.isDisposed()) {
        try { editorRef.current.layout(); } catch (e) { console.warn('Editor layout error:', e); }
      }
    }, 100);
  }, [leftPanelWidth]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (layoutTimeoutRef.current) clearTimeout(layoutTimeoutRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    };
  }, []);

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

  const adjustTextareaHeight = (element) => {
    if (element) {
      element.style.height = 'auto';
      const newHeight = Math.min(200, Math.max(80, element.scrollHeight));
      element.style.height = newHeight + 'px';
    }
  };

  const getMonacoLanguage = (lang) => {
    const languageMap = {
      'java': 'java', 'python': 'python', 'cpp': 'cpp', 'c': 'c',
      'c++': 'cpp', 'javascript': 'javascript', 'js': 'javascript',
      'typescript': 'typescript', 'ts': 'typescript'
    };
    return languageMap[lang] || 'plaintext';
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.style.height = inputRef.current.scrollHeight + 'px'; }
      if (outputRef.current) { outputRef.current.style.height = 'auto'; outputRef.current.style.height = outputRef.current.scrollHeight + 'px'; }
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
          <button className={`px-4 py-3 text-sm font-medium ${activeTab === 'description' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'}`} onClick={() => setActiveTab('description')}>
            <div className="flex items-center gap-2"><Icons.FileText />Description</div>
          </button>
          <button className={`px-4 py-3 text-sm font-medium ${activeTab === 'testcases' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'}`} onClick={() => setActiveTab('testcases')}>
            <div className="flex items-center gap-2"><Icons.Code2 />Test Cases</div>
          </button>
          <button className={`px-4 py-3 text-sm font-medium ${activeTab === 'output' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'}`} onClick={() => setActiveTab('output')}>
            <div className="flex items-center gap-2"><Icons.Terminal />Output</div>
          </button>
          <button className={`px-4 py-3 text-sm font-medium ${activeTab === 'submissions' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'}`} onClick={() => setActiveTab('submissions')}>
            <div className="flex items-center gap-2"><Icons.Clock />Submissions</div>
          </button>
          <button className={`px-4 py-3 text-sm font-medium ${activeTab === 'combined' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'}`} onClick={() => setActiveTab('combined')}>
            <div className="flex items-center gap-2"><Icons.Code2 />Combined Code</div>
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
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><Icons.Trophy /><span className="text-sm">2.5K</span></div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><Icons.Clock /><span className="text-sm">15 min</span></div>
                </div>
              </div>
              <div className="space-y-4">
                <p className="break-words">{questionData?.question}</p>
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Example 1:</h2>
                  <pre className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">{questionData?.Example?.[0] || 'No example provided'}</pre>
                </div>
                {questionData?.Example?.[1] && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Example 2:</h2>
                    <pre className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">{questionData?.Example?.[1]}</pre>
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
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"><Icons.Code2 size={20} /></div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Manual Test Cases</h3>
                </div>
                <button onClick={runCode} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                  <Icons.Play size={16} />Run Tests
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {testCasesrun.map((_, idx) => (
                  <button key={idx} className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${testCaseTab === idx ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white shadow-md' : 'bg-white dark:bg-dark-secondary text-gray-500 dark:text-gray-400 border-gray-200 dark:border-dark-tertiary hover:border-gray-400 dark:hover:border-gray-600'}`} onClick={() => setTestCaseTab(idx)}>
                    <span>Case {idx + 1}</span>
                    {testCasesrun.length > 1 && testCaseTab === idx && (
                      <div onClick={(e) => { e.stopPropagation(); const updated = testCasesrun.filter((_, i) => i !== idx); setTestCases(updated); setTestCaseTab(prev => Math.max(0, prev - 1)); }} className="p-0.5 rounded-md hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors">
                        <Icons.X size={12} />
                      </div>
                    )}
                  </button>
                ))}
                <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-dark-tertiary text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-dashed border-gray-300 dark:border-gray-600" onClick={() => { setTestCases([...testCasesrun, { input: '', expectedOutput: '' }]); setTestCaseTab(testCasesrun.length); }} title="Add New Case">
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
                    <textarea ref={inputRef} className="w-full p-4 border-none focus:ring-0 bg-gray-50/50 dark:bg-dark-tertiary/20 rounded-xl text-gray-900 dark:text-gray-200 font-mono text-sm min-h-[120px] resize-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600" value={testCasesrun[testCaseTab]?.input || ''} onChange={e => { const updated = [...testCasesrun]; updated[testCaseTab].input = e.target.value; setTestCases(updated); requestAnimationFrame(() => adjustTextareaHeight(e.target)); }} placeholder="e.g. 5 10 15" />
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expected Output</label>
                      <span className="text-[10px] font-bold text-gray-400 italic">Correct Response</span>
                    </div>
                    <textarea ref={outputRef} className="w-full p-4 border-none focus:ring-0 bg-gray-50/50 dark:bg-dark-tertiary/20 rounded-xl text-gray-900 dark:text-gray-200 font-mono text-sm min-h-[120px] resize-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600" value={testCasesrun[testCaseTab]?.expectedOutput || ''} onChange={e => { const updated = [...testCasesrun]; updated[testCaseTab].expectedOutput = e.target.value; setTestCases(updated); requestAnimationFrame(() => adjustTextareaHeight(e.target)); }} placeholder="e.g. 30" />
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[11px] text-gray-400 dark:text-gray-500 text-center italic">Tests are run against current code version in editor.</p>
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
                          {(() => { const fixed = s.timestamp.replace(/T(\d{2})_(\d{2})_(\d{2})_(\d{3})Z/, 'T$1:$2:$3.$4Z'); const date = new Date(fixed); return isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }); })()}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{s.language}</td>
                        <td className={`px-4 py-2 text-sm font-medium ${s.status === 'correct' ? 'text-green-600' : 'text-red-500'}`}>{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'combined' && (
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Combined Code</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">This is combined code from all visible files in correct order, ready for execution.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <pre className="p-4 text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap overflow-x-auto">
                  {combineMultiFileCode() || 'No combined code available.'}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`w-1 bg-gray-200 dark:bg-dark-tertiary hover:bg-[#4285F4] cursor-col-resize flex items-center justify-center group transition-colors duration-150 ${isDragging ? 'bg-[#4285F4]' : ''}`}
        onMouseDown={handleMouseDown}
        style={{ zIndex: 10 }}
      >
        <Icons.GripVertical size={16} className="text-gray-400 group-hover:text-[#4285F4] opacity-0 group-hover:opacity-100" />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="bg-white dark:bg-dark-secondary border-t border-gray-200 dark:border-dark-tertiary p-2 flex justify-between items-center gap-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            {availableFiles.length > 0 && (
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-tertiary rounded-lg p-1">
                {availableFiles.map((fileName) => {
                  const fileData = questionData?.defaultCode[selectedLanguage][fileName];
                  const isActive = activeFile === fileName;
                  const isEditable = fileData?.editable;
                  return (
                    <button
                      key={fileName}
                      onClick={() => setActiveFileWithTracking(fileName)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${isActive ? 'bg-white dark:bg-dark-secondary text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'} ${!isEditable ? 'opacity-75' : ''}`}
                      title={isEditable ? 'Click to edit this file' : 'Read-only file'}
                    >
                      <Icons.FileText size={12} />
                      <span className="truncate max-w-24">{fileName}</span>
                      {!isEditable && <span className="text-[10px] text-gray-400 dark:text-gray-500" title="Read-only">🔒</span>}
                    </button>
                  );
                })}
              </div>
            )}
            <button onClick={resetCode} title="Reset to initial code" className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md flex items-center gap-1 text-xs transition-colors duration-150">
              <Icons.History className="w-3 h-3" />Reset
            </button>
            <select className="bg-white dark:bg-dark-secondary text-gray-900 dark:text-white border border-gray-300 dark:border-dark-tertiary rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent" value={selectedLanguage} onChange={handleLanguageChange}>
              {allowlanguages.map((lang) => (<option key={lang} value={lang}>{lang}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={runCode} className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-tertiary text-gray-700 dark:text-gray-300 font-bold text-xs transition-all hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95">
              <Icons.Play size={14} className="group-hover:text-indigo-600 transition-colors" />Run Code
            </button>
            <button onClick={handleSubmit2} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xs transition-all shadow-lg shadow-green-500/20 active:scale-95">
              <Icons.ChevronRight size={14} />Submit Solution
            </button>
          </div>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-900 min-w-0 overflow-hidden">
          <Editor
            height="100%"
            path={activeFile || 'multi-file'}
            defaultLanguage='text'
            language={monacoLanguage}
            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
            value={typeof code === 'string' ? code : String(code || '')}
            onChange={(newValue) => {
              if (!activeFile || !questionData?.defaultCode?.[selectedLanguage]?.[activeFile]) return;
              const isEditable = questionData?.defaultCode?.[selectedLanguage]?.[activeFile]?.editable;
              if (!isEditable) return;
              handleCodeChange(newValue);
            }}
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
              readOnly: Boolean(activeFile && !questionData?.defaultCode?.[selectedLanguage]?.[activeFile]?.editable),
            }}
          />
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default CodePageMultifile;
