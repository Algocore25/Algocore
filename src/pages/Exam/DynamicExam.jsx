import React, { useState, useEffect, useRef } from "react";
import Exam2 from "./Exam2";
import { database } from "../../firebase";
import { ref, get, set, child } from "firebase/database";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import FullscreenTracker from "../FullscreenTracker";
import LoadingPage from "../LoadingPage";

const DynamicExam = () => {
  const [stage, setStage] = useState("loading"); // 'loading', 'instructions', 'exam', 'warning', 'completed', 'resume', 'blocked'
  const [Questions, setQuestions] = useState([]);
  const [examStatus, setExamStatus] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [violation, setviolation] = useState(null);
  const [isViolationReady, setIsViolationReady] = useState(false); // New state

  const [ duration, setDuration] = useState(60*30); // New state
  const containerRef = useRef(null);

  const { testid } = useParams();

  const { user } = useAuth();

  // Function to check exam status
  const checkExamStatus = async () => {
    try {
      const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}`);
      const statusSnapshot = await get(statusRef);

      if (statusSnapshot.exists()) {
        const statusData = statusSnapshot.val();

        // If exam is blocked
        if (statusData.status === "blocked") {
          setStage("blocked");
          return true;
        }

        // If exam is completed
        if (statusData.status === "completed" || statusData.completed === true) {
          setStage("completed");
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
      if (violation >= 2 &&  currstageSnapshot.val() != "completed" ) {
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
        if (isCompleted) return;


        const myquestions = await get(ref(database, `Exam/${testid}/myquestions/${user.uid}`));

        if (myquestions.exists()) {
          setQuestions(myquestions.val());
        }
        else
        {

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

  // Function to mark exam as completed (call this from Exam2 component when exam is finished)
  const markExamCompleted = async () => {
    try {
      const statusRef = ref(database, `ExamSubmissions/${testid}/status`);
      await set(statusRef, "completed");
      setExamStatus("completed");
      setStage("completed");
    } catch (error) {
      console.error("Error marking exam as completed:", error);
    }
  };

  // Function to mark exam as blocked due to violations
  const markExamBlocked = async () => {
    try {
      const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}/status`);
      await set(statusRef, "blocked");
      setStage("blocked");
    } catch (error) {
      console.error("Error marking exam as blocked:", error);
    }
  };

  return (
    <div ref={containerRef} className="h-screen bg-gray-100 dark:bg-gray-900">
      {stage === "loading" && (
        <LoadingPage message="Loading exam, please wait..."/>
      )}

      {stage === "instructions" && (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <h1 className="text-3xl font-bold mb-6">Exam Instructions</h1>
          <ul className="mb-6 text-left list-disc list-inside max-w-xl">
            <li>This exam must be taken in full-screen mode.</li>
            <li>Exiting full screen will show a warning.</li>
            <li>Do not refresh or switch tabs.</li>
          </ul>
          <button
            onClick={startExam}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            I Agree, Start Exam
          </button>
        </div>
      )}

      {stage === "exam" && (
        <>
          <FullscreenTracker violation={violation} setviolation={setviolation} testid={testid} />
          <Exam2
            Questions={Questions}
            onExamComplete={markExamCompleted} // Pass the completion handler
            startTime={startTime}
            duration={duration}
          />
        </>
      )}

      {stage === "warning" && (
        <>
          <FullscreenTracker violation={violation} setviolation={setviolation} testid={testid} />
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-3xl mx-auto p-8 rounded-xl shadow-lg bg-white dark:bg-gray-800 text-center space-y-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fullscreen Exit Detected</h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">You exited fullscreen mode. Please return to fullscreen to continue your test.</p>
              <p className="text-sm text-gray-500">Exiting fullscreen repeatedly may lead to blocking.</p>
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
        <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900">
          <div className="w-full max-w-3xl mx-auto p-8 rounded-xl shadow-lg bg-white dark:bg-gray-800 text-center space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Resume Your Test</h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">Looks like you got interrupted. You can continue your test where you left off.</p>
            <p className="text-sm text-gray-500">Your progress has been saved. Please enter fullscreen again to continue.</p>
            <button
              onClick={returnToFullScreen}
              className="px-6 py-3 rounded-md font-semibold text-white transition-colors bg-yellow-500 hover:bg-yellow-600"
            >
              Resume Test
            </button>
          </div>
        </div>
      )}

      {stage === "blocked" && (
        <div className="flex flex-col items-center justify-center h-full bg-red-100 text-center p-6">
          <h2 className="text-3xl font-bold text-red-800 mb-4">Exam Blocked</h2>
          <p className="text-red-700 mb-6 text-lg">
            You have exceeded the maximum number of violations. Your exam has been blocked.
          </p>
          <div className="text-sm text-red-600">
            <p>Please contact the administrator.</p>
          </div>
        </div>
      )}

      {stage === "completed" && (
        <div className="flex flex-col items-center justify-center h-full bg-green-100 text-center p-6">
          <div className="mb-6">
            <svg
              className="w-16 h-16 text-green-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-green-800 mb-4">Exam Completed!</h2>
          <p className="text-green-700 mb-6 text-lg">
            Thank you for completing the exam. Your responses have been submitted successfully.
          </p>
          <div className="text-sm text-green-600">
            <p>You can now safely close this window.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicExam;