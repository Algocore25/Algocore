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

import CompletionAnimation from '../components/CompletionAnimation';
import { useAuth } from '../context/AuthContext';

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { setItemWithExpiry, getItemWithExpiry } from "../utils/storageWithExpiry";
import { decodeShort } from '../utils/urlEncoder';

function CodePageMultifile({ data, navigation, questionData: propQuestionData, selectedLanguage: propSelectedLanguage }) {
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

  const inputRef = useRef(null);
  const outputRef = useRef(null);

  const { course: encCourse, subcourse: encSubcourse, questionId: encQuestionId } = useParams();
  const course = decodeShort(encCourse);
  const subcourse = decodeShort(encSubcourse);
  const questionId = decodeShort(encQuestionId);
  const { user } = useAuth();
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
        const fileCodeKey = `savedCode/${user.uid}/${course}/${questionId}/${selectedLanguage}/${fileName}`;
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
  }, [user?.uid, questionData, selectedLanguage, course, questionId]);

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
      files: fileNames,
      hasCarriageReturns: combinedCode.includes('\r')
    });

    return combinedCode;
  }, [multiFileData, questionData, selectedLanguage]);

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
      time: 0,
      memory: 0,
      timeout: false,
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
          output: result?.error || result.output,
          passed,
          status: 'done',
          time: result.cpuTime || 0,
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
          input,
          expected: expectedOutput,
          output: error.message || 'Error executing code',
          passed: false,
          status: 'done',
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

    const allPassed = updatedResults.every(tc => tc.passed);
    if (allPassed) {
      setShowCompletion(true);
    }
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
        isFirstFailure: false,
        time: 0,
        memory: 0,
        timeout: false,
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

  const copySubmissionToEditor = (submission) => {
    if (!submission) return;

    // For multifile submissions, we need to extract and load the code back
    try {
      const submissionCode = submission.code;

      // If submission contains multifile data, parse and load it
      if (submissionCode.includes('FILE:') || submissionCode.includes('---')) {
        // Parse the combined code back to multiFileData format
        const lines = submissionCode.split('\n');
        const newMultiFileData = { ...multiFileData };
        let currentFile = null;
        let currentCode = '';

        lines.forEach(line => {
          if (line.startsWith('FILE:')) {
            if (currentFile) {
              newMultiFileData[currentFile] = currentCode.trim();
            }
            currentFile = line.replace('FILE:', '').trim();
            currentCode = '';
          } else {
            currentCode += line + '\n';
          }
        });

        if (currentFile) {
          newMultiFileData[currentFile] = currentCode.trim();
        }

        setMultiFileData(newMultiFileData);
        setEditorKey(prev => prev + 1);
      } else {
        // Fallback: set the code as-is for the active file
        const newMultiFileData = { ...multiFileData };
        newMultiFileData[activeFile] = submissionCode;
        setMultiFileData(newMultiFileData);
        setEditorKey(prev => prev + 1);
      }

      setSelectedLanguage(submission.language);
      setShowSubmissionModal(false);
      setActiveTab('description');
    } catch (error) {
      console.error('Error copying submission to editor:', error);
    }
  };

  const loadCode = useCallback(async () => {
    if (!user?.uid) return;

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
      const fileCodeKey = `savedCode/${user.uid}/${course}/${questionId}/${selectedLanguage}/${activeFile}`;

      console.log('Multi-file load:', {
        fileCodeKey,
        hasSnapshot: false,
        defaultCode: questionData?.defaultCode[selectedLanguage][activeFile]?.code
      });

      if (!questionData?.defaultCode[selectedLanguage][activeFile]?.editable) {
        let rawCode = questionData?.defaultCode[selectedLanguage][activeFile]?.code || "";

        if (typeof rawCode !== 'string') {
          console.warn('Non-editable code is not a string:', typeof rawCode, rawCode);
          rawCode = String(rawCode || '');
        }

        if (rawCode === '[object Object]' || rawCode.includes('object')) {
          console.error('Detected [object Object] in non-editable code, using empty string');
          rawCode = '';
        }

        setCode(rawCode);

        console.log(
          `%c🟡 CODE LOADED (Non-Editable: ${activeFile})\n${rawCode}`,
          'background: #fff3cd; color: #856404; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace;'
        );

        return;
      }

      const fileSnapshot = await get(child(dbRef, fileCodeKey));

      if (fileSnapshot.exists()) {
        let rawCode = fileSnapshot.val();

        if (typeof rawCode !== 'string') {
          console.warn('Saved code is not a string:', typeof rawCode, rawCode);
          rawCode = String(rawCode || '');
        }

        if (rawCode === '[object Object]' || rawCode.includes('object')) {
          console.error('Detected [object Object] in saved code, using default');
          rawCode = questionData?.defaultCode[selectedLanguage][activeFile]?.code || '';
          rawCode = typeof rawCode === 'string' ? rawCode : String(rawCode || '');
        }

        setCode(rawCode);

        console.log(
          `%c🟡 CODE LOADED (Editable - Saved: ${activeFile})\n${rawCode}`,
          'background: #fff3cd; color: #856404; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace;'
        );

      } else {
        let rawCode = questionData?.defaultCode[selectedLanguage][activeFile]?.code || "";

        console.log('📄 Loading default code for editable file:', {
          activeFile,
          defaultCodeLength: rawCode?.length,
          defaultCodeType: typeof rawCode
        });

        if (typeof rawCode !== 'string') {
          console.warn('Default code is not a string:', typeof rawCode, rawCode);
          rawCode = String(rawCode || '');
        }

        if (rawCode === '[object Object]' || rawCode.includes('object')) {
          console.error('Detected [object Object] in default code, using empty string');
          rawCode = '';
        }

        setCode(rawCode);

        console.log(
          `%c🟡 CODE LOADED (Editable - Default: ${activeFile})\n${rawCode}`,
          'background: #fff3cd; color: #856404; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace;'
        );
      }
    } catch (error) {
      console.error("Error loading code:", error);
      const template = languageTemplates[selectedLanguage] || "";
      setCode(typeof template === 'string' ? template : String(template || ''));
    }
  }, [course, questionId, selectedLanguage, questionData, activeFile, user?.uid, isStateFinalized]);

  const saveCode = useCallback(async (codeToSave) => {
    if (!user?.uid) return;

    try {
      console.log('🔥 AUTOSAVE STARTED:', {
        activeFile,
        isEditable: activeFile && questionData?.defaultCode[selectedLanguage][activeFile]?.editable,
        codeLength: codeToSave?.length,
        timestamp: new Date().toISOString()
      });

      if (activeFile && questionData?.defaultCode[selectedLanguage][activeFile]?.editable === true) {
        const codeKey = `savedCode/${user.uid}/${course}/${questionId}/${selectedLanguage}/${activeFile}`;
        const dbRef = ref(database, codeKey);
        console.log('💾 Saving multi-file code to:', codeKey);

        console.log(
          `%c🟡 UPLOADING TO FIREBASE\nFile: ${activeFile}\nLanguage: ${selectedLanguage}\nPath: ${codeKey}\nCode Length: ${codeToSave?.length}\nTimestamp: ${new Date().toISOString()}`,
          'background: #fff3cd; color: #856404; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #856404;'
        );

        await set(dbRef, codeToSave);

        console.log(
          `%c🟢 UPLOAD COMPLETED\nFile: ${activeFile}\nLanguage: ${selectedLanguage}\nPath: ${codeKey}\nTimestamp: ${new Date().toISOString()}`,
          'background: #d4edda; color: #155724; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #155724;'
        );
        console.log(`✅ Code auto-saved for ${activeFile} successfully!`);

        console.log(
          `%c🟢 CODE SAVED TO FIREBASE\nFile: ${activeFile}\nLanguage: ${selectedLanguage}\nPath: ${codeKey}\nTimestamp: ${new Date().toISOString()}`,
          'background: #d4edda; color: #155724; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #155724;'
        );
      } else {
        console.log('❌ Not saving - file is not editable or no active file');
      }
    } catch (error) {
      console.error("❌ Error saving code:", error);
    }
  }, [course, questionId, selectedLanguage, activeFile, questionData, user?.uid]);

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
      console.log('🚫 Stale activeFile detected - ignoring change:', {
        activeFile,
        selectedLanguage,
        availableFiles: Object.keys(questionData?.defaultCode?.[selectedLanguage] || {}),
        note: 'activeFile no longer exists in questionData'
      });
      return;
    }

    const currentFileData = questionData?.defaultCode?.[selectedLanguage]?.[activeFile];
    const currentEditable = currentFileData?.editable;

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

    console.log('📝 CODE CHANGE DETECTED:', {
      activeFile,
      isEditable: currentEditable,
      codeLength: newValue?.length,
      timestamp: new Date().toISOString()
    });

    if (!currentEditable) {
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

    if (!currentEditable) {
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
        if (l === 'c/c++' || l === 'c++') return 'cpp';
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
      console.log('Waiting for active file change conditions...', {
        activeFile,
        hasFileData: !!questionData?.defaultCode?.[selectedLanguage]?.[activeFile],
        hasQuestionData: !!questionData
      });
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

      setAvailableFiles([]);
      setActiveFileDirect(null);

      console.log('✅ NO STRUCTURE INITIALIZATION COMPLETE');
      setIsStateFinalized(true);

      console.log(
        `%c🟢 FINAL STATE COMPLETE\nNo Structure Found\nLanguage: ${selectedLanguage}`,
        'background: #d1ecf1; color: #0c5460; padding: 10px; border-radius: 6px; font-weight: bold; font-family: monospace; border: 2px solid #0c5460;'
      );
      return;
    }

    const langFiles = questionData?.defaultCode[selectedLanguage];
    const fileNames = Object.keys(langFiles).filter(key => key !== 'order');
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

      const savedActiveFile = localStorage.getItem(`activeFile_${questionId}_${selectedLanguage}`);
      const validSavedFile = savedActiveFile && fileNames.includes(savedActiveFile) ? savedActiveFile : null;
      const defaultActiveFile = fileNames.find(f => nonEditable[f]?.editable) || fileNames[0];

      const newActiveFile = validSavedFile || defaultActiveFile;
      console.log('🎯 Setting active file:', { saved: savedActiveFile, valid: validSavedFile, default: defaultActiveFile, final: newActiveFile });

      setActiveFileDirect(newActiveFile);

      console.log('✅ MULTI-FILE INITIALIZATION COMPLETE');
      setIsStateFinalized(true);

      console.log(
        `%c🟢 FINAL STATE COMPLETE\nMulti-File: true\nActive File: ${newActiveFile}\nFiles: ${fileNames.join(', ')}`,
        'background: #d1ecf1; color: #0c5460; padding: 10px; border-radius: 6px; font-weight: bold; font-family: monospace; border: 2px solid #0c5460;'
      );
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
      console.log(`📝 Updated multiFileData for ${activeFile}`);
    }
  }, [code, activeFile]);

  useEffect(() => {
    setActiveTab('description');
  }, [questionId]);

  useEffect(() => {
    if (propQuestionData !== questionData) {
      console.log('🔄 Question data changed, updating state');
      setQuestionData(propQuestionData);

      // Reset active file when question changes
      if (propQuestionData?.defaultCode?.[selectedLanguage]) {
        const files = Object.keys(propQuestionData.defaultCode[selectedLanguage]);
        const newActiveFile = files.find(f => propQuestionData.defaultCode[selectedLanguage][f]?.editable) || files[0];
        setActiveFileDirect(newActiveFile);
        console.log('🔄 Reset active file to:', newActiveFile);
      }
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
        { input: questionData?.testcases[0]?.input, expectedOutput: questionData?.testcases[0]?.expectedOutput },
        ...(questionData?.testcases[1]?.expectedOutput
          ? [{ input: questionData?.testcases[1]?.input, expectedOutput: questionData?.testcases[1]?.expectedOutput }]
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
  }, [selectedLanguage, activeFile, questionData]);

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
            <button
              className={`px-4 py-3 text-sm font-medium ${activeTab === 'combined' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'}`}
              onClick={() => setActiveTab('combined')}
            >
              <div className="flex items-center gap-2">
                <Icons.Code2 />
                Combined Code
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

                  {questionData?.svgContent && (
                    <div
                      className="my-4 flex justify-center w-full dark:[&>svg]:invert dark:[&>svg]:hue-rotate-180 [&>svg]:max-w-full [&>svg]:h-auto"
                      dangerouslySetInnerHTML={{ __html: questionData.svgContent }}
                    />
                  )}

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
                          <td className="px-4 py-2 text-sm space-x-2">
                            <button
                              onClick={() => {
                                setSelectedSubmission(s);
                                setShowSubmissionModal(true);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              View
                            </button>
                            {/* <button
                              onClick={() => copySubmissionToEditor(s)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
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

            {activeTab === 'combined' && (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Combined Code
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This is combined code from all visible files in correct order, ready for execution.
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
              {availableFiles.length > 0 && (
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
            </div>
          </div>
          <div className="flex-1 bg-white dark:bg-gray-900 min-w-0 overflow-hidden">
            {console.log('🔧 Editor rendering with:', { selectedLanguage, monacoLanguage })}
            <Editor
              height="100%"
              path={activeFile || 'multi-file'}
              defaultLanguage='text'
              language={monacoLanguage}
              theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
              value={typeof code === 'string' ? code : String(code || '')}
              onChange={(newValue) => {
                if (!activeFile || !questionData?.defaultCode?.[selectedLanguage]?.[activeFile]) {
                  console.log('🚫 Editor change ignored - missing data:', {
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

        {showSubmissionModal && selectedSubmission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-lg max-w-2xl w-full max-h-96 flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-dark-tertiary">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Code</h2>
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language: <span className="font-bold text-blue-600 dark:text-blue-400">{selectedSubmission.language}</span>
                  </label>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status: <span className={`font-bold ${selectedSubmission.status === 'correct' ? 'text-green-600' : 'text-red-600'}`}>{selectedSubmission.status}</span>
                  </label>
                </div>

                <div className="bg-gray-800 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-gray-100 text-sm font-mono whitespace-pre-wrap break-words">
                    {selectedSubmission.code}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-dark-tertiary">
                <button
                  onClick={() => copySubmissionToEditor(selectedSubmission)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Copy to Editor
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedSubmission.code).then(() => {
                      const toast = document.createElement('div');
                      toast.textContent = 'Code copied to clipboard';
                      toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded';
                      document.body.appendChild(toast);
                      setTimeout(() => toast.remove(), 3000);
                    });
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Copy Code
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer />
      </div>
    </>
  );
};

export default CodePageMultifile;
