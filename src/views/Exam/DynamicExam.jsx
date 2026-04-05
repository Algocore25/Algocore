import React, { useState, useEffect, useRef, useCallback } from "react";
import Exam2 from "./Exam2";
import { database } from "../../firebase";
import { ref, get, set, child, push } from "firebase/database";
import { useParams } from 'next/navigation';

import { useAuth } from "../../context/AuthContext";
import { usePersonDetection } from "../../LiveProctoring/hooks/usePersonDetection";
import { useWebRTCStream } from "../../LiveProctoring/hooks/useWebRTCStreamV2";
import { useAdminAudioReceiver } from "../../LiveProctoring/hooks/useAdminAudioReceiver";
import { useExamRecorder } from "../../LiveProctoring/hooks/useExamRecorder";
import { VideoCanvas } from "../../LiveProctoring/components/VideoCanvas";
import { toast } from "react-hot-toast";

import FullscreenTracker from "../FullscreenTracker";
import LoadingPage from "../LoadingPage";
import { User, Clock, FileText, CheckCircle2, ShieldAlert, BadgeInfo, Cpu, Maximize, AlertTriangle, Monitor, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [proctorStream, setProctorStream] = useState(null);
  const screenStreamRef = useRef(null);
  const [screenStream, setScreenStream] = useState(null);
  const [needsScreenShare, setNeedsScreenShare] = useState(false);
  const noPersonStartTime = useRef(null);
  const multiPersonStartTime = useRef(null);
  const mobilePhoneStartTime = useRef(null);
  const violationTriggered = useRef({ noPerson: false, multiPerson: false, mobilePhone: false });
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");
  const [proctorSettings, setProctorSettings] = useState({
    enableVideoProctoring: true,
    enableFullscreen: true,
    blockOnViolations: false,
    maxViolationCount: 3
  });

  const { detectObjects, isLoading: aiLoading, error: aiError, modelReady } = usePersonDetection();

  const { testid } = useParams();

  const { user } = useAuth();

  // WebRTC livestream to admin - use state instead of ref with dual streams (camera + screen)
  const { isStreaming, connectionStatus, activeConnections } = useWebRTCStream(
    testid,
    user?.uid,
    proctorStream,
    screenStream,
    stage === "exam" && proctorSettings.enableVideoProctoring
  );

  // Admin audio receiver - allows admin to speak to this student
  // Active at any time after permissions are granted (not just during exam)
  const { isReceivingAudio, adminConnectionStatus } = useAdminAudioReceiver(
    testid,
    user?.uid,
    permVerified && (stage === "exam" || stage === "instructions" || stage === "resume") // Allow admin audio after permissions granted
  );

  // Session recording - saves chunks to Azure and URLs to Firebase
  const { startRecording, stopRecording } = useExamRecorder(
    testid,
    user?.uid,
    proctorStream,
    screenStream,
    stage === "exam"
  );

  const [examName, setExamName] = useState(null);
  const [results, setResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    console.log(isViolationReady);
  }, [isViolationReady]);

  // Debug logging for streaming
  useEffect(() => {
    console.log('[DynamicExam] Streaming status:', {
      isStreaming,
      connectionStatus,
      activeConnections,
      hasProctorStream: !!proctorStream,
      stage,
      enableVideoProctoring: proctorSettings.enableVideoProctoring
    });
  }, [isStreaming, connectionStatus, activeConnections, proctorStream, stage, proctorSettings.enableVideoProctoring]);

  // Debug logging for admin audio
  useEffect(() => {
    console.log('[DynamicExam] Admin audio status:', {
      isReceivingAudio,
      adminConnectionStatus,
      permVerified,
      stage,
      userId: user?.uid,
      testid
    });
  }, [isReceivingAudio, adminConnectionStatus, permVerified, stage, user?.uid, testid]);

  // Function to check exam status
  const checkExamStatus = async (allowResume = true) => {
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

      if (examstatus.val()?.toLowerCase() === "completed") {
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
          // Only trigger resume screen if allowed and not already in exam view
          if (allowResume && stage !== "exam") {
            setStage("resume");
          }
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

  // --- Handle detection and violations ---
  const handleDetection = useCallback(async (personCount, mobileCount) => {
    const now = Date.now();

    if (personCount === 0) {
      if (!noPersonStartTime.current) {
        noPersonStartTime.current = now;
        violationTriggered.current.noPerson = false;
      } else {
        const duration = (now - noPersonStartTime.current) / 1000;
        if (duration >= 5 && !violationTriggered.current.noPerson) {
          const newViolationCount = (violation || 0) + 1;
          showToastNotification("⚠️ No person detected for 5 seconds - Violation recorded");

          // Show detailed toast with violation count
          toast(`🚨 Violation ${newViolationCount}/${proctorSettings.maxViolationCount}: No person detected for 5 seconds`, {
            duration: 3000,
            icon: '⚠️',
            style: {
              background: '#ef4444',
              color: 'white',
            },
          });

          setviolation(prev => (prev || 0) + 1);
          logViolation("No Person Detected", {
            duration: `${duration.toFixed(1)} seconds`,
            personCount: 0,
            detectionTime: new Date().toISOString(),
            violationCount: newViolationCount,
            maxViolationCount: proctorSettings.maxViolationCount
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
          const newViolationCount = (violation || 0) + 1;
          showToastNotification(`⚠️ Multiple persons detected for 5 seconds - Violation recorded`);

          // Show detailed toast with violation count
          toast(`🚨 Violation ${newViolationCount}/${proctorSettings.maxViolationCount}: Multiple persons detected for 5 seconds`, {
            duration: 3000,
            icon: '👥',
            style: {
              background: '#ef4444',
              color: 'white',
            },
          });

          setviolation(prev => (prev || 0) + 1);
          logViolation("Multiple Persons Detected", {
            duration: `${duration.toFixed(1)} seconds`,
            personCount: personCount,
            detectionTime: new Date().toISOString(),
            violationCount: newViolationCount,
            maxViolationCount: proctorSettings.maxViolationCount
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

    // --- Mobile Phone Detection Logic (Independent) ---
    if (mobileCount > 0) {
      if (!mobilePhoneStartTime.current) {
        mobilePhoneStartTime.current = now;
        violationTriggered.current.mobilePhone = false;
      } else {
        const duration = (now - mobilePhoneStartTime.current) / 1000;
        if (duration >= 3 && !violationTriggered.current.mobilePhone) {
          const newViolationCount = (violation || 0) + 1;
          showToastNotification(`⚠️ Mobile phone detected - Violation recorded`);

          toast(`🚨 Violation ${newViolationCount}/${proctorSettings.maxViolationCount}: Mobile phone detected in frame`, {
            duration: 3000,
            icon: '📱',
            style: {
              background: '#ef4444',
              color: 'white',
            },
          });

          setviolation(prev => (prev || 0) + 1);
          logViolation("Mobile Phone Detected", {
            duration: `${duration.toFixed(1)} seconds`,
            phoneCount: mobileCount,
            detectionTime: new Date().toISOString(),
            violationCount: newViolationCount,
            maxViolationCount: proctorSettings.maxViolationCount
          });
          violationTriggered.current.mobilePhone = true;
        }
      }
    } else {
      mobilePhoneStartTime.current = null;
      violationTriggered.current.mobilePhone = false;
    }
  }, [stage, showToastNotification, setviolation, violation, proctorSettings.maxViolationCount, logViolation]);

  const runDetection = useCallback(async () => {
    if (!videoRef.current || stage !== "exam" || !proctorStreamRef.current) return;
    const { persons, phones } = await detectObjects(videoRef.current);

    // Show boxes for both persons and phones
    setDetections([...persons, ...phones]);

    const personCount = persons.length;
    const mobileCount = phones.length;

    await handleDetection(personCount, mobileCount);
  }, [detectObjects, stage, handleDetection]);

  useEffect(() => {
    // Only run video proctoring if enabled
    if (stage === "exam" && proctorStreamRef.current && proctorSettings.enableVideoProctoring) {
      if (videoRef.current && proctorStreamRef.current) {
        videoRef.current.srcObject = proctorStreamRef.current;
      }
      // Ensure state is updated for WebRTC streaming
      if (proctorStreamRef.current && !proctorStream) {
        setProctorStream(proctorStreamRef.current);
      }
      if (modelReady) {
        detectionIntervalRef.current = setInterval(runDetection, 1000);
      }
    } else {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      noPersonStartTime.current = null;
      multiPersonStartTime.current = null;
      violationTriggered.current = { noPerson: false, multiPerson: false, mobilePhone: false };
    }
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    };
  }, [stage, modelReady, runDetection, proctorSettings.enableVideoProctoring, proctorStream]);

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
        try { videoRef.current.srcObject = null; } catch (_) { }
      }
      // Cleanup screen share
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
    } catch (_) { }
  };

  const startScreenShare = async () => {
    try {
      console.log('[ScreenShare] Requesting FULLSCREEN capture (entire monitor required)...');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor', // Prefer entire monitor
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: false,
        preferCurrentTab: false // Don't allow just current tab
      });

      console.log('[ScreenShare] Got screen stream with tracks:', stream.getTracks().map(t => `${t.kind}:${t.label}`));

      // Validate that user shared entire screen/monitor, not just a window or tab
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.getSettings) {
        const settings = videoTrack.getSettings();
        console.log('[ScreenShare] Track settings:', settings);

        const displaySurface = settings.displaySurface;
        console.log('[ScreenShare] Display surface:', displaySurface);

        // Check if it's a monitor (entire screen) share
        if (displaySurface === 'window' || displaySurface === 'browser') {
          console.error('[ScreenShare] User shared window/tab instead of full screen. Rejecting...');
          stream.getTracks().forEach(track => track.stop());
          setPermError('❌ You must share your ENTIRE SCREEN (not just a window or tab). Please try again and select "Entire Screen" or "Screen".');
          return false;
        }

        if (displaySurface !== 'monitor') {
          console.warn('[ScreenShare] Display surface is not "monitor", but continuing:', displaySurface);
          // Some browsers might not report 'monitor' exactly, so we'll allow if not window/browser
        }
      }

      screenStreamRef.current = stream;
      setScreenStream(stream);
      setNeedsScreenShare(false);

      // Handle when user stops sharing via browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('[ScreenShare] User stopped screen sharing');
        screenStreamRef.current = null;
        setScreenStream(null);

        // Stay in exam – just show a re-share prompt (no stage change)
        if (stage === 'exam') {
          setNeedsScreenShare(true);
        }
      });

      console.log('[ScreenShare] ✅ Fullscreen sharing validated and started');
      return true;
    } catch (error) {
      console.error('[ScreenShare] Error:', error);
      // User cancelled or error occurred
      if (error.name === 'NotAllowedError') {
        console.log('[ScreenShare] User denied screen share permission');
        setPermError('❌ Screen sharing is REQUIRED for this exam. Please grant permission to share your entire screen.');
      } else if (error.name === 'NotSupportedError') {
        setPermError('❌ Screen sharing is not supported in your browser. Please use Chrome, Edge, or Firefox.');
      } else {
        console.error('[ScreenShare] Screen share error:', error);
        setPermError('❌ Failed to start screen sharing. Please try again.');
      }
      return false;
    }
  };

  // Resume screen share mid-exam (does NOT leave exam stage)
  const resumeScreenShare = async () => {
    const success = await startScreenShare();
    if (success) {
      setNeedsScreenShare(false);
    }
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

      // Enhanced video constraints for better quality
      const videoConstraints = selectedVideoDevice
        ? {
          deviceId: { exact: selectedVideoDevice },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        }
        : {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        };

      const audioConstraints = selectedAudioDevice
        ? {
          deviceId: { exact: selectedAudioDevice },
          echoCancellation: true,
          noiseSuppression: true
        }
        : {
          echoCancellation: true,
          noiseSuppression: true
        };

      const constraints = {
        video: videoConstraints,
        audio: audioConstraints
      };

      console.log('[Camera] Requesting media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[Camera] Got stream with tracks:', stream.getTracks().map(t => `${t.kind}:${t.label}`));

      streamRef.current = stream;
      if (videoRef.current) {
        try { videoRef.current.srcObject = stream; } catch (_) { }
      }
      const vTrack = stream.getVideoTracks()[0];
      const aTrack = stream.getAudioTracks()[0];

      console.log('[Camera] Video track:', vTrack?.label, 'State:', vTrack?.readyState);
      console.log('[Camera] Audio track:', aTrack?.label, 'State:', aTrack?.readyState);

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
      console.error('[Camera] Error:', e);
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
    // Only require camera/mic/AI if video proctoring is enabled
    if (proctorSettings.enableVideoProctoring) {
      if (!camOK || !micOK) {
        setPermError("Please allow both camera and microphone to continue");
        return;
      }
      if (!modelReady) {
        setPermError("AI model is still loading. Please wait...");
        return;
      }
    }
    // Save stream for proctoring but DON'T stop tracks
    proctorStreamRef.current = streamRef.current;
    setProctorStream(streamRef.current); // Update state to trigger WebRTC hook

    // Request screen sharing (REQUIRED for video proctoring - must share full screen)
    if (proctorSettings.enableVideoProctoring) {
      const screenShareSuccess = await startScreenShare();
      if (!screenShareSuccess) {
        // Screen share failed or user didn't share full screen - don't allow exam entry
        setPermError('❌ You must share your ENTIRE SCREEN to proceed with this exam. Click "Start Permission Check" to try again.');
        return; // Block exam entry
      }
    }

    // All permissions verified
    setPermVerified(true);

    // Keep video reference but don't cleanup
    setShowPermModal(false);

    const enterFullscreen = async () => {
      const element = containerRef.current || document.documentElement;
      try {
        if (element.requestFullscreen) return await element.requestFullscreen();
        // @ts-ignore - vendor prefixes for Safari/IE11
        if (element.webkitRequestFullscreen) return await element.webkitRequestFullscreen();
        // @ts-ignore
        if (element.msRequestFullscreen) return await element.msRequestFullscreen();
      } catch (err) {
        console.error("Fullscreen request failed:", err);
      }
    };

    const previousStage = stage;

    try {
      // Enter fullscreen first, then immediately show exam UI
      await enterFullscreen();

      // Ensure startTime is present locally before rendering Exam2 to avoid UI glitches
      if (!startTime) {
        const provisionalStart = new Date().toISOString();
        setStartTime(provisionalStart);
      }
      setStage("exam");

      // Perform status checks/writes in background without delaying UI
      (async () => {
        if (previousStage === "resume" || previousStage === "warning") {
          const isCompleted = await checkExamStatus(false);
          if (isCompleted) return; // checkExamStatus will set stage accordingly
          // already showing exam
        } else {
          const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}`);
          const statusSnapshot = await get(statusRef);
          if (statusSnapshot.exists()) {
            const data = statusSnapshot.val();
            if (data?.status === "completed" || data?.completed === true) {
              // If already completed, reflect that
              setStage("completed");
              return;
            }
          }
          if (!statusSnapshot.exists() || !statusSnapshot.val()?.startTime) {
            const timeToPersist = startTime || new Date().toISOString();
            await set(ref(database, `Exam/${testid}/Properties/Progress/${user.uid}`), {
              startTime: timeToPersist,
              status: "started"
            });
            if (!startTime) setStartTime(timeToPersist);
          }
        }
      })();
    } catch (error) {
      console.error("Failed to enter fullscreen:", error);
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

      // Check if the exam should be blocked (only if blockOnViolations is enabled)
      if (proctorSettings.blockOnViolations && violation >= proctorSettings.maxViolationCount && currstageSnapshot.val() != "completed") {
        console.log('🚫 Blocking exam - Conditions met:', {
          blockOnViolations: proctorSettings.blockOnViolations,
          violation: violation,
          maxViolationCount: proctorSettings.maxViolationCount,
          currentStage: currstageSnapshot.val(),
          condition: violation >= proctorSettings.maxViolationCount
        });

        // Show blocking toast
        toast(`🚫 Exam Blocked! You have reached ${violation} violations (limit: ${proctorSettings.maxViolationCount})`, {
          duration: 3000,
          icon: '🚫',
          style: {
            background: '#ef4444',
            color: 'white',
          },
        });

        // Immediately block the exam without waiting
        console.log('🔒 Immediately blocking exam...');
        setStage("blocked");

        // Also update Firebase in the background
        markExamBlocked();

        // Prevent further execution
        return;
      } else if (proctorSettings.blockOnViolations && violation >= proctorSettings.maxViolationCount - 1 && currstageSnapshot.val() != "completed") {
        // Show warning when close to limit
        const remaining = proctorSettings.maxViolationCount - violation;
        console.log('⚠️ Warning - Close to limit:', {
          violation: violation,
          maxViolationCount: proctorSettings.maxViolationCount,
          remaining: remaining
        });

        toast(`⚠️ Warning: Only ${remaining} violation(s) remaining before exam is blocked!`, {
          duration: 3000,
          icon: '⚠️',
          style: {
            background: '#f59e0b',
            color: 'white',
          },
        });
      } else {
        console.log('✅ No blocking needed:', {
          blockOnViolations: proctorSettings.blockOnViolations,
          violation: violation,
          maxViolationCount: proctorSettings.maxViolationCount,
          currentStage: currstageSnapshot.val()
        });
      }
    };

    saveAndCheckViolations();
  }, [violation, isViolationReady, testid, user, proctorSettings.blockOnViolations, proctorSettings.maxViolationCount]);

  // Immediate blocking check - runs whenever violation count changes
  useEffect(() => {
    const checkImmediateBlocking = async () => {
      if (!isViolationReady || !proctorSettings.blockOnViolations || !testid || !user) return;

      // Get current stage from Firebase
      try {
        const currstage = ref(database, `Exam/${testid}/Properties2/Progress/${user.uid}/stage`);
        const currstageSnapshot = await get(currstage);
        const currentStage = currstageSnapshot.val();

        // If violation count exceeds threshold and exam is not completed, block immediately
        if (violation >= proctorSettings.maxViolationCount && currentStage !== "completed" && stage !== "blocked") {
          console.log('🚨 IMMEDIATE BLOCKING TRIGGERED:', {
            violation: violation,
            maxViolationCount: proctorSettings.maxViolationCount,
            currentStage: currentStage,
            stage: stage
          });

          // Block immediately
          setStage("blocked");

          // Update Firebase
          const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}/status`);
          await set(statusRef, "blocked");

          console.log('✅ Exam immediately blocked due to excessive violations');
        }
      } catch (error) {
        console.error('❌ Error in immediate blocking check:', error);
      }
    };

    checkImmediateBlocking();
  }, [violation, isViolationReady, proctorSettings.blockOnViolations, proctorSettings.maxViolationCount, testid, user, stage]);

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

        // Fetch proctoring settings
        const proctorSettingsRef = ref(database, `Exam/${testid}/proctorSettings`);
        const proctorSettingsSnapshot = await get(proctorSettingsRef);
        if (proctorSettingsSnapshot.exists()) {
          const settings = proctorSettingsSnapshot.val();
          setProctorSettings({
            enableVideoProctoring: settings.enableVideoProctoring === undefined ? true : settings.enableVideoProctoring,
            enableFullscreen: settings.enableFullscreen === undefined ? true : settings.enableFullscreen,
            blockOnViolations: settings.blockOnViolations === true,
            maxViolationCount: settings.maxViolationCount || 3
          });
        }

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

          // Normalize type keys: the admin config uses "nat" for numeric questions,
          // but the global questions collection stores the type as "Numeric".
          // This maps both sides to a common canonical form before comparing.
          const normalizeType = (t) => {
            const lower = (t || '').toLowerCase().trim();
            if (lower === 'nat' || lower === 'numeric') return 'numeric';
            return lower; // mcq, msq, programming, sql stay as-is
          };

          // Create a map to track used question IDs
          const usedQuestionIds = new Set();
          let hasInsufficientQuestions = false;

          // First, validate we have enough questions for each type
          for (const [type, count] of Object.entries(config)) {
            const availableQuestions = questionList
              .filter(([_, qType]) => normalizeType(qType) === normalizeType(type))
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
                  .filter(([_, qType]) => normalizeType(qType) === normalizeType(type))
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
              .filter(([_, qType]) => normalizeType(qType) === normalizeType(type))
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

      // Always enforce fullscreen during exam
      if (!isFullScreen && stage === "exam") {
        // Exit from full screen during exam - check exam status first
        console.log("Exited full screen, checking exam status...");

        const isCompleted = await checkExamStatus();
        if (!isCompleted) {
          // Always show warning when exiting fullscreen
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
        const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}/status`);
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
      // Only require permission modal if video proctoring is enabled
      if (proctorSettings.enableVideoProctoring && !permVerified) {
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

      // Always request fullscreen, but violations only tracked if enabled
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
      // Only require permission modal if video proctoring is enabled
      if (proctorSettings.enableVideoProctoring && !permVerified) {
        openPermissionModal();
        return;
      }
      // Check exam status before returning to full screen
      const isCompleted = await checkExamStatus();
      if (isCompleted) {
        return; // Don't return to exam if it's already completed
      }

      // Always request fullscreen, but violations only tracked if enabled
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
      const questionIds = studentQuestionsSnapshot.val() || [];

      // Get student's answers
      const answersRef = ref(database, `ExamSubmissions/${testid}/${user.uid}`);
      const answersSnapshot = await get(answersRef);
      const answers = answersSnapshot.val() || {};

      const marksRef = ref(database, `Marks/${testid}/${user.uid}`);
      const marksSnapshot = await get(marksRef);
      const marks = marksSnapshot.val() || {};

      // Get global exam status
      const globalStatusRef = ref(database, `Exam/${testid}/Properties/status`);
      const globalStatusSnapshot = await get(globalStatusRef);
      const globalStatus = globalStatusSnapshot.val();

      // Fetch participants and their ranks
      const participantsRef = ref(database, `Exam/${testid}/Participants`);
      const participantsSnapshot = await get(participantsRef);
      const participants = participantsSnapshot.val() || [];

      // Check if results are available immediately or scheduled
      const resultsAvailableRef = ref(database, `Exam/${testid}/Properties/resultsAvailable`);
      const resultsAvailableSnapshot = await get(resultsAvailableRef);
      const resultsAvailable = resultsAvailableSnapshot.val();

      const currentTime = new Date().toISOString();
      const showResults = resultsAvailable === "immediate" || (resultsAvailable && currentTime >= resultsAvailable);

      if (!showResults) {
        setResults({
          message: "Results will be available after the scheduled time.",
        });
        return;
      }

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
        ? Math.round((totalMarks / questionIds.length))
        : 0;

      setResults({
        score,
        correctCount,
        totalQuestions: questionIds.length,
        questions: questionDetails,
        totalMarks,
        globalStatus,
        participants, // Include participants and their ranks
      });
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoadingResults(false);
    }
  };

  const markExamCompleted = async () => {
    try {
      const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}/status`);
      await set(statusRef, "completed");
      setExamStatus("completed");
      setStage("completed");
      fetchResults();
    } catch (error) {
      console.error("Error marking exam as completed:", error);
    }
  };

  // Function to reset violation count (for testing/debugging)
  const resetViolations = async () => {
    try {
      console.log('🔄 Resetting violation count...');
      setviolation(0);

      if (testid && user) {
        const violationRef = ref(database, `Exam/${testid}/Properties2/Progress/${user.uid}`);
        await set(violationRef, 0);
        console.log('✅ Violation count reset in Firebase');
      }
    } catch (error) {
      console.error('❌ Error resetting violations:', error);
    }
  };

  // Function to mark exam as blocked due to violations
  const markExamBlocked = async () => {
    console.log('🔒 markExamBlocked function called');
    try {
      const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}/status`);
      const statusRefSnapshot = await get(statusRef);
      console.log('Current status from Firebase:', statusRefSnapshot.val());

      const examstatus = ref(database, `Exam/${testid}/Properties/status`);
      const examstatusSnapshot = await get(examstatus);
      console.log('Exam status from Firebase:', examstatusSnapshot.val());

      if (examstatusSnapshot.val().toLowerCase() === "completed" || (statusRefSnapshot.exists() && statusRefSnapshot.val() === "completed")) {
        console.log('📝 Exam is already completed, not blocking');
        const statusRef = ref(database, `Exam/${testid}/Properties/Progress/${user.uid}/status`);
        await set(statusRef, "completed");

        setStage("completed");
        fetchResults();
        return;
      }

      console.log('🚫 Setting exam to blocked status');
      console.log("2 my block")
      setStage("blocked");
      await set(statusRef, "blocked");
      console.log('✅ Successfully updated Firebase with blocked status');

    } catch (error) {
      console.error("❌ Error marking exam as blocked:", error);
    }
  };

  return (
    <div ref={containerRef} className="fixed inset-0 top-16 bg-gray-100 dark:bg-gray-900 overflow-hidden flex flex-col z-40">
      {stage === "loading" && (
        <LoadingPage message="Loading exam, please wait..." />
      )}

      {stage === "instructions" && (
        <div className="flex flex-col h-full bg-gradient-to-br from-[#f8fafc] via-white to-[#eff6ff] dark:from-[#0f172a] dark:via-[#020617] dark:to-[#0f172a] relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-15%] right-[-5%] w-[50%] h-[50%] rounded-full bg-blue-500/20 dark:bg-blue-600/10 blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 dark:bg-indigo-600/10 blur-[120px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full flex flex-col z-10 overflow-hidden text-slate-800 dark:text-slate-100"
          >


            <div className="p-5 sm:p-8 lg:p-10 gap-8 sm:gap-12 flex flex-col lg:flex-row flex-1 overflow-y-auto min-h-0 hide-scrollbar">
              {/* Left Column: Exam Info */}
              <div className="lg:w-[35%] space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="px-2"
                >
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
                    <BadgeInfo className="w-6 h-6 text-blue-500" />
                    {examName || 'Assessment Details'}
                  </h2>

                  <div className="space-y-2 mt-8">
                    <div className="group flex items-center py-4 border-b border-slate-200/70 dark:border-slate-700/50">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mr-4">
                        <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Duration</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{duration ? `${Math.floor(duration)} Minutes` : 'Loading...'}</p>
                      </div>
                    </div>

                    <div className="group flex items-center py-4 border-b border-slate-200/70 dark:border-slate-700/50">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mr-4">
                        <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Questions</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{Questions?.length || 0} Questions</p>
                      </div>
                    </div>
                  </div>

                  {configdata && Object.keys(configdata).some(k => configdata[k] > 0) && (
                    <div className="mt-8 pt-4">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-[0.1em]">Question Types</h4>
                      <div className="flex flex-wrap gap-3">
                        {Object.entries(configdata).map(([type, count]) => (
                          count > 0 && (
                            <div key={type} className="flex items-center text-slate-700 dark:text-slate-300">
                              <span className="text-sm font-semibold mr-2">{type}</span>
                              <span className="px-2 py-0.5 text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-lg">
                                {count}
                              </span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Right Column: Instructions list */}
              <div className="lg:w-[65%] space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3"
                  >
                    <ShieldAlert className="w-6 h-6 text-red-500" />
                    Mandatory Rules
                  </motion.h3>

                  <motion.ul
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1, delayChildren: 0.7 }
                      }
                    }}
                    className="space-y-6"
                  >
                    {[
                      {
                        icon: <Maximize className="w-5 h-5" />,
                        title: "Fullscreen Required",
                        desc: "This exam must be taken in full-screen mode. The test will automatically start in full-screen.",
                        color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20", show: true
                      },
                      {
                        icon: <AlertTriangle className="w-5 h-5" />,
                        title: "Violations Tracked",
                        desc: "Exiting full screen will be tracked as a violation. Multiple violations may result in exam termination.",
                        color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20", show: proctorSettings.enableFullscreen
                      },
                      {
                        icon: <Monitor className="w-5 h-5" />,
                        title: "Video Proctoring",
                        desc: "Video proctoring is enabled. Your camera will monitor for multiple persons or no person during the exam.",
                        color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20", show: proctorSettings.enableVideoProctoring
                      },
                      {
                        icon: <Cpu className="w-5 h-5" />,
                        title: "No Exiting or Refreshing",
                        desc: "Do not refresh the page or switch tabs during the exam, as this may be flagged as suspicious activity.",
                        color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20", show: true
                      }
                    ].filter(item => item.show).map((item, index) => (
                      <motion.li
                        key={index}
                        variants={{
                          hidden: { opacity: 0, x: 20 },
                          show: { opacity: 1, x: 0 }
                        }}
                        whileHover={{ x: 5 }}
                        className="flex items-start py-4 group border-b border-slate-200/60 dark:border-slate-700/50 last:border-0"
                      >
                        <div className={`mt-0.5 mr-5 p-2.5 rounded-xl flex-shrink-0 transition-colors duration-300 ${item.bg} ${item.color}`}>
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1.5 transition-colors">{item.title}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                      </motion.li>
                    ))}
                  </motion.ul>
                </div>
                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                  className="pt-6 mt-auto"
                >
                  <button
                    onClick={proctorSettings.enableVideoProctoring ? openPermissionModal : startExam}
                    className="group relative w-full inline-flex items-center justify-center p-0.5 mb-2 overflow-hidden text-base font-bold text-white rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:text-white shadow-xl hover:shadow-indigo-500/30 transition-shadow focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
                  >
                    <span className="relative w-full flex items-center justify-center px-8 py-5 transition-all ease-in duration-75 bg-blue-600 dark:bg-blue-600 rounded-2xl group-hover:bg-opacity-0">
                      <svg className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      I Understand, Start Exam
                    </span>
                  </button>
                  <p className="mt-4 text-sm font-medium text-center text-slate-500 dark:text-slate-400">
                    By clicking start, you agree to comply with all rules and policies.
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {stage === "exam" && (
        <>
          <FullscreenTracker violation={violation} setviolation={setviolation} setIsViolationReady={setIsViolationReady} isViolationReady={isViolationReady} testid={testid} enableViolationTracking={proctorSettings.enableFullscreen} />

          {/* Debug Controls - Only visible in development */}
          {/* {process.env.NODE_ENV === 'development' && (
            <div className="fixed top-4 left-4 z-50 bg-red-500 text-white p-2 rounded-lg shadow-lg">
              <div className="text-xs font-bold mb-2">DEBUG CONTROLS</div>
              <div className="text-xs mb-1">Violations: {violation}/{proctorSettings.maxViolationCount}</div>
              <div className="text-xs mb-1">Stage: {stage}</div>
              <div className="text-xs mb-2">Block Enabled: {proctorSettings.blockOnViolations ? 'Yes' : 'No'}</div>
              <div className="flex gap-2">
                <button
                  onClick={resetViolations}
                  className="text-xs bg-white text-red-500 px-2 py-1 rounded hover:bg-gray-100"
                >
                  Reset Violations
                </button>
                <button
                  onClick={() => setviolation(prev => prev + 1)}
                  className="text-xs bg-white text-red-500 px-2 py-1 rounded hover:bg-gray-100"
                >
                  Add Violation
                </button>
                <button
                  onClick={() => setStage("blocked")}
                  className="text-xs bg-white text-red-500 px-2 py-1 rounded hover:bg-gray-100"
                >
                  Force Block
                </button>
              </div>
            </div>
          )} */}

          <Exam2
            setviolation={setviolation}
            setIsViolationReady={setIsViolationReady}
            Questions={Questions}
            onExamComplete={() => {
              markExamCompleted();
              setStage("completed"); // Ensure stage is updated to completed
            }}
            startTime={startTime}
            duration={duration}
            examName={examName}
            videoRef={videoRef}
            detections={detections}
            isProctoringActive={proctorSettings.enableVideoProctoring && !!proctorStreamRef.current}
          />
          {/* Admin Audio Indicator - shows when admin is speaking */}
          {isReceivingAudio && (
            <div className="fixed top-4 right-4 z-50">
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg bg-blue-600 text-white animate-pulse">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Admin is speaking</span>
              </div>
            </div>
          )}

          {/* Screen sharing stopped – non-blocking overlay prompting re-share */}
          {needsScreenShare && proctorSettings.enableVideoProctoring && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Screen Sharing Stopped</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Screen sharing is required for this exam. Your exam is paused — your progress is safe.
                  Please re-share your screen to continue.
                </p>
                {permError && (
                  <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg p-3">{permError}</p>
                )}
                <button
                  onClick={resumeScreenShare}
                  className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold transition-colors shadow-lg"
                >
                  🖥️ Re-share My Screen &amp; Resume Exam
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {stage === "warning" && (
        <>
          <FullscreenTracker violation={violation} setviolation={setviolation} testid={testid} isViolationReady={isViolationReady} enableViolationTracking={proctorSettings.enableFullscreen} />
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-3xl mx-auto p-8 rounded-xl shadow-lg bg-white dark:bg-gray-800 text-center space-y-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{examName}</h1>
              {/* <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">{Questions.length} {Questions[0].type} questions, {violation} violations</p> */}
              <p className="text-sm text-gray-500">You exited fullscreen mode. Please return to fullscreen to continue your test.</p>
              <button
                onClick={proctorSettings.enableVideoProctoring ? openPermissionModal : returnToFullScreen}
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
                    onClick={proctorSettings.enableVideoProctoring ? openPermissionModal : returnToFullScreen}
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
        <div className="flex flex-col h-full bg-gradient-to-br from-[var(--bg-light-start,var(--tw-gradient-from))] via-[var(--tw-gradient-via,white)] to-[var(--bg-light-end,var(--tw-gradient-to))] dark:from-[#0f172a] dark:via-[#020617] dark:to-[#0f172a] relative overflow-hidden"
          style={{ '--bg-light-start': '#f0fdf4', '--bg-light-end': '#dcfce3' }}>
          {/* Background decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[-15%] right-[-5%] w-[50%] h-[50%] rounded-full bg-green-500/20 dark:bg-green-600/10 blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/20 dark:bg-emerald-600/10 blur-[120px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full flex flex-col z-10 overflow-hidden text-slate-800 dark:text-slate-100"
          >


            {/* Content Area */}
            <div className="p-5 sm:p-8 lg:p-10 gap-8 sm:gap-12 flex flex-col lg:flex-row flex-1 overflow-y-auto min-h-0 hide-scrollbar">
              <div className="w-full max-w-3xl mx-auto space-y-6">

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="bg-white/50 dark:bg-slate-800/40 rounded-3xl p-6 sm:p-8 border border-white/60 dark:border-slate-700/50 shadow-sm backdrop-blur-md text-center"
                >
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                    Congratulations, <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">{user?.name || 'User'}</span>!
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    You have successfully completed the exam. Your results are shown below.
                  </p>
                </motion.div>

                {loadingResults ? (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="py-12 flex flex-col items-center justify-center space-y-4"
                  >
                    <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Calculating your results...</p>
                  </motion.div>
                ) : results ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="space-y-6"
                  >
                    {results.globalStatus === "ResultsPublished" ? (
                      <>
                        {/* Results Summary Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="group flex flex-col items-center justify-center p-6 bg-white/80 dark:bg-slate-900/50 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-900/50">
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-2">Score</p>
                            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-teal-600">
                              {results.score}%
                            </p>
                          </div>
                          <div className="group flex flex-col items-center justify-center p-6 bg-white/80 dark:bg-slate-900/50 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50">
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-2">Correct</p>
                            <p className="text-4xl font-black text-blue-600 dark:text-blue-400">
                              {results.correctCount}
                            </p>
                          </div>
                          <div className="group flex flex-col items-center justify-center p-6 bg-white/80 dark:bg-slate-900/50 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50">
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-2">Total Questions</p>
                            <p className="text-4xl font-black text-slate-800 dark:text-slate-200">
                              {results.totalQuestions}
                            </p>
                          </div>
                        </div>

                        {results.questions && results.questions.length > 0 && (
                          <div className="mt-8 bg-white/50 dark:bg-slate-800/40 rounded-3xl p-6 border border-white/60 dark:border-slate-700/50 shadow-sm backdrop-blur-md">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                              <FileText className="w-5 h-5 text-emerald-500" />
                              Question Breakdown
                            </h3>
                            <div className="max-h-72 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                              {results.questions.map((q, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 transition-colors"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                                      Question {index + 1}
                                    </p>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                      {q.type} • {q.mark || 0} pts
                                    </p>
                                  </div>
                                  <div
                                    className={`flex items-center justify-center w-10 h-10 rounded-full shadow-sm border ${q.correct
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                                      : q.mark > 0
                                        ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'
                                        : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                                      }`}
                                  >
                                    {q.correct ? <CheckCircle2 className="w-6 h-6" /> : q.mark > 0 ? '~' : '✗'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-white/80 dark:bg-slate-900/50 rounded-3xl p-10 shadow-xl border border-blue-100 dark:border-blue-900/30 text-center max-w-2xl mx-auto backdrop-blur-sm">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CheckCircle2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Exam Completed Successfully</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                          Your responses have been securely recorded. Detailed marks and rankings will be available once the results are officially published by your administrator.
                        </p>
                        <div className="inline-flex items-center space-x-3 bg-blue-50 dark:bg-blue-900/20 px-6 py-3 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
                          <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
                          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Results Available Soon</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="py-12 bg-white/50 dark:bg-slate-800/40 rounded-3xl p-8 border border-white/60 dark:border-slate-700/50 text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Unable to load results.</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Please check your dashboard later.</p>
                  </div>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="pt-6 mt-auto text-center"
                >
                  <button
                    onClick={() => window.location.href = '/'}
                    className="group relative inline-flex items-center justify-center p-0.5 mb-2 overflow-hidden text-base font-bold text-white rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 hover:text-white shadow-xl hover:shadow-emerald-500/30 transition-shadow focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:focus:ring-emerald-800 w-full sm:w-auto min-w-[200px]"
                  >
                    <span className="relative w-full flex items-center justify-center px-8 py-4 transition-all ease-in duration-75 bg-emerald-600 dark:bg-emerald-600 rounded-2xl group-hover:bg-opacity-0">
                      ← Back to Dashboard
                    </span>
                  </button>
                  <p className="mt-4 text-sm font-medium text-center text-slate-500 dark:text-slate-400">
                    View detailed results anytime in your dashboard
                  </p>
                </motion.div>

              </div>
            </div>
          </motion.div>
        </div>
      )}

      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl animate-bounce">
          {toastMsg}
        </div>
      )}

      {showPermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden my-4 sm:my-8 max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 bg-blue-600 dark:bg-blue-700 border-b border-blue-700 dark:border-blue-800 flex-shrink-0">
              <h2 className="text-lg sm:text-xl font-semibold text-white">Device Verification & Screen Sharing</h2>
              <p className="text-blue-100 text-xs sm:text-sm mt-1">Verify your camera, microphone, AI model, and enable full screen sharing</p>
            </div>

            {/* Important Notice */}
            <div className="px-4 sm:px-6 py-3 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800 flex-shrink-0">
              <div className="flex items-start gap-2 sm:gap-3">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-800 dark:text-orange-300">
                    ⚠️ IMPORTANT: Share ENTIRE SCREEN
                  </p>
                  <p className="text-[10px] sm:text-xs text-orange-700 dark:text-orange-400 mt-1">
                    Select "Entire Screen" or "Screen". Window/tab sharing will be rejected.
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-x-auto">
              <div className="flex items-center justify-center gap-2 sm:gap-4 min-w-max mx-auto">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold ${camOK ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
                    {camOK ? '✓' : '1'}
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">Camera</span>
                </div>
                <div className={`h-0.5 w-4 sm:w-8 ${camOK ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold ${micOK ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
                    {micOK ? '✓' : '2'}
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">Mic</span>
                </div>
                <div className={`h-0.5 w-4 sm:w-8 ${modelReady ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold ${modelReady ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
                    {modelReady ? '✓' : '3'}
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">AI</span>
                </div>
                <div className={`h-0.5 w-4 sm:w-8 ${screenStream ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold ${screenStream ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
                    {screenStream ? '✓' : '4'}
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">Screen</span>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Camera Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">Camera</label>
                      <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${camOK ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : camOK === false ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {camOK ? '✓ Connected' : camOK === false ? '✗ Blocked' : 'Checking...'}
                      </span>
                    </div>

                    {videoDevices.length > 0 && (
                      <select
                        value={selectedVideoDevice}
                        onChange={(e) => { setSelectedVideoDevice(e.target.value); setTimeout(startPermissionCheck, 100); }}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {videoDevices.map((device, idx) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="relative aspect-video w-full bg-gray-900 rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      {isChecking && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <div className="text-white text-center">
                            <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-sm">Initializing...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Microphone Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">Microphone</label>
                      <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${micOK ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : micOK === false ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {micOK ? '✓ Connected' : micOK === false ? '✗ Blocked' : 'Checking...'}
                      </span>
                    </div>

                    {audioDevices.length > 0 && (
                      <select
                        value={selectedAudioDevice}
                        onChange={(e) => { setSelectedAudioDevice(e.target.value); setTimeout(startPermissionCheck, 100); }}
                        className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {audioDevices.map((device, idx) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    )}

                    <div className="space-y-3">
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Audio Level</p>
                        <div className="h-8 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden relative">
                          <div className="absolute inset-y-0 left-0 bg-green-500 transition-all duration-150" style={{ width: `${audioLevel}%` }}></div>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2">Speak to test microphone</p>
                      </div>

                      {/* AI Model Status */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3 sm:p-4 border border-blue-200 dark:border-blue-800">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">AI Proctoring Model</p>
                        <div className="flex items-center gap-2">
                          {aiLoading && (
                            <>
                              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Loading model...</span>
                            </>
                          )}
                          {aiError && (
                            <>
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs sm:text-sm text-red-600">Error: {aiError}</span>
                            </>
                          )}
                          {modelReady && (
                            <>
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs sm:text-sm text-green-600 font-medium">Model Ready</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {permError && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300">
                    <p className="text-xs sm:text-sm">{permError}</p>
                  </div>
                )}

                {/* Success Message */}
                {camOK && micOK && modelReady && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <p className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-200">✓ All devices ready</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 flex-shrink-0">
              <button
                onClick={startPermissionCheck}
                disabled={isChecking}
                className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isChecking ? "Testing..." : "Retest"}
              </button>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={closePermissionModal}
                  className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={continueAfterPermissions}
                  disabled={proctorSettings.enableVideoProctoring && (!camOK || !micOK || !modelReady)}
                  className="w-full sm:w-auto px-5 py-2 text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
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