import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ref, onValue, set, remove, push } from 'firebase/database';
import { database } from '../../firebase';
import {
  FiVideoOff, FiVolume2, FiVolumeX, FiMaximize2, FiRefreshCw,
  FiMonitor, FiUser, FiMic, FiMicOff,
} from 'react-icons/fi';

/* ─────────────────────────────────────────────────────────────────────────────
   ADMIN-TALK HOOK
   Opens a mic → sends audio to one student via Firebase signalling path:
     AdminAudio/{testid}/{studentId}/admin/{adminId}  ← presence
     AdminAudio/{testid}/{studentId}/offers/{adminId} ← SDP offer
     AdminAudio/{testid}/{studentId}/answers/{adminId}← SDP answer
     AdminAudio/{testid}/{studentId}/ice/{adminId}/admin|student ← ICE
   The student side (useAdminAudioReceiver) already handles the receiving end.
───────────────────────────────────────────────────────────────────────────── */
const useAdminTalk = (testid, studentId) => {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const adminIdRef = useRef(null);
  const unsubscribersRef = useRef([]);
  // ICE candidate queue – hold candidates until remote description is set
  const iceCandidateQueueRef = useRef([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [talkStatus, setTalkStatus] = useState('idle'); // idle | connecting | connected | error

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 5,
    sdpSemantics: 'unified-plan',
  };

  const stopTalking = useCallback(async () => {
    unsubscribersRef.current.forEach(u => typeof u === 'function' && u());
    unsubscribersRef.current = [];
    iceCandidateQueueRef.current = [];

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    if (testid && studentId) {
      await remove(ref(database, `AdminAudio/${testid}/${studentId}/admin/${adminIdRef.current}`)).catch(() => {});
      await remove(ref(database, `AdminAudio/${testid}/${studentId}/offers/${adminIdRef.current}`)).catch(() => {});
      await remove(ref(database, `AdminAudio/${testid}/${studentId}/answers/${adminIdRef.current}`)).catch(() => {});
      await remove(ref(database, `AdminAudio/${testid}/${studentId}/ice/${adminIdRef.current}`)).catch(() => {});
    }

    setIsSpeaking(false);
    setTalkStatus('idle');
  }, [testid, studentId]);

  const startTalking = useCallback(async () => {
    if (isSpeaking) {
      await stopTalking();
      return;
    }

    try {
      setTalkStatus('connecting');
      iceCandidateQueueRef.current = [];
      adminIdRef.current = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(rtcConfig);
      pcRef.current = pc;

      // Add mic audio track
      stream.getAudioTracks().forEach(track => {
        track.enabled = true;
        pc.addTrack(track, stream);
      });

      // ICE candidates → Firebase
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          const candidateRef = push(ref(database, `AdminAudio/${testid}/${studentId}/ice/${adminIdRef.current}/admin`));
          set(candidateRef, e.candidate.toJSON()).catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setTalkStatus('connected');
        } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          setTalkStatus('error');
          stopTalking();
        }
      };

      // Create and send offer
      const offer = await pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
      await pc.setLocalDescription(offer);

      await set(ref(database, `AdminAudio/${testid}/${studentId}/offers/${adminIdRef.current}`), {
        sdp: offer.sdp,
        type: offer.type,
        timestamp: Date.now(),
      });

      // Register admin presence AFTER offer is stored
      await set(ref(database, `AdminAudio/${testid}/${studentId}/admin/${adminIdRef.current}`), {
        active: true,
        timestamp: Date.now(),
      });

      // Listen for student answer
      const answerRef = ref(database, `AdminAudio/${testid}/${studentId}/answers/${adminIdRef.current}`);
      const unsubAnswer = onValue(answerRef, async (snap) => {
        const answer = snap.val();
        if (!answer?.sdp) return;
        if (pc.signalingState === 'have-local-offer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            // Drain queued ICE candidates
            for (const c of iceCandidateQueueRef.current) {
              try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
            }
            iceCandidateQueueRef.current = [];
          } catch (err) {
            console.error('[AdminTalk] Error setting answer:', err);
          }
        }
      });

      // Listen for student ICE candidates – queue if remoteDescription not ready yet
      const studentIceRef = ref(database, `AdminAudio/${testid}/${studentId}/ice/${adminIdRef.current}/student`);
      const unsubIce = onValue(studentIceRef, (snap) => {
        const candidates = snap.val();
        if (!candidates) return;
        Object.values(candidates).forEach(async (c) => {
          if (!c) return;
          try {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            } else {
              iceCandidateQueueRef.current.push(c);
            }
          } catch (_) {}
        });
      });

      unsubscribersRef.current.push(unsubAnswer, unsubIce);
      setIsSpeaking(true);
    } catch (err) {
      console.error('[AdminTalk] Error starting:', err);
      setTalkStatus('error');
      await stopTalking();
    }
  }, [isSpeaking, testid, studentId, stopTalking]);

  // Cleanup on unmount
  useEffect(() => () => { stopTalking(); }, [stopTalking]);

  return { isSpeaking, talkStatus, startTalking, stopTalking };
};

/* ─────────────────────────────────────────────────────────────────────────────
   SINGLE STUDENT STREAM CARD
───────────────────────────────────────────────────────────────────────────── */
const StudentStreamCardV2 = ({ testid, userId, userName, userEmail }) => {
  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const audioElementRef = useRef(null); // Separate <audio> for student mic audio (unmuted)
  const peerConnectionRef = useRef(null);
  const [cameraConnected, setCameraConnected] = useState(false);
  const [screenConnected, setScreenConnected] = useState(false);
  const [audioConnected, setAudioConnected] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(true);  // student mic → admin
  // Keep a ref in sync so assignStream's closure always sees the latest value
  // without triggering a re-initialization of the WebRTC connection
  const isAudioMutedRef = useRef(true);
  const [connectionState, setConnectionState] = useState('new');
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('camera');
  const candidatesQueueRef = useRef([]);
  const adminIdRef = useRef(`admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const isInitializingRef = useRef(false);
  const connectionTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const unsubscribersRef = useRef([]);
  const assignedStreamIdsRef = useRef({ camera: null, screen: null });

  // Admin-talk (admin speaks TO this student)
  const { isSpeaking, talkStatus, startTalking } = useAdminTalk(testid, userId);

  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all',
    sdpSemantics: 'unified-plan',
  };

  /* ── Stream identification ─────────────────────────────────────────────── */
  const isScreenStream = (stream) => {
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      if (typeof videoTrack.getSettings === 'function') {
        const settings = videoTrack.getSettings();
        if (settings.displaySurface) return true;
      }
      const label = videoTrack.label.toLowerCase();
      if (
        label.includes('screen') || label.includes('display') ||
        label.includes('monitor') || label.includes('entire screen') ||
        label.includes('window:')
      ) return true;
    }
    // Screen share streams have no audio
    return stream.getAudioTracks().length === 0 && stream.getVideoTracks().length > 0;
  };

  /* ── Assign incoming stream to the correct video (or audio) element ─────── */
  // NOTE: no state in deps — we read mute state via ref to avoid re-creating
  // this function (which would cascade into re-initializing the WebRTC connection)
  const assignStream = useCallback((stream) => {
    if (!stream?.active) return;
    const streamId = stream.id;

    // Audio-only stream (student mic) → play via <audio> element
    if (stream.getVideoTracks().length === 0 && stream.getAudioTracks().length > 0) {
      if (audioElementRef.current) {
        audioElementRef.current.srcObject = stream;
        audioElementRef.current.play().catch(() => {});
      }
      setAudioConnected(true);
      return;
    }

    if (
      assignedStreamIdsRef.current.camera === streamId ||
      assignedStreamIdsRef.current.screen === streamId
    ) return;

    if (isScreenStream(stream)) {
      if (!assignedStreamIdsRef.current.screen) {
        assignedStreamIdsRef.current.screen = streamId;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
          screenVideoRef.current.play().catch(() => {});
        }
        setScreenConnected(true);
      }
    } else {
      if (!assignedStreamIdsRef.current.camera) {
        assignedStreamIdsRef.current.camera = streamId;
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.muted = true; // always mute video element (avoid echo)
          cameraVideoRef.current.play().catch(() => {});

          // Pipe the mic audio track through a dedicated <audio> element
          if (audioElementRef.current) {
            audioElementRef.current.srcObject = stream;
            audioElementRef.current.play().catch(() => {});
          }
          setAudioConnected(true);
        }
        setCameraConnected(true);
      }
    }
  }, []); // stable — reads mute state via ref only

  /* ── Cleanup ────────────────────────────────────────────────────────────── */
  const cleanupPeerConnection = useCallback(() => {
    if (connectionTimeoutRef.current) { clearTimeout(connectionTimeoutRef.current); connectionTimeoutRef.current = null; }
    if (retryTimeoutRef.current) { clearTimeout(retryTimeoutRef.current); retryTimeoutRef.current = null; }

    unsubscribersRef.current.forEach(u => typeof u === 'function' && u());
    unsubscribersRef.current = [];

    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
    }

    assignedStreamIdsRef.current = { camera: null, screen: null };
    candidatesQueueRef.current = [];
    setCameraConnected(false);
    setScreenConnected(false);
    setAudioConnected(false);
    setConnectionState('closed');
    isInitializingRef.current = false;
  }, []);

  /* ── Initialize peer connection ─────────────────────────────────────────── */
  const initializeConnection = useCallback(async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    setError(null);

    cleanupPeerConnection();
    isInitializingRef.current = true;
    setConnectionState('connecting');

    try {
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      pc.ontrack = (event) => {
        console.log('[Viewer] ontrack', userId, event.track.kind, event.track.label, 'streams:', event.streams.length);
        event.streams.forEach(s => assignStream(s));
        if (event.streams.length === 0) assignStream(new MediaStream([event.track]));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateRef = push(ref(database, `LiveStreams/${testid}/${userId}/ice/${adminIdRef.current}/viewer`));
          set(candidateRef, event.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        setConnectionState(state);
        if (state === 'connected') {
          setError(null);
          isInitializingRef.current = false;
          if (connectionTimeoutRef.current) { clearTimeout(connectionTimeoutRef.current); connectionTimeoutRef.current = null; }
        } else if (state === 'failed') {
          setError('Connection failed. Click Retry.');
          isInitializingRef.current = false;
          pc.close();
        } else if (state === 'disconnected') {
          isInitializingRef.current = false;
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' && typeof pc.restartIce === 'function') pc.restartIce();
      };

      connectionTimeoutRef.current = setTimeout(() => {
        if (pc.connectionState !== 'connected') {
          setError('Connection timed out. Click Retry.');
          isInitializingRef.current = false;
          cleanupPeerConnection();
        }
      }, 30000);

      // Register as viewer
      await set(ref(database, `LiveStreams/${testid}/${userId}/viewers/${adminIdRef.current}`), {
        adminId: adminIdRef.current,
        timestamp: Date.now(),
        type: 'admin',
      });

      // Listen for SDP offer from student
      const offerRef = ref(database, `LiveStreams/${testid}/${userId}/offers/${adminIdRef.current}`);
      const unsubOffer = onValue(offerRef, async (snap) => {
        const data = snap.val();
        if (!data?.sdp || !pc || pc.signalingState === 'closed') return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
          while (candidatesQueueRef.current.length > 0) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidatesQueueRef.current.shift())); } catch (_) {}
          }
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await set(
            ref(database, `LiveStreams/${testid}/${userId}/answers/${adminIdRef.current}`),
            { sdp: answer.sdp, type: answer.type, timestamp: Date.now() }
          );
        } catch (err) {
          console.error('[Viewer] Offer handling error:', err);
          setError('Failed to connect. Click Retry.');
        }
      });

      // Listen for student ICE candidates
      const candRef = ref(database, `LiveStreams/${testid}/${userId}/ice/${adminIdRef.current}/student`);
      const unsubCand = onValue(candRef, (snap) => {
        const cands = snap.val();
        if (!cands || !pc || pc.connectionState === 'closed') return;
        Object.values(cands).forEach(async (c) => {
          if (!c) return;
          try {
            if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(c));
            else candidatesQueueRef.current.push(c);
          } catch (_) {}
        });
      });

      unsubscribersRef.current.push(unsubOffer, unsubCand);
      isInitializingRef.current = false;
    } catch (err) {
      console.error('[Viewer] Init error:', err);
      setError('Failed to start. Click Retry.');
      isInitializingRef.current = false;
    }
  }, [testid, userId, cleanupPeerConnection, assignStream]);

  useEffect(() => {
    const t = setTimeout(initializeConnection, 600);
    return () => { clearTimeout(t); cleanupPeerConnection(); };
  }, [initializeConnection, cleanupPeerConnection]);

  /* ── Audio mute toggle ───────────────────────────────────────────────────── */
  const toggleStudentAudio = () => {
    const newMuted = !isAudioMuted;
    isAudioMutedRef.current = newMuted; // keep ref in sync first
    setIsAudioMuted(newMuted);
    // When unmuting, force a play attempt in case autoplay was blocked
    if (!newMuted && audioElementRef.current) {
      audioElementRef.current.play().catch(() => {});
    }
  };

  const toggleFullscreen = () => {
    const vid = activeView === 'camera' ? cameraVideoRef.current : screenVideoRef.current;
    if (vid?.requestFullscreen) vid.requestFullscreen();
  };

  const retry = () => {
    if (isInitializingRef.current) return;
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    retryTimeoutRef.current = setTimeout(initializeConnection, 800);
  };

  const statusDot = () => {
    switch (connectionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'failed': case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const anyVideoConnected = cameraConnected || screenConnected;

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700">
      {/* ── Video area ────────────────────────────────────────────────────── */}
      <div className="relative aspect-video bg-black">
        {/* Camera video – always muted here; audio goes to <audio> element */}
        <video
          ref={cameraVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${activeView === 'screen' ? 'hidden' : ''}`}
        />

        {/* Screen share video */}
        <video
          ref={screenVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain bg-black ${activeView === 'camera' ? 'hidden' : ''}`}
        />

        {/* Audio stream for student mic */}
        <audio
          ref={audioElementRef}
          autoPlay
          playsInline
          muted={isAudioMuted}
          className="hidden"
        />

        {/* Not connected overlay */}
        {!anyVideoConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800/90">
            {error ? (
              <>
                <FiVideoOff className="text-red-400 text-4xl mb-2" />
                <p className="text-red-400 text-sm mb-3 text-center px-4">{error}</p>
                <button onClick={retry} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm">
                  <FiRefreshCw size={14} /> Retry
                </button>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3" />
                <p className="text-gray-400 text-sm">
                  {connectionState === 'connecting' ? 'Connecting…' : 'Waiting for student stream…'}
                </p>
              </>
            )}
          </div>
        )}

        {/* View toggle buttons */}
        {anyVideoConnected && (
          <div className="absolute top-2 left-2 flex gap-1">
            {cameraConnected && (
              <button onClick={() => setActiveView('camera')}
                className={`p-1.5 rounded transition-colors ${activeView === 'camera' ? 'bg-blue-600 text-white' : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600'}`}
                title="Camera View"
              ><FiUser size={14} /></button>
            )}
            {screenConnected && (
              <button onClick={() => setActiveView('screen')}
                className={`p-1.5 rounded transition-colors ${activeView === 'screen' ? 'bg-blue-600 text-white' : 'bg-gray-700/80 text-gray-300 hover:bg-gray-600'}`}
                title="Screen Share"
              ><FiMonitor size={14} /></button>
            )}
          </div>
        )}

        {/* Admin is speaking indicator */}
        {isSpeaking && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-blue-600/90 text-white text-xs px-2 py-1 rounded-full animate-pulse">
            <FiMic size={11} /> Speaking…
          </div>
        )}

        {/* Connection state dot */}
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${statusDot()} ${anyVideoConnected ? 'animate-pulse' : ''}`} />
      </div>

      {/* ── Student info + controls ──────────────────────────────────────── */}
      <div className="p-3 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{userName}</p>
            <p className="text-gray-400 text-xs truncate">{userEmail}</p>
            <div className="mt-1 flex gap-2 text-xs">
              {cameraConnected && <span className="text-green-400">📷 Camera</span>}
              {screenConnected && <span className="text-blue-400">🖥️ Screen</span>}
              {audioConnected && (
                <span className={isAudioMuted ? 'text-gray-500' : 'text-yellow-400'}>
                  {isAudioMuted ? '🔇 Mic (muted)' : '🎙️ Mic (live)'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            {/* Student mic audio toggle */}
            <button
              onClick={toggleStudentAudio}
              title={isAudioMuted ? 'Unmute student mic' : 'Mute student mic'}
              className={`p-2 rounded-md transition-colors ${isAudioMuted ? 'bg-gray-700 hover:bg-gray-600 text-gray-400' : 'bg-yellow-600 hover:bg-yellow-700 text-white'}`}
            >
              {isAudioMuted ? <FiVolumeX size={15} /> : <FiVolume2 size={15} />}
            </button>

            {/* Admin talk to student */}
            <button
              onClick={startTalking}
              title={isSpeaking ? 'Stop speaking to student' : 'Speak to student'}
              className={`p-2 rounded-md transition-colors ${
                isSpeaking
                  ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                  : talkStatus === 'error'
                  ? 'bg-red-700 hover:bg-red-800 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {isSpeaking ? <FiMicOff size={15} /> : <FiMic size={15} />}
            </button>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} title="Fullscreen" className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors">
              <FiMaximize2 size={15} />
            </button>

            {/* Retry on error */}
            {(error || connectionState === 'disconnected' || connectionState === 'failed') && (
              <button onClick={retry} title="Retry Connection" className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors">
                <FiRefreshCw size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-1.5 text-xs text-gray-500">
          Status: <span className={`font-medium ${anyVideoConnected ? 'text-green-400' : 'text-yellow-400'}`}>{connectionState}</span>
          {talkStatus !== 'idle' && (
            <span className={`ml-3 font-medium ${talkStatus === 'connected' ? 'text-blue-400' : talkStatus === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
              Talk: {talkStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT – All live streams for an exam
───────────────────────────────────────────────────────────────────────────── */
const LiveStreamViewerV2 = ({ testid }) => {
  const [activeStreams, setActiveStreams] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!testid) return;

    const streamsRef = ref(database, `LiveStreams/${testid}`);
    const unsubStreams = onValue(streamsRef, (snap) => {
      const streams = snap.val();
      if (streams) {
        setActiveStreams(Object.keys(streams).filter(uid => streams[uid]?.active === true));
      } else {
        setActiveStreams([]);
      }
      setIsLoading(false);
    });

    const usersRef = ref(database, 'users');
    const unsubUsers = onValue(usersRef, (snap) => {
      const d = snap.val();
      if (d) setUsers(d);
    });

    return () => { unsubStreams(); unsubUsers(); };
  }, [testid]);

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  );

  if (activeStreams.length === 0) return (
    <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
      <FiVideoOff className="text-gray-500 text-5xl mx-auto mb-4" />
      <p className="text-gray-400 text-lg">No active livestreams</p>
      <p className="text-gray-500 text-sm mt-2">Students will appear here when they start their exam</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">
          Live Camera &amp; Screen Feeds ({activeStreams.length})
        </h3>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Live</span>
          </div>
          <p className="text-xs text-gray-500">Click 🔇 to unmute mic · Click 🎙️ to speak to student</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activeStreams.map(uid => (
          <StudentStreamCardV2
            key={uid}
            testid={testid}
            userId={uid}
            userName={users[uid]?.name || 'Unknown Student'}
            userEmail={users[uid]?.email || 'No email'}
          />
        ))}
      </div>
    </div>
  );
};

export default LiveStreamViewerV2;
