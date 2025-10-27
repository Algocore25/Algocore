import React, { useState, useEffect, useRef, useCallback } from "react";
import Exam2 from "./Exam2";
import { database } from "../../firebase";
import { ref, get, set, child, push } from "firebase/database";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usePersonDetection } from "../../LiveProctoring/hooks/usePersonDetection";
import { VideoCanvas } from "../../LiveProctoring/components/VideoCanvas";

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

  const [showPermModal, setShowPermModal] = useState(false);
  const [camOK, setCamOK] = useState(null);
  const [micOK, setMicOK] = useState(null);
  const [permError, setPermError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);
  const [permVerified, setPermVerified] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [detections, setDetections] = useState([]);
  const detectionIntervalRef = useRef(null);
  const proctorStreamRef = useRef(null);
  const noPersonStartTime = useRef(null);
  const multiPersonStartTime = useRef(null);
  const violationTriggered = useRef({ noPerson: false, multiPerson: false });
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");

  const { detectPersons, isLoading: aiLoading, error: aiError, modelReady } = usePersonDetection();

  const { testid } = useParams();

  const { user } = useAuth();

  const [examName, setExamName] = useState(null);
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    console.log(isViolationReady);
  }, [isViolationReady]);

  // Function to check exam status
  const checkExamStatus = async () => {
    try {
      const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}`);
      const statusSnapshot = await get(statusRef);


      const examStatusRef = ref(database, `Exam/${testid}/Properties/status`);
      const examstatus = await get(examStatusRef);
      console.log(examstatus.val());

      const examPropertiesRef = ref(database, `Exam/${testid}/Properties`);
      const examPropertiesSnapshot = await get(examPropertiesRef);
      const examProperties = examPropertiesSnapshot.exists() ? examPropertiesSnapshot.val() : {};

      const durationFallbackSnapshot = await get(ref(database, `Exam/${testid}/duration`));
      const durationValue = examProperties?.duration ?? durationFallbackSnapshot.val() ?? duration;
      const durationMinutes = Number(durationValue) || 60;

      if (examstatus.val().toLowerCase() === "completed") {
        setStage("completed");
        return true;
      }

      if (statusSnapshot.exists()) {
        const statusData = statusSnapshot.val();
        const statusString = typeof statusData === "string" ? statusData : statusData?.status;
        const isCompleted = typeof statusString === "string" && statusString.toLowerCase() === "completed";
        const progressData = typeof statusData === "object" && statusData !== null ? statusData : {};
        const userStartTime = progressData.startTime || examProperties?.startTime;

        if (!isCompleted && userStartTime) {
          const startTimeDate = new Date(userStartTime);
          const elapsedMinutes = (Date.now() - startTimeDate.getTime()) / 60000;

          if (elapsedMinutes >= durationMinutes) {
              const examRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}/status`);
            await set(examRef, "completed");
            await markExamCompleted();
            return true;
          }
        }

        // If exam is completed
        if (isCompleted || progressData.completed === true) {
          setStage("completed");
          return true;
        }

        // If exam is blocked
        if (typeof statusString === "string" && statusString.toLowerCase() === "blocked") {
          setStage("blocked");
          return true;
        }



        console.log(statusData);

        // If exam was started but not completed
        if (progressData.startTime) {
          setStage("resume");
          setStartTime(progressData.startTime);
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error("Error checking exam status:", error);
      return false;
    }
  };

  const showToastNotification = useCallback((message) => {
    setToastMsg(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  }, []);

  // --- Log violation to Firebase ---
  const logViolation = useCallback(async (reason, details = {}) => {
    if (!testid || !user?.uid) return;
    
    try {
      const violationRef = ref(database, `Exam/${testid}/Violations/${user.uid}`);
      const newViolationRef = push(violationRef);
      
      await set(newViolationRef, {
        reason,
        timestamp: new Date().toISOString(),
        details,
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
      });
      
      console.log(`[Violation Logged] ${reason}`, details);
    } catch (error) {
      console.error("Error logging violation:", error);
    }
  }, [testid, user]);

  const runDetection = useCallback(async () => {
    if (!videoRef.current || stage !== "exam" || !proctorStreamRef.current) return;
    const results = await detectPersons(videoRef.current);
    setDetections(results);
    const personCount = results.length;
    const now = Date.now();

    if (personCount === 0) {
      if (!noPersonStartTime.current) {
        noPersonStartTime.current = now;
        violationTriggered.current.noPerson = false;
      } else {
        const duration = (now - noPersonStartTime.current) / 1000;
        if (duration >= 5 && !violationTriggered.current.noPerson) {
          showToastNotification("⚠️ No person detected for 5 seconds - Violation recorded");
          setviolation(prev => (prev || 0) + 1);
          logViolation("No Person Detected", {
            duration: `${duration.toFixed(1)} seconds`,
            personCount: 0,
            detectionTime: new Date().toISOString()
          });
          violationTriggered.current.noPerson = true;
        }
      }
      multiPersonStartTime.current = null;
      violationTriggered.current.multiPerson = false;
    } else if (personCount > 1) {
      if (!multiPersonStartTime.current) {
        multiPersonStartTime.current = now;
        violationTriggered.current.multiPerson = false;
      } else {
        const duration = (now - multiPersonStartTime.current) / 1000;
        if (duration >= 5 && !violationTriggered.current.multiPerson) {
          showToastNotification(`⚠️ Multiple persons detected for 5 seconds - Violation recorded`);
          setviolation(prev => (prev || 0) + 1);
          logViolation("Multiple Persons Detected", {
            duration: `${duration.toFixed(1)} seconds`,
            personCount: personCount,
            detectionTime: new Date().toISOString()
          });
          violationTriggered.current.multiPerson = true;
        }
      }
      noPersonStartTime.current = null;
      violationTriggered.current.noPerson = false;
    } else {
      noPersonStartTime.current = null;
      multiPersonStartTime.current = null;
      violationTriggered.current.noPerson = false;
      violationTriggered.current.multiPerson = false;
    }
  }, [detectPersons, stage, showToastNotification, setviolation]);

  useEffect(() => {
    if (stage === "exam" && proctorStreamRef.current) {
      if (videoRef.current && proctorStreamRef.current) {
        videoRef.current.srcObject = proctorStreamRef.current;
      }
      if (modelReady) {
        detectionIntervalRef.current = setInterval(runDetection, 1000);
      }
    } else {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      noPersonStartTime.current = null;
      multiPersonStartTime.current = null;
      violationTriggered.current = { noPerson: false, multiPerson: false };
    }
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [stage, modelReady, runDetection]);

  const cleanupMedia = () => {
    try {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (analyserRef.current && analyserRef.current.disconnect) analyserRef.current.disconnect();
      analyserRef.current = null;
      if (audioCtxRef.current && audioCtxRef.current.close) audioCtxRef.current.close();
      audioCtxRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      streamRef.current = null;
      if (videoRef.current) {
        try { videoRef.current.srcObject = null; } catch (_) {}
      }
    } catch (_) {}
  };

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      setVideoDevices(videoInputs);
      setAudioDevices(audioInputs);
      if (videoInputs.length > 0 && !selectedVideoDevice) setSelectedVideoDevice(videoInputs[0].deviceId);
      if (audioInputs.length > 0 && !selectedAudioDevice) setSelectedAudioDevice(audioInputs[0].deviceId);
    } catch (e) {
      console.error("Error enumerating devices:", e);
    }
  };

  const startPermissionCheck = async () => {
    setIsChecking(true);
    setPermError("");
    setCamOK(null);
    setMicOK(null);
    setAudioLevel(0);
    cleanupMedia();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices not supported");
      }
      const constraints = {
        video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : true,
        audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        try { videoRef.current.srcObject = stream; } catch (_) {}
      }
      const vTrack = stream.getVideoTracks()[0];
      const aTrack = stream.getAudioTracks()[0];
      setCamOK(Boolean(vTrack && vTrack.readyState === "live"));
      setMicOK(Boolean(aTrack && aTrack.readyState === "live"));

      await enumerateDevices();

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const level = Math.min(100, Math.max(0, Math.round(rms * 180)));
        setAudioLevel(level);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      setPermError(e?.message || "Failed to access camera/microphone");
      setCamOK(false);
      setMicOK(false);
    } finally {
      setIsChecking(false);
    }
  };

  const openPermissionModal = async () => {
    setShowPermModal(true);
    setPermVerified(false);
    await enumerateDevices();
    startPermissionCheck();
  };

  const closePermissionModal = () => {
    setShowPermModal(false);
    cleanupMedia();
  };

  const continueAfterPermissions = async () => {
    if (!camOK || !micOK) {
      setPermError("Please allow both camera and microphone to continue");
      return;
    }
    if (!modelReady) {
      setPermError("AI model is still loading. Please wait...");
      return;
    }
    setPermVerified(true);
    // Save stream for proctoring but DON'T stop tracks
    proctorStreamRef.current = streamRef.current;
    // Keep video reference but don't cleanup
    setShowPermModal(false);
    
    if (stage === "resume" || stage === "warning") {
      // For resume/warning, directly enter fullscreen and set stage to exam
      try {
        const isCompleted = await checkExamStatus();
        if (isCompleted) return;
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
        setStage("exam");
      } catch (error) {
        console.error("Failed to re-enter fullscreen:", error);
      }
    } else {
      // For initial start, log start time and enter fullscreen
      try {
        const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}`);
        const statusSnapshot = await get(statusRef);
        if (statusSnapshot.exists() && statusSnapshot.val().startTime && !statusSnapshot.val().completed) {
          setStage("resume");
          return;
        }
        if (statusSnapshot.exists() && (statusSnapshot.val().status === "completed" || statusSnapshot.val().completed === true)) {
          return;
        }
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
        const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}`);
        await set(statusRef, "completed");
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
      if (!permVerified) {
        openPermissionModal();
        return;
      }
      // Check exam status first
      const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}`);
      const statusSnapshot = await get(statusRef);

      // If exam was already started but not completed, show resume screen
      if (statusSnapshot.exists() && statusSnapshot.val().startTime && !statusSnapshot.val().completed) {
        console.log("meow")
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
      if (!permVerified) {
        openPermissionModal();
        return;
      }
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
      const statusRefSnapshot = await get(statusRef);
      console.log( statusRefSnapshot.val());
      const examstatus = ref(database, `Exam/${testid}/Properties/status`);
      const examstatusSnapshot = await get(examstatus);
      if (examstatusSnapshot.val().toLowerCase() === "completed" || (statusRefSnapshot.exists() && statusRefSnapshot.val() === "completed")) {

        const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}/status`);
        await set(statusRef, "completed");

        setStage("completed");
        fetchResults();
        return;
      }
      console.log("2 my block")
      setStage("blocked");
      await set(statusRef, "blocked");


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
                  onClick={openPermissionModal}
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
            onExamComplete={markExamCompleted}
            startTime={startTime}
            duration={duration}
            examName={examName}
            videoRef={videoRef}
            detections={detections}
            isProctoringActive={!!proctorStreamRef.current}
          />
        </>
      )}

      {stage === "warning" && (
        <>
          <FullscreenTracker violation={violation} setviolation={setviolation} testid={testid} isViolationReady={isViolationReady} />
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-3xl mx-auto p-8 rounded-xl shadow-lg bg-white dark:bg-gray-800 text-center space-y-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{examName}</h1>
              {/* <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">{Questions.length} {Questions[0].type} questions, {violation} violations</p> */}
              <p className="text-sm text-gray-500">You exited fullscreen mode. Please return to fullscreen to continue your test.</p>
              <button
                onClick={openPermissionModal}
                className="px-6 py-3 rounded-md font-semibold text-white transition-colors bg-red-600 hover:bg-red-700"
              >
                Return to Fullscreen
              </button>
            </div>
          </div>
        </>
      )}

      {stage === "resume" && (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
          <div className="w-full max-w-lg mx-auto">
            {/* Main Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              
              {/* Header with Icon */}
              <div className="bg-yellow-50 dark:bg-yellow-900/10 px-6 py-8 border-b border-yellow-100 dark:border-yellow-900/20">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Exam Paused</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{examName}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6">
                {/* User Info */}
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-white">{user?.name || 'User'}</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Your exam has been paused. Click below to resume and continue from where you left off.
                  </p>
                </div>

                {/* Exam Details */}
                {configdata && Object.entries(configdata).some(([_, count]) => count > 0) && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-3">Exam Information</p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(configdata).map(([type, count]) => (
                        count > 0 && (
                          <div key={type} className="bg-gray-50 dark:bg-gray-900/50 rounded-md px-3 py-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{type.toLowerCase()}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{count} {count === 1 ? 'Q' : 'Qs'}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Resume Button */}
                <div className="pt-4">
                  <button
                    onClick={openPermissionModal}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Resume Exam</span>
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Your progress has been saved
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === "blocked" && (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
          <div className="w-full max-w-lg mx-auto">
            {/* Main Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              
              {/* Header with Icon */}
              <div className="bg-red-50 dark:bg-red-900/10 px-6 py-8 border-b border-red-100 dark:border-red-900/20">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Access Restricted</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{examName}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-4">
                {/* User Message */}
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium text-gray-900 dark:text-white">{user?.name || 'User'}</span>,
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Your access to this exam has been restricted due to violation of exam policies.
                  </p>
                </div>

                {/* Reason Box */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border-l-4 border-red-500">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Reason:</span> Maximum allowed violations exceeded
                  </p>
                </div>

                {/* Exam Details (if available) */}
                {configdata && Object.entries(configdata).some(([_, count]) => count > 0) && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-3">Exam Information</p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(configdata).map(([type, count]) => (
                        count > 0 && (
                          <div key={type} className="bg-gray-50 dark:bg-gray-900/50 rounded-md px-3 py-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{type.toLowerCase()}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{count} {count === 1 ? 'Q' : 'Qs'}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-2">Next Steps</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Please contact your administrator or exam coordinator for assistance.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Need help?</span>
                  <a href="mailto:support@algocore.com" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    support@algocore.com
                  </a>
                </div>
              </div>
            </div>

            {/* Back to Dashboard Link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => window.location.href = '/'}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === "completed" && (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
          <div className="w-full max-w-2xl mx-auto">
            {/* Main Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              
              {/* Header */}
              <div className="bg-green-50 dark:bg-green-900/10 px-6 py-8 border-b border-green-100 dark:border-green-900/20">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Exam Completed</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{examName}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6">
                {/* User Greeting */}
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    Congratulations <span className="font-medium text-gray-900 dark:text-white">{user?.name || 'User'}</span>!
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    You have successfully completed the exam. Your results are shown below.
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
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-4">Your Results</p>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg px-4 py-3 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Score</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {results.score}%
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg px-4 py-3 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Correct</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {results.correctCount}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg px-4 py-3 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {results.totalQuestions}
                      </p>
                    </div>
                  </div>

                  {results.questions && results.questions.length > 0 && (
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-3">Question Breakdown</p>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {results.questions.map((q, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Q{index + 1}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {q.type} • {q.mark || 0} pts
                              </p>
                            </div>
                            <span 
                              className={`ml-2 px-3 py-1 text-xs font-medium rounded-full ${
                                q.correct
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : q.mark > 0 
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' 
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              }`}
                            >
                              {q.correct ? '✓' : q.mark > 0 ? '~' : '✗'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Exam Info */}
                {configdata && Object.entries(configdata).some(([_, count]) => count > 0) && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-3">Exam Summary</p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(configdata).map(([type, count]) => (
                        count > 0 && (
                          <div key={type} className="bg-gray-50 dark:bg-gray-900/50 rounded-md px-3 py-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{type.toLowerCase()}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{count} {count === 1 ? 'Q' : 'Qs'}</p>
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
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  View detailed results anytime in your dashboard
                </p>
              </div>
            </div>

            {/* Back to Dashboard Link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => window.location.href = '/'}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {showPermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 animate-slideUp">
            {/* Header with gradient */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Hardware & AI Verification
              </h2>
              <p className="text-blue-100 text-sm mt-1">Please verify your devices and AI model before starting</p>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between max-w-md mx-auto">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${camOK ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                    {camOK ? '✓' : '1'}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Camera</span>
                </div>
                <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${camOK ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${micOK ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                    {micOK ? '✓' : '2'}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Microphone</span>
                </div>
                <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${modelReady ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${modelReady ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                    {modelReady ? '✓' : '3'}
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">AI Model</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Camera Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Camera Device
                    </label>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${camOK ? 'bg-green-100 text-green-700' : camOK === false ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {camOK ? '✓ Active' : camOK === false ? '✗ Blocked' : '⏳ Pending'}
                    </div>
                  </div>
                  
                  {videoDevices.length > 0 && (
                    <select 
                      value={selectedVideoDevice} 
                      onChange={(e) => { setSelectedVideoDevice(e.target.value); setTimeout(startPermissionCheck, 100); }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      {videoDevices.map((device, idx) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="relative aspect-video w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden shadow-inner border-2 border-gray-700">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    {isChecking && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="text-white text-center">
                          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-sm">Initializing camera...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Microphone Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      Microphone Device
                    </label>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${micOK ? 'bg-green-100 text-green-700' : micOK === false ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {micOK ? '✓ Active' : micOK === false ? '✗ Blocked' : '⏳ Pending'}
                    </div>
                  </div>

                  {audioDevices.length > 0 && (
                    <select 
                      value={selectedAudioDevice} 
                      onChange={(e) => { setSelectedAudioDevice(e.target.value); setTimeout(startPermissionCheck, 100); }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      {audioDevices.map((device, idx) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Audio Level</p>
                      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center px-3 overflow-hidden relative">
                        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-green-600 rounded-lg transition-all duration-150 ease-out" style={{ width: `${audioLevel}%` }}></div>
                        <div className="relative z-10 flex items-center gap-1">
                          {[...Array(10)].map((_, i) => (
                            <div key={i} className={`w-1.5 h-${i < Math.floor(audioLevel / 10) ? '8' : '3'} rounded-full transition-all ${i < Math.floor(audioLevel / 10) ? 'bg-white' : 'bg-gray-400'}`}></div>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">Speak to test your microphone</p>
                    </div>

                    {/* AI Model Status */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        AI Proctoring Model
                      </p>
                      <div className="flex items-center gap-3">
                        {aiLoading && (
                          <>
                            <div className="relative w-10 h-10">
                              <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-700 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Loading AI model...</p>
                              <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse" style={{width: '70%'}}></div>
                              </div>
                            </div>
                          </>
                        )}
                        {aiError && (
                          <div className="flex items-center gap-2 text-red-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Error: {aiError}</span>
                          </div>
                        )}
                        {modelReady && (
                          <div className="flex items-center gap-2 text-green-600">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-semibold">AI Model Ready</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {permError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 text-red-700 dark:text-red-300">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium">{permError}</p>
                </div>
              )}

              {/* Success Message */}
              {camOK && micOK && modelReady && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg flex items-center gap-3 animate-fadeIn">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-800 dark:text-green-200">All Systems Ready!</p>
                    <p className="text-xs text-green-700 dark:text-green-300">Your camera, microphone, and AI model are functioning correctly.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-3">
              <button 
                onClick={startPermissionCheck} 
                disabled={isChecking} 
                className="px-4 py-2 text-sm font-medium border-2 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isChecking ? "Testing..." : "Re-test Devices"}
              </button>
              
              <div className="flex gap-3">
                <button 
                  onClick={closePermissionModal} 
                  className="px-5 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={continueAfterPermissions} 
                  disabled={!camOK || !micOK || !modelReady} 
                  className="px-6 py-2 text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Start Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicExam;