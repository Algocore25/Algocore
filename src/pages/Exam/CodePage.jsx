
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../context/ThemeContext';
import { useParams, useNavigate } from "react-router-dom";


import { Icons, languageTemplates } from '../constants';
import { RxCrossCircled, RxCheckCircled } from "react-icons/rx";
import { BsDashCircle } from "react-icons/bs";

import { database } from "../../firebase";
import { ref, get, set, child } from "firebase/database";

import AnimatedTestResults from '../AnimatedTestResults';
import { executeCode } from '../api';
import { useAuth } from '../../context/AuthContext';

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { setItemWithExpiry, getItemWithExpiry } from "../../utils/storageWithExpiry";






function CodePage({ question }) {
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState('description');
  const [output, setOutput] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [testCaseTab, setTestCaseTab] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(45);
  const [selectedLanguage, setSelectedLanguage] = useState('cpp');
  const { theme } = useTheme();
  const [testCasesrun, setTestCases] = useState([]);
  const [allowlanguages, setallowlanguages] = useState([]);
  const [questionData, setQuestionData] = useState(null); // Initialize questionData state

  const { testid } = useParams();
  const { user } = useAuth();
  const [submissionStatus, setSubmissionStatus] = useState('not_attended');

  useEffect(() => {
    const preventDefault = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const preventContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const blockPaste = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', '');
        e.clipboardData.clearData();
      }

      toast.error('Copy-paste is disabled in this environment');
      return false;
    };

    const blockDragDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const options = { capture: true, passive: false };

    document.addEventListener('copy', preventDefault, options);
    document.addEventListener('cut', preventDefault, options);
    document.addEventListener('paste', blockPaste, options);
    document.addEventListener('contextmenu', preventContextMenu, options);

    document.addEventListener('drop', blockDragDrop, options);
    document.addEventListener('dragover', blockDragDrop, options);

    const preventShortcuts = (e) => {
      const isPaste = (e.ctrlKey || e.metaKey) && ['v', 'V', 'Insert'].includes(e.key);
      const isCopy = (e.ctrlKey || e.metaKey) && ['c', 'C', 'Insert', 'F3', 'F16', 'F24'].includes(e.key);
      const isCut = (e.ctrlKey || e.metaKey) && ['x', 'X', 'Delete'].includes(e.key);

      if (isPaste || isCopy || isCut) {
        e.preventDefault();
        e.stopPropagation();

        window.getSelection().removeAllRanges();

        if (isPaste) {
          toast.error('Pasting is disabled in this environment');
        }

        return false;
      }
    };

    document.addEventListener('keydown', preventShortcuts, { capture: true });

    const blockEditable = (e) => {
      if (e.target.isContentEditable) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('paste', blockEditable, { capture: true });

    const blurHandler = () => {
      if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
        document.activeElement.blur();
      }
    };

    window.addEventListener('blur', blurHandler);

    return () => {
      document.removeEventListener('copy', preventDefault, options);
      document.removeEventListener('cut', preventDefault, options);
      document.removeEventListener('paste', blockPaste, options);
      document.removeEventListener('contextmenu', preventContextMenu, options);
      document.removeEventListener('drop', blockDragDrop, options);
      document.removeEventListener('dragover', blockDragDrop, options);
      document.removeEventListener('keydown', preventShortcuts, { capture: true });
      document.removeEventListener('paste', blockEditable, { capture: true });
      window.removeEventListener('blur', blurHandler);
    };
  }, []);

  // Refs
  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const editorRef = useRef(null);
  const resizeObserverRef = useRef(null);

  // Function to adjust textarea height based on content
  const adjustTextareaHeight = (element) => {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
  };

  // Update textarea heights when test case tab changes or when test cases are loaded
  useEffect(() => {
    // Use a small timeout to ensure the DOM is updated before adjusting heights
    const timer = setTimeout(() => {
      if (inputRef.current) {
        adjustTextareaHeight(inputRef.current);
      }
      if (outputRef.current) {
        adjustTextareaHeight(outputRef.current);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [testCaseTab, testCasesrun, activeTab]);

  // Fetch submission status from Firebase
  const fetchSubmissionStatus = useCallback(async () => {
    try {
      const resultRef = ref(database, `ExamSubmissions/${testid}/${user.uid}/${question}/`);
      const snapshot = await get(resultRef);

      if (snapshot.exists()) {
        const result = snapshot.val();
        setSubmissionStatus(result === 'true' ? 'correct' : 'wrong');
      } else {
        setSubmissionStatus('not_attended');
      }
    } catch (error) {
      console.error("Error fetching submission status:", error);
      setSubmissionStatus('not_attended');
    }
  }, [testid, question]);




  useEffect(() => {
    console.log(question);
    fetchSubmissionStatus();
  }, [question]);

  const handleSubmit2 = async () => {
    if (!questionData || !questionData.testcases) {
      console.error('Question data not loaded');
      return;
    }
    const testCases = questionData.testcases;
    const initialResults = testCases.map(tc => ({
      input: tc.input,
      expected: tc.expectedOutput,
      output: '',
      passed: false,
      status: 'running',
    }));

    setTestResults(initialResults);
    setOutput(null);
    setActiveTab('output');

    const updatedResults = [...initialResults];

    for (let i = 0; i < testCases.length; i++) {
      const { input, expectedOutput } = testCases[i];
      const { run: result } = await executeCode(selectedLanguage, code, input);












      // regex

      if (questionData?.testcases[2]?.input === "regex2") {
        const passed = result.output.match(questionData.testcases[2].expectedOutput);
        console.log(result.output);
        console.log(questionData.testcases[2].expectedOutput);
        const regex = new RegExp(
          // "Parent => PID: (\\d+)\\nWaiting for child process to finish\\.\\nChild => PPID: (\\d+), PID: (\\d+)\\nChild process finished\\.|Child => PPID: (\\d+), PID: (\\d+)\\nParent => PID: (\\d+)\\nWaiting for child process to finish\\.\\nChild process finished\\."
          /^PID of example\.c = \d+\n(?:[A-Za-z]{3} ){2}\d{1,2} \d{2}:\d{2}:\d{2} [A-Z]+ \d{4}\n?$/
        );
        console.log(regex.test(result.output))
        updatedResults[i] = {
          input,
          expected: expectedOutput,
          output: result.output,
          passed: regex.test(result.output),
          status: 'done',
        };
        setTestResults([...updatedResults]);
        await new Promise(res => setTimeout(res, 300));
        continue;
      }
      if (questionData?.testcases[2]?.input === "regex") {
        const passed = result.output.match(questionData.testcases[2].expectedOutput);
        console.log(result.output);
        console.log(questionData.testcases[2].expectedOutput);
        const regex = new RegExp(
          /^Child => PPID: \d+, PID: \d+\nParent => PID: \d+\nWaiting for child process to finish\.\nChild process finished\.\n?$/
        );
        console.log(regex.test(result.output))
        updatedResults[i] = {
          input,
          expected: expectedOutput,
          output: result.output,
          passed: regex.test(result.output),
          status: 'done',
        };

        setTestResults([...updatedResults]);
        await new Promise(res => setTimeout(res, 300));
        continue;
      }


      const resultlist = result.output ? result.output.split("\n") : ["No output received."];
      while (resultlist[resultlist.length - 1] === "") resultlist.pop();

      const expectedLines = expectedOutput.split("\n");
      while (expectedLines[expectedLines.length - 1] === "") expectedLines.pop();

      const passed = resultlist.length === expectedLines.length &&
        resultlist.every((val, idx) => val.trimEnd() === expectedLines[idx].trimEnd());

      updatedResults[i] = {
        input,
        expected: expectedOutput,
        output: result.output,
        passed,
        status: 'done',
      };

      setTestResults([...updatedResults]);
    }

    const allPassed = updatedResults.every(tc => tc.passed);
    const mark = updatedResults.filter(tc => tc.passed).length;

    const finalResult = allPassed ? 'true' : 'false';

    // setOutput(finalResult);

    // ✅ Save final result to Firebase Realtime Database
    const resultRef = ref(database, `ExamSubmissions/${testid}/${user.uid}/${question}/`); // 'submissions' node, new entry
    const markRef = ref(database, `Marks/${testid}/${user.uid}/${question}/`); // 'submissions' node, new entry

    await set(resultRef, finalResult);
    await set(markRef, (mark / updatedResults.length) * 100);

    setSubmissionStatus(allPassed ? 'correct' : 'wrong');


    console.log("Saved to Firebase:", finalResult);
  };






  const runCode = async () => {
    if (!testCasesrun || testCasesrun.length === 0) {
      console.error('No test cases available');
      return;
    }
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

      const updatedResults = [...initialResults];
      let firstFailureShown = false;

      for (let i = 0; i < testCases.length; i++) {
        const { input: testInput, expectedOutput } = testCases[i];

        try {
          const { run: result } = await executeCode(selectedLanguage, code, testInput);

          // regex
          if (questionData?.testcases[2]?.input === "regex2") {
            const passed = result.output.match(questionData.testcases[2].expectedOutput);
            console.log(result.output);
            console.log(questionData.testcases[2].expectedOutput);
            const regex = new RegExp(
              // "Parent => PID: (\\d+)\\nWaiting for child process to finish\\.\\nChild => PPID: (\\d+), PID: (\\d+)\\nChild process finished\\.|Child => PPID: (\\d+), PID: (\\d+)\\nParent => PID: (\\d+)\\nWaiting for child process to finish\\.\\nChild process finished\\."
              /^PID of example\.c = \d+\n(?:[A-Za-z]{3} ){2}\d{1,2} \d{2}:\d{2}:\d{2} [A-Z]+ \d{4}\n?$/
            );
            console.log(regex.test(result.output))
            updatedResults[i] = {
              input: testInput,
              expected: expectedOutput,
              output: result.output,
              passed: regex.test(result.output),
              status: 'done',
              isFirstFailure: !passed && !firstFailureShown
            };
            if (!passed && !firstFailureShown) {
              firstFailureShown = true;
              // Auto-expand the first failed test case
              setTestCaseTab(i);
            }
          }
          else if (questionData?.testcases[2]?.input === "regex") {
            const passed = result.output.match(questionData?.testcases[2]?.expectedOutput);
            console.log(result.output);
            console.log(questionData?.testcases[2]?.expectedOutput);
            const regex = new RegExp(
              /^Child => PPID: \d+, PID: \d+\nParent => PID: \d+\nWaiting for child process to finish\.\nChild process finished\.\n?$/);
            console.log(regex.test(result.output))
            updatedResults[i] = {
              input: testInput,
              expected: expectedOutput,
              output: result.output,
              passed: regex.test(result.output),
              status: 'done',
              isFirstFailure: !passed && !firstFailureShown
            };
            if (!passed && !firstFailureShown) {
              firstFailureShown = true;
              // Auto-expand the first failed test case
              setTestCaseTab(i);
            }
          }






















          else {

            const resultOutput = result.output || '';
            const resultLines = resultOutput ? resultOutput.split("\n").filter(line => line !== '') : [];
            const expectedLines = expectedOutput ? expectedOutput.split("\n").filter(line => line !== '') : [];

            const passed = resultLines.length === expectedLines.length &&
              resultLines.every((val, idx) => val.trimEnd() === expectedLines[idx].trimEnd());

            updatedResults[i] = {
              input: testInput,
              expected: expectedOutput,
              output: resultOutput,
              passed,
              status: 'done',
              isFirstFailure: !passed && !firstFailureShown
            };
            if (!passed && !firstFailureShown) {
              firstFailureShown = true;
              // Auto-expand the first failed test case
              setTestCaseTab(i);
            }

          }


        } catch (error) {
          console.error(`Error executing test case ${i + 1}:`, error);
          updatedResults[i] = {
            input: testInput,
            expected: expectedOutput || '',
            output: error.message || 'Error executing code',
            passed: false,
            status: 'done',
            isFirstFailure: !firstFailureShown
          };

          if (!firstFailureShown) {
            firstFailureShown = true;
            // Auto-expand the first failed test case
            setTestCaseTab(i);
          }
        }

        // Update UI after each test case
        setTestResults([...updatedResults]);

        // Small delay to show test cases running one by one
        await new Promise(resolve => setTimeout(resolve, 300));
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


  // Fixed loadCode function
  const loadCode = useCallback(async () => {
    try {
      const dbRef = ref(database);
      const codeKey = `ExamCode/${testid}/${user.uid}/${question}/${selectedLanguage}`;
      const snapshot = await get(child(dbRef, codeKey));

      console.log(snapshot.val());

      if (snapshot.exists()) {
        const savedCode = snapshot.val();
        setCode(savedCode);
        console.log("Code loaded successfully!");
      } else {
        // Set default template if no saved code exists
        setCode(languageTemplates[selectedLanguage] || "");
        console.log("No saved code found, using default template");
      }
    } catch (error) {
      console.error("Error loading code:", error);
      // Fallback to default template on error
      setCode(languageTemplates[selectedLanguage] || "");
    }
  }, [selectedLanguage, questionData]);

  // Fixed saveCode function
  const saveCode = useCallback(async (codeToSave) => {
    try {
      const codeKey = `ExamCode/${testid}/${user.uid}/${question}/${selectedLanguage}`;
      const dbRef = ref(database, codeKey);
      await set(dbRef, codeToSave);
      console.log("Code auto-saved successfully!");
    } catch (error) {
      console.error("Error saving code:", error);
    }
  }, [selectedLanguage]);


  // Fixed handleCodeChange function
  const handleCodeChange = useCallback((newValue) => {
    setCode(newValue); // Update state immediately

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for saving
    saveTimeoutRef.current = setTimeout(() => {
      saveCode(newValue);
    }, 500);
  }, [saveCode]);


  // Fixed handleLanguageChange function
  const handleLanguageChange = useCallback((e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    // Load saved code for the new language, or use template if none exists
    // Note: loadCode will be called in useEffect when selectedLanguage changes
  }, []);

  // Load code when component mounts or language changes
  useEffect(() => {
    if (questionData) { // Only load after question data is available
      loadCode();
    }
  }, [loadCode, questionData, selectedLanguage]);


  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // async function getAllowedLanguageTemplates() {

  //   const dbRef = ref(database);

  //   try {
  //     const snapshot = await get(child(dbRef, `/AlgoCore/${course}/allowedLanguages`));

  //     if (!snapshot.exists()) {
  //       console.warn("No data found in Firebase.");
  //       return {};
  //     }

  //     const data = snapshot.val();

  //     setallowlanguages(data);

  //     console.log(allowlanguages);

  //   } catch (error) {
  //     console.error("Failed to fetch templates:", error);
  //     return [];
  //   }
  // }


  // Fetch question data from Firebase
  useEffect(() => {

    const fetchData = async () => {
      try {
        // Single call for both question data and next question URL
        const questionRef = ref(
          database,
          `questions/${question}`);

        // Get both question data and all questions in parallel
        const [questionSnapshot] = await Promise.all([
          get(questionRef),
        ]);

        console.log(questionSnapshot.val());

        if (questionSnapshot.exists()) {
          const question = questionSnapshot.val();


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

    console.log(question);

  }, [question]); // Dependencies adjusted

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;

    // Clean up previous observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    // Initialize new ResizeObserver
    resizeObserverRef.current = new ResizeObserver(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    });

    // Observe the editor container
    const editorContainer = editor.getContainerDomNode();
    if (editorContainer) {
      resizeObserverRef.current.observe(editorContainer);
    }

    // Disable Copy (Ctrl + C)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      const copyDisabled = getItemWithExpiry("copyDisabled");
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
  }
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [leftPanelWidth]);

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
    // Clamp between 18% and 70%
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




  return (
    <div className="min-h-screen h-screen w-full flex bg-white dark:bg-dark-primary select-none">
      <ToastContainer />
      {/* Left Panel */}
      <div
        className="bg-white dark:bg-dark-secondary border-r border-gray-200 dark:border-dark-tertiary flex flex-col overflow-hidden h-full"
        style={{ width: `${leftPanelWidth}%` }}
      >
        <div className="flex border-b border-gray-200 dark:border-dark-tertiary">
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
        </div>

        <div className="p-6 flex-1 min-h-0 overflow-auto" style={{ height: '100%' }}>
          {activeTab === 'description' && (
            <div className="text-gray-700 dark:text-gray-400">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words flex items-center gap-2">
                  {String(questionData?.questionname)}
                  {submissionStatus === "not_submitted" && <BsDashCircle className="text-yellow-500" />}
                  {submissionStatus === "correct" && <RxCheckCircled className="text-green-500" />}
                  {submissionStatus === "wrong" && <RxCrossCircled className="text-red-500" />}
                </h1>
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

                {/* empty div for spacing */}
                <div className="h-10"></div>

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
                          <div className="flex-1 min-w-0">
                            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Input</label>
                            <div className="relative">
                              <textarea
                                ref={inputRef}
                                className="w-full p-2 border border-gray-300 dark:border-dark-tertiary rounded-md bg-white dark:bg-dark-secondary text-gray-900 dark:text-white font-mono text-base min-h-[80px] resize-y whitespace-pre overflow-x-auto"
                                value={testCasesrun[testCaseTab]?.input || ''}
                                onChange={e => {
                                  const updated = [...testCasesrun];
                                  updated[testCaseTab].input = e.target.value;
                                  setTestCases(updated);
                                  requestAnimationFrame(() => {
                                    adjustTextareaHeight(e.target);
                                  });
                                }}
                                onInput={e => adjustTextareaHeight(e.target)}
                                placeholder="Enter input (supports multiple lines)"
                                rows={1}
                                style={{
                                  minHeight: '40px',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  overflowX: 'auto',
                                  whiteSpace: 'pre',
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  minWidth: '100%',
                                  maxWidth: '100%'
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Expected Output</label>
                            <div className="relative">
                              <textarea
                                ref={outputRef}
                                className="w-full p-2 border border-gray-300 dark:border-dark-tertiary rounded-md bg-white dark:bg-dark-secondary text-gray-900 dark:text-white font-mono text-base min-h-[80px] resize-y whitespace-pre overflow-x-auto"
                                value={testCasesrun[testCaseTab]?.expectedOutput || ''}
                                onChange={e => {
                                  const updated = [...testCasesrun];
                                  updated[testCaseTab].expectedOutput = e.target.value;
                                  setTestCases(updated);
                                  requestAnimationFrame(() => {
                                    adjustTextareaHeight(e.target);
                                  });
                                }}
                                onInput={e => adjustTextareaHeight(e.target)}
                                placeholder="Enter expected output (supports multiple lines)"
                                rows={1}
                                style={{
                                  minHeight: '40px',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  overflowX: 'auto',
                                  whiteSpace: 'pre',
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  minWidth: '100%',
                                  maxWidth: '100%'
                                }}
                              />
                            </div>
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
              ) : (
                <>
                  <AnimatedTestResults testResults={testResults} />
                </>
              )}
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
        <div className="bg-white dark:bg-dark-secondary border-t border-gray-200 dark:border-dark-tertiary p-2 flex justify-end gap-6">
          <div className="flex items-center gap-4">
            <select
              className="bg-white dark:bg-dark-secondary text-gray-900 dark:text-white border border-gray-300 dark:border-dark-tertiary rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4285F4] focus:border-transparent"
              value={selectedLanguage}
              onChange={handleLanguageChange}
            >
              {/* <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option> */}
              <option value="cpp">C</option>
              {/* {  allowlanguages.map((lang) => (
                <option key={lang} value={lang}>
                  { lang}
                </option>
              ))} */}
            </select>
          </div>
          {/* Right: Run/Submit/Stats */}
          <div className="flex items-center gap-4">

            <button
              onClick={runCode}
              className="bg-[#4285F4] hover:bg-[#4285F4]/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-150"
            >
              <Icons.Play />
              Run Code
            </button>
            <button
              onClick={handleSubmit2}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-150"
            >
              <Icons.ChevronRight />
              Submit
            </button>
          </div>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-900 min-w-0 overflow-auto">
          <Editor
            height="100%"
            defaultLanguage="cpp"
            language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
            value={code}
            onChange={handleCodeChange}
            onMount={handleEditorDidMount}
            options={{
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
              formatOnType: true
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default CodePage;