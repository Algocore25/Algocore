'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';
import { useParams, useNavigate } from "react-router-dom";

import { Icons, languageTemplates } from './constants';
import { registerIntelliSense, INTELLISENSE_OPTIONS } from '../hooks/useMonacoIntelliSense';
import { useActiveFileManagement } from '../hooks/useActiveFileManagement';

import { database } from "../firebase";
import { ref, get, set, child } from "firebase/database";

import AnimatedTestResults from './AnimatedTestResults';
import { executeCode } from './api';
import { useAuth } from '../context/AuthContext';


import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { setItemWithExpiry, getItemWithExpiry } from "../utils/storageWithExpiry";
import { decodeShort } from '../utils/urlEncoder';




function CodePage({ data, navigation }) {
  const [code, setCode] = useState("");
  const [runsubmit, setRunSubmit] = useState('none');

  const [activeTab, setActiveTab] = useState('description');
  const [output, setOutput] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [testCaseTab, setTestCaseTab] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(45);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const { theme } = useTheme();
  const [questionData, setQuestionData] = useState(null);
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


  // Multi-file state (moved after questionId declaration)
  const [availableFiles, setAvailableFiles] = useState([]);
  const [isMultiFile, setIsMultiFile] = useState(null);
  const [multiFileData, setMultiFileData] = useState({}); // Store all multi-files with their code
  const [combinedCodeDisplay, setCombinedCodeDisplay] = useState(''); // Store combined code for display

  // Function to load all multi-file data with their code
  const loadAllMultiFileData = useCallback(async () => {
    if (!isMultiFile || !user?.uid || !questionData?.defaultCode?.[selectedLanguage]) {
      return;
    }

    console.log('🔄 Loading all multi-file data...');
    const dbRef = ref(database);
    const languageFiles = questionData.defaultCode[selectedLanguage];
    const allFileData = {};

    for (const fileName of Object.keys(languageFiles)) {
      // Skip the order field as it's not a file
      if (fileName === 'order') continue;

      const fileData = languageFiles[fileName];

      if (fileData?.editable) {
        // Try to load saved code from Firebase
        const fileCodeKey = `savedCode/${user.uid}/${course}/${questionId}/${selectedLanguage}/${fileName}`;
        try {
          const fileSnapshot = await get(child(dbRef, fileCodeKey));
          if (fileSnapshot.exists()) {
            let savedCode = fileSnapshot.val();
            // Normalize line endings and remove \r characters
            savedCode = savedCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            allFileData[fileName] = {
              code: savedCode,
              editable: true,
              defaultCode: fileData.code || '',
              visible: fileData.visible !== false
            };
          } else {
            let defaultCode = fileData.code || '';
            // Normalize line endings and remove \r characters
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
          // Normalize line endings and remove \r characters
          fallbackCode = fallbackCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

          allFileData[fileName] = {
            code: fallbackCode,
            editable: true,
            defaultCode: fallbackCode,
            visible: fileData.visible !== false
          };
        }
      } else {
        // For non-editable files, use default code
        let defaultCode = fileData.code || '';
        // Normalize line endings and remove \r characters
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
  }, [isMultiFile, user?.uid, questionData, selectedLanguage, course, questionId]);

  // Function to combine all multi-files into single source code for execution
  const combineMultiFileCode = useCallback(() => {
    if (!isMultiFile) {
      return code; // Return single file code if not multi-file mode
    }

    console.log('🔗 Combining multi-files for execution...');
    const combinedParts = [];

    // Get file order from questionData, default to alphabetical if not specified
    const languageFiles = questionData?.defaultCode?.[selectedLanguage] || {};
    const fileOrder = questionData?.defaultCode?.[selectedLanguage]?.order || Object.keys(languageFiles).filter(key => key !== 'order').sort();

    console.log('📋 File order from Firebase:', fileOrder);
    console.log('📋 Available language files:', Object.keys(languageFiles).filter(key => key !== 'order'));

    for (const fileName of fileOrder) {
      // Skip if fileName is 'order' (not a file)
      if (fileName === 'order') {
        console.log('⏭️ Skipping order field:', fileName);
        continue;
      }

      const fileData = multiFileData[fileName];
      if (fileData && fileData.code) {
        // Check if file is visible before including
        const isVisible = languageFiles[fileName]?.visible !== false;

        if (isVisible) {
          // Normalize line endings and remove \r characters
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
      totalFiles: fileOrder.length,
      visibleFiles: combinedParts.length,
      combinedLength: combinedCode.length,
      files: fileOrder,
      hasCarriageReturns: combinedCode.includes('\r')
    });

    return combinedCode;
  }, [isMultiFile, multiFileData, code, questionData, selectedLanguage]);

  // Active file management with notifications
  const activeFileManagement = useActiveFileManagement({
    clearPendingOperations: () => {
      // Clear any pending autosave when switching files
      if (saveTimeoutRef.current) {
        console.log('🧹 Clearing autosave timeout due to file change');
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    },
    questionId,
    selectedLanguage,
    isMultiFile
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

  // Save active file to localStorage when it changes
  useEffect(() => {
    if (activeFile && questionId && selectedLanguage) {
      const storageKey = `activeFile_${questionId}_${selectedLanguage}`;
      localStorage.setItem(storageKey, activeFile);
      console.log(`💾 Saved active file to localStorage: ${storageKey} = ${activeFile}`);
    }
  }, [activeFile, questionId, selectedLanguage]);

  // Initialize active file from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !activeFile) {
      const saved = localStorage.getItem(`activeFile_${questionId}_${selectedLanguage}`);
      if (saved) {
        console.log(`📂 Restoring active file from localStorage: ${saved}`);
        setActiveFileDirect(saved);
      }
    }
  }, [questionId, selectedLanguage, activeFile, setActiveFileDirect]);

  // Debug isMultiFile changes with red color and line numbers
  useEffect(() => {
    console.log(
      `%c🔴 ISMULTIFILE CHANGED (Line 72): ${isMultiFile}`,
      'background: #ffebee; color: #c62828; padding: 6px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #c62828;'
    );
  }, [isMultiFile]);


  const [isStateFinalized, setIsStateFinalized] = useState(false);

  // Prevent copy, cut, and paste
  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) return;

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
      setSubmissionTrigger(prev => prev + 1); // Trigger submission refresh
    } catch (error) {
      console.error("Error logging submission:", error);
    }
  };

  const handleSubmit2 = async () => {

    console.log(JSON.stringify(multiFileData))



    const testCases = questionData.testcases;

    // Get combined code for multi-file projects
    const sourceCode = combineMultiFileCode();
    console.log('🚀 Submitting code with:', {
      isMultiFile,
      sourceLength: sourceCode.length,
      language: selectedLanguage
    });

    // Set combined code for display
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
        setTestResults([...updatedResults]); // Still update one by one for visual feedback
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
      // Get combined code for multi-file projects
      const sourceCode = combineMultiFileCode();
      console.log('🚀 Executing code with:', {
        isMultiFile,
        sourceLength: sourceCode.length,
        language: selectedLanguage
      });

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

      // Handle first failure expansion
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

    // Prevent multiple loads until state is finalized
    if (!isStateFinalized) {
      console.log('⏳ Waiting for state finalization...');
      return;
    }

    console.log(
      `%c🔥 CODE LOADING STARTED (State Finalized)`,
      'background: #d4edda; color: #155724; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace;'
    );

    try {
      const dbRef = ref(database);
      const codeKey = `savedCode/${user.uid}/${course}/${questionId}/${selectedLanguage}`;

      console.log('LoadCode called:', {
        isMultiFile,
        activeFile,
        selectedLanguage,
        codeKey,
        availableFiles: availableFiles.length,
      });

      console.error("meow");

      // Check editable status and log changes
      const currentEditable = isMultiFile && activeFile && questionData?.defaultCode[selectedLanguage][activeFile]?.editable;
      console.log(
        `%c🔵 EDITABLE STATUS IN LOADCODE (Line 452): ${currentEditable}`,
        'background: #e3f2fd; color: #1565c0; padding: 6px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #1565c0;'
      );
      console.log('🔵 Editable details in loadCode:', {
        activeFile,
        selectedLanguage,
        isEditable: currentEditable,
        fileData: questionData?.defaultCode[selectedLanguage][activeFile]
      });

      console.log(
        `%c🔴 ISMULTIFILE IN LOADCODE (Line 447): ${isMultiFile}`,
        'background: #ffebee; color: #c62828; padding: 6px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #c62828;'
      );

      // IMPORTANT: Check if this should be multi-file mode first
      const defaultCodeStructure = questionData?.defaultCode?.[selectedLanguage];
      console.log('🔍 DEBUGGING MULTI-FILE STRUCTURE:', {
        questionData: !!questionData,
        selectedLanguage,
        defaultCodeStructure,
        structureType: typeof defaultCodeStructure,
        structureKeys: defaultCodeStructure ? Object.keys(defaultCodeStructure) : 'none',
        keyCount: defaultCodeStructure ? Object.keys(defaultCodeStructure).length : 0,
        isObject: typeof defaultCodeStructure === 'object' && !Array.isArray(defaultCodeStructure)
      });

      const shouldBeMultiFile = defaultCodeStructure &&
        typeof defaultCodeStructure === 'object' &&
        !Array.isArray(defaultCodeStructure) &&
        Object.keys(defaultCodeStructure).length > 1;

      console.log('Multi-file mode check:', {
        shouldBeMultiFile,
        currentIsMultiFile: isMultiFile,
        hasDefaultCode: !!defaultCodeStructure,
        fileCount: defaultCodeStructure ? Object.keys(defaultCodeStructure).length : 0,
        structureDetails: defaultCodeStructure
      });

      if (shouldBeMultiFile) {

        if (activeFile === null || activeFile === undefined || activeFile === "") {
          setActiveFileDirect(availableFiles[0]);
        }




        console.log('🔥 USING MULTI-FILE MODE');
        // If it's a non-editable file, NEVER load from Firebase saved progress, use default template!
        if (!questionData?.defaultCode[selectedLanguage][activeFile]?.editable) {
          let rawCode = questionData?.defaultCode[selectedLanguage][activeFile]?.code || "";

          // Comprehensive string conversion and [object Object] detection
          if (typeof rawCode !== 'string') {
            console.warn('Non-editable code is not a string:', typeof rawCode, rawCode);
            rawCode = String(rawCode || '');
          }

          // Additional safety check for [object Object]
          if (rawCode === '[object Object]' || rawCode.includes('object')) {
            console.error('Detected [object Object] in non-editable code, using empty string');
            rawCode = '';
          }

          setCode(rawCode);

          // 🟡 YELLOW CONSOLE LOG - Code State
          console.log(
            `%c🟡 CODE LOADED (Non-Editable: ${activeFile})\n${rawCode}`,
            'background: #fff3cd; color: #856404; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace;'
          );

          return;
        }

        // For editable multi-file questions, load saved code for the active file
        const fileCodeKey = `${codeKey}/${activeFile}`;
        const fileSnapshot = await get(child(dbRef, fileCodeKey));

        //check for autosave


        console.log('Multi-file load:', {
          fileCodeKey,
          hasSnapshot: fileSnapshot.exists(),
          defaultCode: questionData?.defaultCode[selectedLanguage][activeFile]?.code
        });

        if (fileSnapshot.exists()) {
          let rawCode = fileSnapshot.val();

          // Comprehensive string conversion and [object Object] detection
          if (typeof rawCode !== 'string') {
            console.warn('Saved code is not a string:', typeof rawCode, rawCode);
            rawCode = String(rawCode || '');
          }

          // Additional safety check for [object Object]
          if (rawCode === '[object Object]' || rawCode.includes('object')) {
            console.error('Detected [object Object] in saved code, using default');
            rawCode = questionData?.defaultCode[selectedLanguage][activeFile]?.code || '';
            rawCode = typeof rawCode === 'string' ? rawCode : String(rawCode || '');
          }

          setCode(rawCode);

          // 🟡 YELLOW CONSOLE LOG - Code State
          console.log(
            `%c🟡 CODE LOADED (Editable - Saved: ${activeFile})\n${rawCode}`,
            'background: #fff3cd; color: #856404; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace;'
          );

        } else {
          // Use default code for this file
          let rawCode = questionData?.defaultCode[selectedLanguage][activeFile]?.code || "";

          console.log('📄 Loading default code for editable file:', {
            activeFile,
            defaultCodeLength: rawCode?.length,
            defaultCodeType: typeof rawCode
          });

          // Comprehensive string conversion and [object Object] detection
          if (typeof rawCode !== 'string') {
            console.warn('Default code is not a string:', typeof rawCode, rawCode);
            rawCode = String(rawCode || '');
          }

          // Additional safety check for [object Object]
          if (rawCode === '[object Object]' || rawCode.includes('object')) {
            console.error('Detected [object Object] in default code, using empty string');
            rawCode = '';
          }

          setCode(rawCode);

          // 🟡 YELLOW CONSOLE LOG - Code State
          console.log(
            `%c🟡 CODE LOADED (Editable - Default: ${activeFile})\n${rawCode}`,
            'background: #fff3cd; color: #856404; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace;'
          );
        }
      } else {
        console.log('🔥 USING SINGLE-FILE MODE');

        // Single file mode 

        const snapshot = await get(child(dbRef, codeKey));
        if (snapshot.exists()) {
          let rawCode = snapshot.val();
          console.log('Single-file load:', rawCode);

          // Comprehensive string conversion and [object Object] detection
          if (typeof rawCode !== 'string') {
            console.warn('Single file saved code is not a string:', typeof rawCode, rawCode);
            rawCode = String(rawCode || '');
          }

          // Additional safety check for [object Object]
          if (rawCode === '[object Object]' || rawCode.includes('object')) {
            console.error('Detected [object Object] in single file code, using template');
            rawCode = languageTemplates[selectedLanguage] || '';
            rawCode = typeof rawCode === 'string' ? rawCode : String(rawCode || '');
          }

          setCode(rawCode);

          // 🟡 YELLOW CONSOLE LOG - Code State
          console.log(
            `%c🟡 CODE LOADED (Single File - Saved: ${selectedLanguage})\n${rawCode}`,
            'background: #fff3cd; color: #856404; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace;'
          );

        } else {
          // Use language template for single file mode
          let rawCode = languageTemplates[selectedLanguage] || "";

          console.log('📄 Loading language template:', {
            selectedLanguage,
            hasTemplate: !!languageTemplates[selectedLanguage],
            templateLength: rawCode?.length,
            templateType: typeof rawCode,
            availableTemplates: Object.keys(languageTemplates)
          });

          // Comprehensive string conversion and [object Object] detection
          if (typeof rawCode !== 'string') {
            console.warn('Template is not a string:', typeof rawCode, rawCode);
            rawCode = String(rawCode || '');
          }

          // Additional safety check for [object Object]
          if (rawCode === '[object Object]' || rawCode.includes('object')) {
            console.error('Detected [object Object] in template, using empty string');
            rawCode = '';
          }

          setCode(rawCode);

          // 🟡 YELLOW CONSOLE LOG - Code State
          console.log(
            `%c🟡 CODE LOADED (Single File - Template: ${selectedLanguage})\n${rawCode}`,
            'background: #fff3cd; color: #856404; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace;'
          );
        }
      }
    } catch (error) {
      console.error("Error loading code:", error);
      const template = languageTemplates[selectedLanguage] || "";
      setCode(typeof template === 'string' ? template : String(template || ''));
    }
  }, [course, questionId, selectedLanguage, questionData, isMultiFile, activeFile, user?.uid]);

  const saveCode = useCallback(async (codeToSave) => {

    //


    if (!user?.uid) return;

    if (isMultiFile === null) return;

    try {
      console.log('🔥 AUTOSAVE STARTED:', {
        isMultiFile,
        activeFile,
        isEditable: isMultiFile && activeFile && questionData?.defaultCode[selectedLanguage][activeFile]?.editable,
        codeLength: codeToSave?.length,
        timestamp: new Date().toISOString()
      });

      // Check editable status and log changes
      const currentEditable = isMultiFile && activeFile && questionData?.defaultCode[selectedLanguage][activeFile]?.editable;
      console.log(
        `%c🔵 EDITABLE STATUS IN SAVECODE (Line 649): ${currentEditable}`,
        'background: #e3f2fd; color: #1565c0; padding: 6px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #1565c0;'
      );
      console.log('🔵 Editable details in saveCode:', {
        activeFile,
        selectedLanguage,
        isEditable: currentEditable,
        fileData: questionData?.defaultCode[selectedLanguage][activeFile]
      });

      console.log(
        `%c🔴 ISMULTIFILE IN SAVECODE (Line 642): ${isMultiFile}`,
        'background: #ffebee; color: #c62828; padding: 6px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #c62828;'
      );

      if (isMultiFile && activeFile && questionData?.defaultCode[selectedLanguage][activeFile]?.editable === true) {
        // Save code for specific file in multi-file mode
        const codeKey = `savedCode/${user.uid}/${course}/${questionId}/${selectedLanguage}/${activeFile}`;
        const dbRef = ref(database, codeKey);
        console.log('💾 Saving multi-file code to:', codeKey);

        // 🟡 UPLOADING TO FIREBASE
        console.log(
          `%c🟡 UPLOADING TO FIREBASE\nFile: ${activeFile}\nLanguage: ${selectedLanguage}\nPath: ${codeKey}\nCode Length: ${codeToSave?.length}\nTimestamp: ${new Date().toISOString()}`,
          'background: #fff3cd; color: #856404; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #856404;'
        );

        await set(dbRef, codeToSave);

        // 🟢 UPLOAD COMPLETED
        console.log(
          `%c🟢 UPLOAD COMPLETED\nFile: ${activeFile}\nLanguage: ${selectedLanguage}\nPath: ${codeKey}\nTimestamp: ${new Date().toISOString()}`,
          'background: #d4edda; color: #155724; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #155724;'
        );
        console.log(`✅ Code auto-saved for ${activeFile} successfully!`);

        // 🟢 CODE SAVED TO FIREBASE
        console.log(
          `%c🟢 CODE SAVED TO FIREBASE\nFile: ${activeFile}\nLanguage: ${selectedLanguage}\nPath: ${codeKey}\nTimestamp: ${new Date().toISOString()}`,
          'background: #d4edda; color: #155724; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #155724;'
        );
      } else if (!isMultiFile) {
        // Single file mode
        const codeKey = `savedCode/${user.uid}/${course}/${questionId}/${selectedLanguage}`;
        const dbRef = ref(database, codeKey);
        console.log('💾 Saving single-file code to:', codeKey);

        // 🟡 UPLOADING TO FIREBASE
        console.log(
          `%c🟡 UPLOADING TO FIREBASE\nLanguage: ${selectedLanguage}\nPath: ${codeKey}\nCode Length: ${codeToSave?.length}\nTimestamp: ${new Date().toISOString()}`,
          'background: #fff3cd; color: #856404; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #856404;'
        );

        await set(dbRef, codeToSave);

        // 🟢 UPLOAD COMPLETED
        console.log(
          `%c🟢 UPLOAD COMPLETED\nLanguage: ${selectedLanguage}\nPath: ${codeKey}\nTimestamp: ${new Date().toISOString()}`,
          'background: #d4edda; color: #155724; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #155724;'
        );
        console.log("✅ Code auto-saved successfully!");

        // 🟢 CODE SAVED TO FIREBASE
        console.log(
          `%c🟢 CODE SAVED TO FIREBASE\nLanguage: ${selectedLanguage}\nPath: ${codeKey}\nTimestamp: ${new Date().toISOString()}`,
          'background: #d4edda; color: #155724; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #155724;'
        );
      } else {
        console.log('❌ Not saving - file is not editable or no active file');
      }
      // Don't save if it's a non-editable file in multi-file mode
    } catch (error) {
      console.error("❌ Error saving code:", error);
    }
  }, [course, questionId, selectedLanguage, isMultiFile, activeFile, questionData, user?.uid]);

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
    if (!questionData) {
      console.log('Waiting for questionData...');
      return;
    }
    if (!isMultiFile) {
      console.log('Waiting for isMultiFile...');
      return;
    }

    if (!activeFile) {
      console.log('Waiting for activeFile...');
      return;
    }

    // Additional check: ensure activeFile is still valid and exists in questionData
    if (isMultiFile && (!questionData?.defaultCode?.[selectedLanguage]?.[activeFile])) {
      console.log('🚫 Stale activeFile detected - ignoring change:', {
        activeFile,
        selectedLanguage,
        availableFiles: Object.keys(questionData?.defaultCode?.[selectedLanguage] || {}),
        note: 'activeFile no longer exists in questionData'
      });
      return;
    }

    // Get current file data directly from questionData to avoid stale state
    const currentFileData = questionData?.defaultCode?.[selectedLanguage]?.[activeFile];
    const currentEditable = currentFileData?.editable;

    // Check if this change is for the current active file
    // If not, this is a stale change from a previous file, ignore it
    if (!currentFileData) {
      console.log('🚫 Stale code change detected - ignoring:', {
        activeFile,
        selectedLanguage,
        note: 'File data not found for current active file'
      });
      return;
    }

    if (!currentEditable === true) {
      console.log('Waiting for editable file...', { activeFile, currentFileData, currentEditable });
      return;
    }

    console.log('🔍 Current file data:', {
      activeFile,
      selectedLanguage,
      currentFileData,
      currentEditable
    });

    // Check editable status and log changes
    console.log(
      `%c🔵 EDITABLE STATUS CHANGED (Line 745): ${currentEditable}`,
      'background: #e3f2fd; color: #1565c0; padding: 6px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #1565c0;'
    );
    console.log('🔵 Editable details:', {
      activeFile,
      selectedLanguage,
      isEditable: currentEditable,
      fileData: currentFileData
    });

    console.log('📝 CODE CHANGE DETECTED:', {
      isMultiFile,
      activeFile,
      isEditable: currentEditable,
      codeLength: newValue?.length,
      timestamp: new Date().toISOString()
    });

    console.log(
      `%c🔴 ISMULTIFILE IN HANDLECODECHANGE (Line 718): ${isMultiFile}`,
      'background: #ffebee; color: #c62828; padding: 6px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #c62828;'
    );
    console.log(
      `%cquestionData: ${questionData}`,
      'background: #ffebee; color: #c62828; padding: 6px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #c62828;'
    );

    // Only allow changes for editable files
    if (isMultiFile && activeFile && !currentEditable) {
      console.log('🚫 Code change blocked - file is not editable:', {
        activeFile,
        currentEditable,
        note: 'Ignoring changes for non-editable files'
      });
      return;
    }

    setCode(newValue);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    console.log('⏰ Autosave scheduled in 500ms...');

    // Double-check before scheduling autosave
    if (isMultiFile && activeFile && !currentEditable) {
      console.log('🚫 Autosave blocked - file is not editable:', {
        activeFile,
        currentEditable,
        note: 'Not scheduling autosave for non-editable files'
      });
      return;
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveCode(newValue);
    }, 500);
  }, [saveCode, isMultiFile, activeFile, questionData]);

  const handleLanguageChange = useCallback((e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
  }, []);



  // Load code when component mounts or language changes
  useEffect(() => {

    if (selectedLanguage === "") {
      return;
    }


    // ABSOLUTELY NO CODE LOADING until state is finalized
    if (!isStateFinalized) {
      console.log('⏳ Waiting for state finalization...');
      return;
    }

    // Only load code when all conditions are met:
    // 1. questionData exists
    // 2. If multi-file: activeFile and nonEditableCode are ready
    // 3. If single-file: proceed normally
    if (!questionData) {
      console.log('Waiting for questionData...');
      return;
    }

    if (isMultiFile) {
      if (!activeFile || !questionData?.defaultCode[selectedLanguage][activeFile]) {
        console.log('Waiting for multi-file initialization...');
        return;
      }
    }

    console.log('✅ ALL CONDITIONS MET - Loading code...');
    loadCode();
  }, [loadCode, questionData, selectedLanguage, isMultiFile, activeFile, questionData?.defaultCode, isStateFinalized]);

  // Handle code loading after active file change
  useEffect(() => {
    // Only load code when all conditions are met:
    // 1. isMultiFile is true
    // 2. activeFile exists
    // 3. nonEditableCode[activeFile] exists
    // 4. questionData exists
    if (!isMultiFile || !activeFile || !questionData?.defaultCode?.[selectedLanguage]?.[activeFile] || !questionData) {
      console.log('Waiting for active file change conditions...', {
        isMultiFile,
        activeFile,
        hasFileData: !!questionData?.defaultCode?.[selectedLanguage]?.[activeFile],
        hasQuestionData: !!questionData
      });
      return;
    }

    console.log('✅ ACTIVE FILE CHANGE CONDITIONS MET - Loading code...');
    loadCode();
  }, [activeFile, isMultiFile, questionData?.defaultCode, isStateFinalized]);

  // Handle multi-file structure when language changes
  useEffect(() => {

    if (!questionData) {
      console.log('Waiting for questionData...');
      return;
    }


    console.log('🔍 DETAILED STRUCTURE ANALYSIS:', {
      selectedLanguage,
      hasQuestionData: !!questionData,
      questionDataKeys: questionData ? Object.keys(questionData) : 'none',
      hasDefaultCode: !!questionData?.defaultCode,
      defaultCodeKeys: questionData?.defaultCode ? Object.keys(questionData?.defaultCode) : 'none',
      hasLanguageCode: !!questionData?.defaultCode?.[selectedLanguage],
      languageCodeStructure: questionData?.defaultCode?.[selectedLanguage],
      languageCodeType: typeof questionData?.defaultCode?.[selectedLanguage],
      isObject: typeof questionData?.defaultCode?.[selectedLanguage] === 'object' && !Array.isArray(questionData?.defaultCode?.[selectedLanguage]),
      isArray: Array.isArray(questionData?.defaultCode?.[selectedLanguage]),
      isString: typeof questionData?.defaultCode?.[selectedLanguage] === 'string'
    });



    if (!questionData?.defaultCode?.[selectedLanguage]) {
      console.log('❌ NO LANGUAGE CODE FOUND - This is the problem!');
      console.log('selectedLanguage:', selectedLanguage);
      console.log('questionData:', questionData);


      setIsMultiFile(false);
      setAvailableFiles([]);
      setActiveFileDirect(null);

      // Mark initialization as complete when no structure found
      console.log('✅ NO STRUCTURE INITIALIZATION COMPLETE');
      setIsStateFinalized(true);

      // 🟢 FINAL STATE PRINT
      console.log(
        `%c🟢 FINAL STATE COMPLETE\nNo Structure Found\nLanguage: ${selectedLanguage}`,
        'background: #d1ecf1; color: #0c5460; padding: 10px; border-radius: 6px; font-weight: bold; font-family: monospace; border: 2px solid #0c5460;'
      );
      return;
    }

    const langFiles = questionData?.defaultCode[selectedLanguage];
    const fileNames = Object.keys(langFiles);
    const isMultiFileStructure = fileNames.length > 1;

    console.log('🔍 FILE ANALYSIS:', {
      langFiles,
      fileNames,
      fileCount: fileNames.length,
      isMultiFileStructure,
      fileContents: fileNames.map(name => ({ name, content: langFiles[name], type: typeof langFiles[name] }))
    });

    if (isMultiFileStructure) {
      const nonEditable = {};

      // Process all files in the language with new structure
      fileNames.forEach(fileName => {
        const fileData = langFiles[fileName];
        // New structure: { code: "...", editable: true/false }
        const fileCode = fileData?.code || fileData || ""; // Handle both old and new format
        const isEditable = fileData?.editable !== undefined ? fileData.editable :
          (fileName.toLowerCase() === 'drivecode' || fileName.toLowerCase().includes('drive'));

        // Ensure fileCode is always stored as a string
        const stringCode = typeof fileCode === 'string' ? fileCode : String(fileCode || '');

        nonEditable[fileName] = {
          code: stringCode,
          editable: isEditable
        };

        console.log(`📄 Processed ${fileName}:`, {
          fileData,
          originalType: typeof fileCode,
          isEditable,
          codeLength: stringCode.length,
          isNewFormat: fileData?.editable !== undefined
        });
      });

      console.log('📁 Processed files:', { fileNames, nonEditable });

      setAvailableFiles(fileNames);

      // Try to restore saved active file, otherwise default to first editable file
      const savedActiveFile = localStorage.getItem(`activeFile_${questionId}_${selectedLanguage}`);
      const validSavedFile = savedActiveFile && fileNames.includes(savedActiveFile) ? savedActiveFile : null;
      const defaultActiveFile = fileNames.find(f => nonEditable[f]?.editable) || fileNames[0];

      const newActiveFile = validSavedFile || defaultActiveFile;
      console.log('🎯 Setting active file:', { saved: savedActiveFile, valid: validSavedFile, default: defaultActiveFile, final: newActiveFile });

      setActiveFileDirect(newActiveFile);
      setIsMultiFile(true);  // CRITICAL: Set this BEFORE marking as initialized

      console.log(
        `%c🔴 ISMULTIFILE SET TO TRUE (Line 898): true`,
        'background: #ffebee; color: #c62828; padding: 6px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #c62828;'
      );

      // Mark initialization as complete for multi-file
      console.log('✅ MULTI-FILE INITIALIZATION COMPLETE');
      setIsStateFinalized(true);

      // 🟢 FINAL STATE PRINT
      console.log(
        `%c🟢 FINAL STATE COMPLETE\nMulti-File: true\nActive File: ${newActiveFile}\nFiles: ${fileNames.join(', ')}`,
        'background: #d1ecf1; color: #0c5460; padding: 10px; border-radius: 6px; font-weight: bold; font-family: monospace; border: 2px solid #0c5460;'
      );
    } else {
      // Single file mode
      console.log('Single file mode detected');
      setIsMultiFile(false);

      console.log(
        `%c🔴 ISMULTIFILE SET TO FALSE (Line 925): false`,
        'background: #ffebee; color: #c62828; padding: 6px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #c62828;'
      );
      setAvailableFiles([]);
      setActiveFileDirect(null);

      // Mark initialization as complete for single file
      console.log('✅ SINGLE-FILE INITIALIZATION COMPLETE');
      setIsStateFinalized(true);

      // 🟢 FINAL STATE PRINT
      console.log(
        `%c🟢 FINAL STATE COMPLETE\nSingle-File Mode\nLanguage: ${selectedLanguage}`,
        'background: #d1ecf1; color: #0c5460; padding: 10px; border-radius: 6px; font-weight: bold; font-family: monospace; border: 2px solid #0c5460;'
      );
    }
  }, [selectedLanguage, questionData]);

  // Load all multi-file data when multi-file mode is initialized
  useEffect(() => {
    if (isMultiFile && isStateFinalized) {
      loadAllMultiFileData();
    } else if (!isMultiFile) {
      // Clear multiFileData when switching to single-file mode
      setMultiFileData({});
    }
  }, [isMultiFile, isStateFinalized, loadAllMultiFileData]);

  // Update multiFileData when active file code changes
  useEffect(() => {
    if (isMultiFile && activeFile && code !== undefined) {
      // Normalize line endings and remove \r characters
      const normalizedCode = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      setMultiFileData(prev => ({
        ...prev,
        [activeFile]: {
          ...prev[activeFile],
          code: normalizedCode
        }
      }));
      console.log(`📝 Updated multiFileData for ${activeFile}`);
    }
  }, [code, activeFile, isMultiFile]);

  const resetCode = () => {
    if (isMultiFile && activeFile) {
      // Reset to default code for the active file
      const rawCode = questionData?.defaultCode[selectedLanguage][activeFile]?.code || "";
      const defaultCode = typeof rawCode === 'string' ? rawCode : String(rawCode || '');
      setCode(defaultCode);
      console.log(`Reset ${activeFile} to default:`, defaultCode);

      // Save the reset code
      saveCode(defaultCode);
    } else {
      // Single file reset
      const rawCode = languageTemplates[selectedLanguage] || '';
      const template = typeof rawCode === 'string' ? rawCode : String(rawCode || '');
      setCode(template);
      console.log(`Reset to template for ${selectedLanguage}:`, template);

      // Save the reset code
      saveCode(template);
    }

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
    getAllowedLanguageTemplates();

    // Fetch completion status
    const fetchCompletionStatus = async () => {
      if (user?.uid) {
        const progressRef = ref(
          database,
          `userprogress/${user.uid}/${course}/${subcourse}/${questionId}`
        );
        const progressSnapshot = await get(progressRef);
        setIsCompleted(progressSnapshot.exists() && progressSnapshot.val() === true);
      }
    };
    fetchCompletionStatus();
  }, [questionId, user]);

  // Whenever the question changes, default back to description tab
  useEffect(() => {
    setActiveTab('description');
  }, [questionId]);



  // Fixed Monaco Editor layout handling
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Create ResizeObserver before using it
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

    // Register resize observer for layout updates
    const container = editor.getContainerDomNode()?.parentElement?.parentElement;
    if (container && resizeObserverRef.current) {
      resizeObserverRef.current.observe(container);
    }

    registerIntelliSense(editor, monaco);

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
          {isMultiFile && (
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'combined' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'}`}
              onClick={() => setActiveTab('combined')}
            >
              <div className="flex items-center gap-2">
                <Icons.Code2 />
                Combined Code
              </div>
            </button>
          )}
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
                    {questionData?.Example[0]}
                  </pre>
                </div>

                {questionData?.Example[1] && (
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Example 2:</h2>
                    <pre className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
                      {questionData?.Example[1]}
                    </pre>
                  </div>
                )}




                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Constraints:</h2>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-400">
                    <li>{questionData?.constraints[0]}</li>
                    <li>{questionData?.constraints[1]}</li>
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
                Tests are run against the current code version in the editor.
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

          {activeTab === 'combined' && (
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Combined Code
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This is the combined code from all visible files in the correct order, ready for execution.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <pre className="p-4 text-sm text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap overflow-x-auto">
                  {combineMultiFileCode() || 'No combined code available. Make sure you are in multi-file mode.'}
                </pre>
              </div>
            </div>
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
        <div className="bg-white dark:bg-dark-secondary border-t border-gray-200 dark:border-dark-tertiary p-2 flex justify-between items-center gap-6">
          <div className="flex items-center gap-4">


            {/* File navigation tabs for multi-file questions */}
            {isMultiFile && availableFiles.length > 0 && (
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-tertiary rounded-lg p-1">
                {console.log('Rendering file tabs:', { availableFiles, activeFile, questionData })}
                {availableFiles.map((fileName) => {
                  const fileData = questionData?.defaultCode[selectedLanguage][fileName];
                  const isActive = activeFile === fileName;
                  const isEditable = fileData?.editable;

                  console.log('Rendering tab:', { fileName, isActive, isEditable, fileData });

                  return (
                    <button

                      key={fileName}
                      onClick={() => {
                        console.log('Tab clicked:', fileName);
                        // Inform about active file change before setting it
                        if (activeFile && activeFile !== fileName) {
                          console.log(`📢 Preparing to switch active file from "${activeFile}" to "${fileName}"`);
                        }
                        setActiveFileWithTracking(fileName);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${isActive
                        ? 'bg-white dark:bg-dark-secondary text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        } ${!isEditable ? 'opacity-75' : ''}`}
                      title={isEditable ? 'Click to edit this file' : 'Read-only file'}
                    >
                      <Icons.FileText size={12} />
                      <span className="truncate max-w-24">{fileName}</span>
                      {!isEditable && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500" title="Read-only">🔒</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

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

            {/* Navigation Buttons */}
            {navigation?.showNavigation && (
              <>
                {/* <button
                  onClick={navigation.onPrevious}
                  // disabled={navigation.currentQuestionIndex === 0}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md font-medium text-[11px] transition-all duration-200 ${navigation.currentQuestionIndex === 0 || false
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                    }`}
                >
                  <navigation.NavigationIcons.ChevronLeft />
                  Previous
                </button> */}
                {/* 
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
                </button> */}
              </>
            )}
          </div>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-900 min-w-0 overflow-auto">
          <Editor
            height="100%"
            path={isMultiFile ? activeFile : 'single-file'}
            defaultLanguage='text'
            language={selectedLanguage}
            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
            value={typeof code === 'string' ? code : String(code || '')}
            onChange={(newValue) => {
              // Only handle changes if we have valid data and the file is editable
              if (!isMultiFile || !activeFile || !questionData?.defaultCode?.[selectedLanguage]?.[activeFile]) {
                console.log('🚫 Editor change ignored - missing data:', {
                  isMultiFile,
                  activeFile,
                  hasQuestionData: !!questionData,
                  hasLanguageData: !!questionData?.defaultCode?.[selectedLanguage],
                  hasFileData: !!questionData?.defaultCode?.[selectedLanguage]?.[activeFile]
                });
                return;
              }

              const isEditable = questionData?.defaultCode?.[selectedLanguage]?.[activeFile]?.editable;
              if (!isEditable) {
                console.log('🚫 Editor change ignored - file not editable:', {
                  activeFile,
                  isEditable
                });
                return;
              }

              // If we pass all checks, handle the change
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
              readOnly: Boolean(isMultiFile && activeFile && !questionData?.defaultCode?.[selectedLanguage]?.[activeFile]?.editable),
            }}
          />
        </div>
      </div>



      <ToastContainer />
    </div>
  );
};

export default CodePage;











