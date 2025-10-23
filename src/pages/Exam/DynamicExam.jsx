import React, { useState, useEffect, useRef } from "react";
import Exam2 from "./Exam2";
import { database } from "../../firebase";
import { ref, get, set, child } from "firebase/database";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import FullscreenTracker from "../FullscreenTracker";
import LoadingPage from "../LoadingPage";
import { User } from "lucide-react";

const DynamicExam = () => {
  const [stage, setStage] = useState("loading"); // 'loading', 'instructions', 'exam', 'warning', 'completed', 'resume', 'blocked'
  const [Questions, setQuestions] = useState([]);
  const [examStatus, setExamStatus] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [violation, setviolation] = useState(null);
  const [isViolationReady, setIsViolationReady] = useState(false); // New state

  const [configdata, setConfigdata] = useState({});
  const [duration, setDuration] = useState(60 * 30); // New state
  const containerRef = useRef(null);

  const { testid } = useParams();

  const { user } = useAuth();

  const [examName, setExamName] = useState(null);
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  // Function to check exam status
  const checkExamStatus = async () => {
    try {
      const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}`);
      const statusSnapshot = await get(statusRef);

      const examstatus = await get(ref(database, `Exam/${testid}/Properties/status`));
      console.log(examstatus.val());

      if (examstatus.val() === "Completed") {
        setStage("completed");
        return true;
      }

      if (statusSnapshot.exists()) {
        const statusData = statusSnapshot.val();
        // If exam is completed
        if (statusData.status === "completed" || statusData.completed === true) {
          setStage("completed");
          return true;
        }

        // If exam is blocked
        if (statusData.status === "blocked") {
          setStage("blocked");
          return true;
        }



        console.log(statusData);

        // If exam was started but not completed
        if (statusData.startTime) {
          setStage("resume");
          setStartTime(statusData.startTime);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking exam status:", error);
      return false;
    }
  };

  const fetchDuration = async () => {
    try {
      const statusRef = ref(database, `Exam/${testid}/duration`);
      const statusSnapshot = await get(statusRef);

      if (statusSnapshot.exists()) {
        const statusData = statusSnapshot.val();

        setDuration(statusData);

        console.log(statusData);
      }
    } catch (error) {
      console.error("Error checking exam status:", error);
    }
  };








  const checkviolation = async () => {
    try {
      const violationRef = ref(database, `Exam/${testid}/Properties2/Progress/${user.uid}`);
      const violationSnapshot = await get(violationRef);

      if (violationSnapshot.exists()) {
        const violationData = violationSnapshot.val();
        setviolation(violationData);
      } else {
        setviolation(0);
      }
      setIsViolationReady(true); // Mark as ready
    } catch (error) {
      console.error("Error checking exam status:", error);
    }
  };

  useEffect(() => {
    const saveAndCheckViolations = async () => {
      // Only run if the initial violation count has been loaded.
      if (!isViolationReady) return;

      // Save the updated violation count to Firebase
      if (testid && user && violation !== null) {
        const violationRef = ref(database, `Exam/${testid}/Properties2/Progress/${user.uid}`);
        await set(violationRef, violation);
      }

      const currstage = ref(database, `Exam/${testid}/Properties2/Progress/${user.uid}/stage`);
      const currstageSnapshot = await get(currstage);

      // Check if the exam should be blocked
      if (violation >= 2 && currstageSnapshot.val() != "completed") {
        console.log(currstageSnapshot.val());
        markExamBlocked();
      }
    };

    saveAndCheckViolations();
  }, [violation, isViolationReady, testid, user]);

  // Function to check exam duration
  const checkExamDuration = async () => {
    try {
      const examRef = ref(database, `Exam/${testid}/Properties`);
      const snapshot = await get(examRef);

      if (snapshot.exists()) {
        const examData = snapshot.val();
        const startTime = new Date(examData.startTime);
        const durationMinutes = examData.duration || 60; // Default 60 minutes if not set
        const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

        // Compare with current time
        if (new Date() > endTime) {
          await markExamCompleted();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking exam duration:", error);
      return false;
    }
  };

  // Fetch question data and exam status from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check exam status first
        const isCompleted = await checkExamStatus();
        // if (isCompleted) return;

        fetchResults();

        const examname = await get(ref(database, `Exam/${testid}/name`));

        setExamName(examname.val());

        const configdata = await get(ref(database, `Exam/${testid}/configure/questionsPerType`));
        setConfigdata(configdata.val());
        console.log(configdata.val());


        const myquestions = await get(ref(database, `Exam/${testid}/myquestions/${user.uid}`));

        if (myquestions.exists()) {
          setQuestions(myquestions.val());
        }
        else {

          // Load questions
          const questionRef = ref(database, `Exam/${testid}/questions`);
          const questionSnapshot = await get(questionRef);

          if (!questionSnapshot.exists()) {
            console.error('No questions found for this test');
            return;
          }

          const allQuestions = questionSnapshot.val();
          const questionConfig = await get(ref(database, `Exam/${testid}/configure/questionsPerType`));

          if (!questionConfig.exists()) {
            console.error('No question configuration found');
            return;
          }

          const config = questionConfig.val();
          let selectedQuestions = [];
          const questionList = Object.entries(allQuestions);

          // Create a map to track used question IDs
          const usedQuestionIds = new Set();
          let hasInsufficientQuestions = false;

          // First, validate we have enough questions for each type
          for (const [type, count] of Object.entries(config)) {
            const availableQuestions = questionList
              .filter(([_, qType]) => qType.toLowerCase() === type.toLowerCase())
              .filter(([id]) => !usedQuestionIds.has(id));

            if (availableQuestions.length < count) {
              console.warn(`Warning: Not enough questions of type ${type}. Requested: ${count}, Available: ${availableQuestions.length}`);
              hasInsufficientQuestions = true;
            }
          }

          // If we don't have enough questions, adjust the config to use what's available
          const effectiveConfig = hasInsufficientQuestions
            ? Object.fromEntries(
              Object.entries(config).map(([type, count]) => {
                const availableQuestions = questionList
                  .filter(([_, qType]) => qType.toLowerCase() === type.toLowerCase())
                  .filter(([id]) => !usedQuestionIds.has(id));
                return [type, Math.min(count, availableQuestions.length)];
              })
            )
            : config;

          // Now select questions based on the effective config
          for (const [type, count] of Object.entries(effectiveConfig)) {
            if (count <= 0) continue;

            // Get available questions of this type that haven't been selected yet
            const availableQuestions = questionList
              .filter(([_, qType]) => qType.toLowerCase() === type.toLowerCase())
              .filter(([id]) => !usedQuestionIds.has(id));

            if (availableQuestions.length === 0) {
              console.warn(`No available questions of type ${type} after filtering`);
              continue;
            }

            // Shuffle and select the required number of questions
            const shuffled = [...availableQuestions]
              .sort(() => Math.random() - 0.5);

            const selected = shuffled.slice(0, count);

            // Add selected questions to our results
            selectedQuestions = [
              ...selectedQuestions,
              ...selected.map(([id]) => id)
            ];

            // Mark these questions as used
            selected.forEach(([id]) => usedQuestionIds.add(id));

            console.log(`Selected ${selected.length} questions of type ${type}`);
          }

          // Save selected questions to user's test
          if (selectedQuestions.length > 0) {
            await set(ref(database, `Exam/${testid}/myquestions/${user.uid}`), selectedQuestions);
            setQuestions(selectedQuestions);
          } else {
            console.error('No questions selected based on configuration');
          }

        }




        await checkviolation();

        // Only move to next stage after all data is loaded
        setStage(prev => prev === "loading" ? "instructions" : prev);
      } catch (error) {
        console.error("Error fetching data:", error);
        setStage("instructions"); // Fallback
      }
    };

    if (testid) fetchData();

    fetchDuration();

  }, [testid]);

  useEffect(() => {
    const handleFullScreenChange = async () => {
      const isFullScreen = document.fullscreenElement !== null;

      if (!isFullScreen && stage === "exam") {
        // Exit from full screen during exam - check exam status first
        console.log("Exited full screen, checking exam status...");

        const isCompleted = await checkExamStatus();
        if (!isCompleted) {
          // Only show warning if exam is not completed
          setStage("warning");
        }
        // If exam is completed, checkExamStatus will have already set stage to "completed"
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
    };
  }, [stage, testid]);

  useEffect(() => {
    const checkDuration = async () => {
      const isExpired = await checkExamDuration();
      if (isExpired) {
        setStage("completed");
        fetchResults();
      }
    };

    if (stage === "exam") {
      checkDuration();
    }

  }, [stage]);

  const startExam = async () => {
    try {
      // Check exam status first
      const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}`);
      const statusSnapshot = await get(statusRef);

      // If exam was already started but not completed, show resume screen
      if (statusSnapshot.exists() && statusSnapshot.val().startTime && !statusSnapshot.val().completed) {
        setStage("resume");
        return;
      }

      // Check if exam is already completed
      if (statusSnapshot.exists() && (statusSnapshot.val().status === "completed" || statusSnapshot.val().completed === true)) {
        return;
      }

      // Store exam start time in Firebase and local state
      const currentTime = new Date().toISOString();
      await set(ref(database, `Exam/${testid}/Properties/Progress/${user.uid}`), {
        startTime: currentTime,
        status: "started"
      });
      setStartTime(currentTime);

      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
      setStage("exam");
    } catch (error) {
      console.error("Failed to enter fullscreen:", error);
    }
  };

  const returnToFullScreen = async () => {
    try {
      // Check exam status before returning to full screen
      const isCompleted = await checkExamStatus();
      if (isCompleted) {
        return; // Don't return to exam if it's already completed
      }

      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
      setStage("exam");
    } catch (error) {
      console.error("Failed to re-enter fullscreen:", error);
    }
  };

  // Function to fetch exam results
  const fetchResults = async () => {
    if (!user?.uid) return;

    setLoadingResults(true);
    try {
      // Get student's assigned questions
      const studentQuestionsRef = ref(database, `Exam/${testid}/myquestions/${user.uid}`);
      const studentQuestionsSnapshot = await get(studentQuestionsRef);
      // const studentQuestions = studentQuestionsSnapshot.val() || {};
      const questionIds = studentQuestionsSnapshot.val() || [];

      // Get student's answers
      const answersRef = ref(database, `ExamSubmissions/${testid}/${user.uid}`);
      const answersSnapshot = await get(answersRef);
      const answers = answersSnapshot.val() || {};

      const marksRef = ref(database, `Marks/${testid}/${user.uid}`);
      const marksSnapshot = await get(marksRef);
      const marks = marksSnapshot.val() || {};


      console.log(questionIds);
      console.log(answers);
      console.log(marks);

      // Calculate score
      let correctCount = 0;
      const questionDetails = [];
      let totalMarks = 0;

      for (const questionId of questionIds) {
        const isCorrect = answers[questionId] === "true";
        if (isCorrect) correctCount++;

        // Get question type
        const questionTypeRef = ref(database, `questions/${questionId}/type`);
        const questionTypeSnapshot = await get(questionTypeRef);
        const questionType = questionTypeSnapshot.val() || 'mcq';

        console.log( marks[questionId]||0 );

        questionDetails.push({
          id: questionId,
          correct: isCorrect,
          type: questionType,
          mark: marks[questionId] || 0
        });
          totalMarks += marks[questionId] || 0;
        }

      

      // Calculate score percentage
      const score = questionIds.length > 0
        ? Math.round(( totalMarks / questionIds.length) )
        : 0;
      
      

      setResults({
        score,
        correctCount,
        totalQuestions: questionIds.length,
        questions: questionDetails,
        totalMarks
      });
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoadingResults(false);
    }
  };

  // Function to mark exam as completed (call this from Exam2 component when exam is finished)
  const markExamCompleted = async () => {
    try {
      const statusRef = ref(database, `ExamSubmissions/${testid}/status`);
      await set(statusRef, "completed");
      setExamStatus("completed");
      setStage("completed");
      fetchResults();
    } catch (error) {
      console.error("Error marking exam as completed:", error);
    }
  };

  // Function to mark exam as blocked due to violations
  const markExamBlocked = async () => {
    try {
      const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}/status`);
      await set(statusRef, "blocked");
      const examstatus = ref(database, `Exam/${testid}/Properties/status`);
      const examstatusSnapshot = await get(examstatus);
      if (examstatusSnapshot.val() === "Completed") {

        const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}/status`);
        await set(statusRef, "completed");

        setStage("completed");
        fetchResults();
        return;
      }
      console.log("2 my block")
      setStage("blocked");

    } catch (error) {
      console.error("Error marking exam as blocked:", error);
    }
  };

  return (
    <div ref={containerRef} className="h-screen bg-gray-100 dark:bg-gray-900">
      {stage === "loading" && (
        <LoadingPage message="Loading exam, please wait..." />
      )}

      {stage === "instructions" && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 dark:bg-blue-700 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">Exam Instructions</h1>
              <p className="text-blue-100">Please read the instructions carefully before starting</p>
            </div>

            <div className="p-6 md:p-8">
              {/* Exam Overview */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{examName || 'Loading Exam...'}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Duration:</span> {duration ? `${Math.floor(duration)} minutes` : 'Loading...'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Questions:</span> {Questions?.length || 0} total
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Question Types:</h4>
                    {configdata && (
                      <div className="space-y-1">
                        {Object.entries(configdata).map(([type, count]) => (
                          count > 0 && (
                            <div key={type} className="flex justify-between items-center">
                              <span className="text-gray-700 dark:text-gray-300">{type}</span>
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
                                {count} {count === 1 ? 'question' : 'questions'}
                              </span>
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Important Instructions</h3>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>This exam must be taken in full-screen mode. The test will automatically start in full-screen.</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Exiting full screen will show a warning. Multiple violations may result in exam termination.</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                    <span>Do not refresh the page or switch tabs during the exam, as this may be flagged as suspicious activity.</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Your progress is automatically saved. You can resume the exam if you get disconnected.</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <button
                  onClick={startExam}
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Exam Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === "exam" && (
        <>
          <FullscreenTracker violation={violation} setviolation={setviolation} setIsViolationReady={setIsViolationReady} isViolationReady={isViolationReady} testid={testid} />
          <Exam2
            setviolation={setviolation}
            setIsViolationReady={setIsViolationReady}
            Questions={Questions}
            onExamComplete={markExamCompleted} // Pass the completion handler
            startTime={startTime}
            duration={duration}
            examName={examName}
          />
        </>
      )}

      {stage === "warning" && (
        <>
          <FullscreenTracker violation={violation} setviolation={setviolation} testid={testid} />
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-3xl mx-auto p-8 rounded-xl shadow-lg bg-white dark:bg-gray-800 text-center space-y-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{examName}</h1>
              {/* <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">{Questions.length} {Questions[0].type} questions, {violation} violations</p> */}
              <p className="text-sm text-gray-500">You exited fullscreen mode. Please return to fullscreen to continue your test.</p>
              <button
                onClick={returnToFullScreen}
                className="px-6 py-3 rounded-md font-semibold text-white transition-colors bg-red-600 hover:bg-red-700"
              >
                Return to Fullscreen
              </button>
            </div>
          </div>
        </>
      )}

      {stage === "resume" && (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 overflow-hidden">
          <div className="w-full max-w-lg max-h-[95vh] flex flex-col">
            <div className="h-4 sm:h-6 md:h-8 lg:h-12"></div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-6 text-center flex-shrink-0">
                <h1 className="text-2xl font-bold text-white mb-1">Test Paused</h1>
                <p className="text-sm text-yellow-50">Ready to continue?</p>
              </div>

              {/* Content Section - Scrollable if needed */}
              <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                {/* User Info Card */}
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full text-white font-bold text-lg shadow-lg">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Student</p>
                    <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{user?.name || 'User'}</p>
                  </div>
                </div>

                {/* Exam Info Card */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Exam</p>
                  <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{examName || 'Test'}</p>
                </div>

                {/* Test Summary */}
                {configdata && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">Questions</h3>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-1.5 max-h-32 overflow-y-auto">
                      {Object.entries(configdata).map(([type, count]) => (
                        count > 0 && (
                          <div key={type} className="flex justify-between items-center py-2 px-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <span className="text-sm text-gray-700 dark:text-gray-200 capitalize font-medium">{type.toLowerCase()}</span>
                            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                              {count}
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with Button */}
              <div className="px-6 pb-6 flex-shrink-0">
                <button
                  onClick={returnToFullScreen}
                  className="w-full px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 focus:outline-none focus:ring-4 focus:ring-yellow-300 dark:focus:ring-yellow-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>Resume Test</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === "blocked" && (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 p-4">
          <div className="w-full max-w-md mx-auto p-8 rounded-2xl shadow-xl bg-white dark:bg-gray-800 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">Exam Blocked</h2>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">{user?.name || 'User'}</span>, your access to <span className="font-semibold">{examName}</span> has been restricted.
              </p>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mt-4 text-left">
                <p className="text-red-700 dark:text-red-300 text-sm">
                  You have exceeded the maximum number of allowed violations. For further assistance, please contact the administrator.
                </p>
              </div>

              {configdata && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exam Details</h3>
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-2">
                    {Object.entries(configdata).map(([type, count]) => (
                      count > 0 && (
                        <div key={type} className="flex justify-between items-center py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors">
                          <span className="text-gray-700 dark:text-gray-200 capitalize">{type.toLowerCase()}</span>
                          <span className="px-3 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-full">
                            {count} {count === 1 ? 'question' : 'questions'}
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Need help? Contact support at <span className="font-medium">support@algocore.com</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {stage === "completed" && (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/10 dark:to-green-900/5 p-4">
          <div className="w-full max-w-2xl mx-auto p-8 rounded-2xl shadow-xl bg-white dark:bg-gray-800 space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">Test Completed Successfully!</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                <span className="font-medium">{user?.name || 'User'}</span>, you have completed <span className="font-semibold">{examName}</span>.
              </p>
            </div>

            {loadingResults ? (
              <div className="py-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Calculating your results...</p>
              </div>
            ) : results ? (
              <>
                {/* Results Summary */}
                <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 text-center">Your Results</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Score</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {results.score}%
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Correct Answers</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {results.correctCount}/{results.totalQuestions}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Questions</p>
                      <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                        {results.totalQuestions}
                      </p>
                    </div>
                  </div>

                  {results.questions && (
                    <div className="mt-4 space-y-3">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 text-center">Question Breakdown</h4>
                    <div className="space-y-2">
                      {results.questions.map((q, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg border ${
                            q.correct 
                              ? 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800/50' 
                              : q.mark > 0 ? 'bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-800/50' : 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                Q{index + 1}: {q.id || `Question ${index + 1}`}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {q.type} • {q.mark || 0} {q.mark === 1 ? 'point' : 'points'}
                              </p>
                            </div>
                            <span 
                              className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                                q.correct
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
                                  : q.mark > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                              }`}
                            >
                              {q.correct ? 'Correct' : q.mark > 0 ? 'Partial' : 'Incorrect'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}
                </div>

                {/* Test Summary */}
                {configdata && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Test Summary</h3>
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-2">
                      {Object.entries(configdata).map(([type, count]) => (
                        count > 0 && (
                          <div key={type} className="flex justify-between items-center py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors">
                            <span className="text-gray-700 dark:text-gray-200 capitalize">{type.toLowerCase()}</span>
                            <span className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full">
                              {count} {count === 1 ? 'question' : 'questions'}
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">Unable to load results. Please check your dashboard later.</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                You can view these results in your dashboard at any time.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicExam;