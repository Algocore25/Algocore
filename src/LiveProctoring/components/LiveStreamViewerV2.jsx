import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ref, onValue, set, get } from 'firebase/database';
import { database } from '../../firebase';
import { FiVideo, FiVideoOff, FiVolume2, FiVolumeX, FiMaximize2, FiRefreshCw, FiMonitor, FiUser } from 'react-icons/fi';

/**
 * Single student's livestream card – handles both camera and screen-share streams
 * sent by the student through a single WebRTC PeerConnection.
 *
 * The key insight: student adds camera tracks to `cameraStream` and screen tracks
 * to `screenStream`, so each arrives as a separate MediaStream.  We identify
 * which is which by checking whether a stream's video track has a displaySurface
 * setting (screen-share) or not (camera).  If that is unavailable we fall back to
 * label matching.  The FIRST video-only stream defaults to the screen-share and
 * the stream with an audio track defaults to the camera.
 */
const StudentStreamCardV2 = ({ testid, userId, userName, userEmail }) => {
  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [cameraConnected, setCameraConnected] = useState(false);
  const [screenConnected, setScreenConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [connectionState, setConnectionState] = useState('new');
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('camera');
  const candidatesQueueRef = useRef([]);
  const adminIdRef = useRef(`admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const isInitializingRef = useRef(false);
  const connectionTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const unsubscribersRef = useRef([]);
  // Track stream IDs that have been assigned to each video element
  const assignedStreamIdsRef = useRef({ camera: null, screen: null });

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

  /**
   * Determine whether the stream is a screen-share or a camera feed.
   * Priority order:
   *  1. displaySurface setting on the video track (most reliable)
   *  2. Track label containing 'screen', 'display', 'monitor'
   *  3. Stream has NO audio tracks → likely screen-share (camera always has audio)
   */
  const isScreenStream = (stream) => {
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      // Method-based check
      if (typeof videoTrack.getSettings === 'function') {
        const settings = videoTrack.getSettings();
        if (settings.displaySurface) return true; // 'monitor', 'window', 'browser'
      }
      // Label-based check
      const label = videoTrack.label.toLowerCase();
      if (
        label.includes('screen') ||
        label.includes('display') ||
        label.includes('monitor') ||
        label.includes('entire screen') ||
        label.includes('window:')
      ) {
        return true;
      }
    }
    // Audio presence heuristic: camera streams always have audio, screen-shares usually don't
    if (stream.getAudioTracks().length === 0 && stream.getVideoTracks().length > 0) {
      return true;
    }
    return false;
  };

  /**
   * Assign a stream to the correct video element.
   * Uses the stream's own ID so duplicate events are ignored.
   */
  const assignStream = useCallback((stream) => {
    if (!stream || !stream.active) return;

    const streamId = stream.id;

    // Already assigned
    if (
      assignedStreamIdsRef.current.camera === streamId ||
      assignedStreamIdsRef.current.screen === streamId
    ) {
      return;
    }

    const determineAsScreen = isScreenStream(stream);

    if (determineAsScreen) {
      if (!assignedStreamIdsRef.current.screen) {
        console.log('[Viewer] Assigning stream as SCREEN:', streamId);
        assignedStreamIdsRef.current.screen = streamId;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
          screenVideoRef.current.play().catch(() => {});
        }
        setScreenConnected(true);
        setActiveView(prev => (prev === 'camera' ? prev : 'screen'));
      }
    } else {
      if (!assignedStreamIdsRef.current.camera) {
        console.log('[Viewer] Assigning stream as CAMERA:', streamId);
        assignedStreamIdsRef.current.camera = streamId;
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play().catch(() => {});
        }
        setCameraConnected(true);
      }
    }
  }, []);

  // Clean up peer connection
  const cleanupPeerConnection = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    unsubscribersRef.current.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
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

    assignedStreamIdsRef.current = { camera: null, screen: null };
    candidatesQueueRef.current = [];
    setCameraConnected(false);
    setScreenConnected(false);
    setConnectionState('closed');
    isInitializingRef.current = false;
  }, []);

  // Initialize peer connection and request stream from student
  const initializeConnection = useCallback(async () => {
    if (isInitializingRef.current) {
      console.log('[Viewer] Already initializing for', userId);
      return;
    }

    isInitializingRef.current = true;
    setError(null);

    // Fully tear down the previous connection first
    cleanupPeerConnection();

    // cleanupPeerConnection resets the flag; set it again
    isInitializingRef.current = true;
    setConnectionState('connecting');

    try {
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      // ── Handle incoming tracks ──────────────────────────────────────────────
      pc.ontrack = (event) => {
        console.log(
          '[Viewer] ontrack for', userId,
          '| kind:', event.track.kind,
          '| label:', event.track.label,
          '| streams:', event.streams.length
        );

        // Each MediaStream that arrives may be camera OR screen.
        // Try to assign all streams delivered with this track event.
        event.streams.forEach(stream => {
          assignStream(stream);
        });

        // Fallback: if no stream object, wrap the track in a new MediaStream
        if (event.streams.length === 0) {
          const fallbackStream = new MediaStream([event.track]);
          assignStream(fallbackStream);
        }
      };

      // ── ICE candidates ──────────────────────────────────────────────────────
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateRef = ref(
            database,
            `LiveStreams/${testid}/${userId}/ice/${adminIdRef.current}/viewer/${Date.now()}`
          );
          set(candidateRef, event.candidate.toJSON());
        }
      };

      // ── Connection state ────────────────────────────────────────────────────
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log(`[Viewer] Connection state for ${userId}: ${state}`);
        setConnectionState(state);

        if (state === 'connected') {
          setError(null);
          isInitializingRef.current = false;
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
        } else if (state === 'failed') {
          setError('Connection failed. Click Retry.');
          isInitializingRef.current = false;
          pc.close();
        } else if (state === 'disconnected') {
          isInitializingRef.current = false;
        }
      };

      // ── ICE connection state (for additional debug) ─────────────────────────
      pc.oniceconnectionstatechange = () => {
        console.log(`[Viewer] ICE state for ${userId}: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'failed') {
          console.warn('[Viewer] ICE failed – attempting restart');
          if (typeof pc.restartIce === 'function') pc.restartIce();
        }
      };

      // 30-second connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (pc.connectionState !== 'connected') {
          setError('Connection timed out. Click Retry.');
          isInitializingRef.current = false;
          cleanupPeerConnection();
        }
      }, 30000);

      // Register ourselves as an active viewer
      const viewerRef = ref(database, `LiveStreams/${testid}/${userId}/viewers/${adminIdRef.current}`);
      await set(viewerRef, {
        adminId: adminIdRef.current,
        timestamp: Date.now(),
        type: 'admin',
      });

      // ── Listen for SDP offer from student ──────────────────────────────────
      const offerRef = ref(database, `LiveStreams/${testid}/${userId}/offers/${adminIdRef.current}`);
      const unsubscribeOffer = onValue(offerRef, async (snapshot) => {
        const data = snapshot.val();
        if (!data || !data.sdp) return;
        if (!pc || pc.signalingState === 'closed') return;
        // Only process if we haven't already set a remote description
        if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-remote-offer') {
          // Already processing or have-local-offer (student re-sent) – safe to proceed
        }

        try {
          console.log('[Viewer] Received offer from student:', userId);
          await pc.setRemoteDescription(new RTCSessionDescription(data));

          // Drain queued ICE candidates
          while (candidatesQueueRef.current.length > 0) {
            const candidate = candidatesQueueRef.current.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              // Ignore — some candidates are expected to fail after connection
            }
          }

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          const answerRef = ref(
            database,
            `LiveStreams/${testid}/${userId}/answers/${adminIdRef.current}`
          );
          await set(answerRef, {
            sdp: answer.sdp,
            type: answer.type,
            timestamp: Date.now(),
          });

          console.log('[Viewer] Sent answer to student:', userId);
        } catch (err) {
          console.error('[Viewer] Error handling offer:', err);
          setError('Failed to establish connection. Click Retry.');
        }
      });

      // ── Listen for ICE candidates from student ──────────────────────────────
      const candidatesRef = ref(
        database,
        `LiveStreams/${testid}/${userId}/ice/${adminIdRef.current}/student`
      );
      const unsubscribeCandidates = onValue(candidatesRef, (snapshot) => {
        const candidates = snapshot.val();
        if (!candidates || !pc || pc.connectionState === 'closed') return;

        Object.values(candidates).forEach(async (candidate) => {
          if (!candidate) return;
          try {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
              candidatesQueueRef.current.push(candidate);
            }
          } catch (err) {
            if (pc.connectionState !== 'connected') {
              console.warn('[Viewer] ICE candidate error (may be harmless):', err.message);
            }
          }
        });
      });

      unsubscribersRef.current.push(unsubscribeOffer, unsubscribeCandidates);
      isInitializingRef.current = false;
    } catch (err) {
      console.error('[Viewer] Error initializing connection:', err);
      setError('Failed to start connection. Click Retry.');
      isInitializingRef.current = false;
    }
  }, [testid, userId, cleanupPeerConnection, assignStream]);

  // Mount: delayed init to avoid race conditions
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeConnection();
    }, 600);

    return () => {
      clearTimeout(timer);
      cleanupPeerConnection();
    };
  }, [initializeConnection, cleanupPeerConnection]);

  const toggleMute = () => {
    const vid = activeView === 'camera' ? cameraVideoRef.current : screenVideoRef.current;
    if (vid) {
      vid.muted = !vid.muted;
      setIsMuted(vid.muted);
    }
  };

  const toggleFullscreen = () => {
    const vid = activeView === 'camera' ? cameraVideoRef.current : screenVideoRef.current;
    if (vid?.requestFullscreen) vid.requestFullscreen();
  };

  const retry = () => {
    if (isInitializingRef.current) return;
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    retryTimeoutRef.current = setTimeout(() => {
      initializeConnection();
    }, 800);
  };

  const statusColor = () => {
    switch (connectionState) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'failed':
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const anyConnected = cameraConnected || screenConnected;

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-700">
      {/* Video container */}
      <div className="relative aspect-video bg-black">
        {/* Camera video */}
        <video
          ref={cameraVideoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className={`w-full h-full object-cover ${activeView === 'screen' ? 'hidden' : ''}`}
        />

        {/* Screen share video */}
        <video
          ref={screenVideoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className={`w-full h-full object-contain bg-black ${activeView === 'camera' ? 'hidden' : ''}`}
        />

        {/* Overlay when not connected */}
        {!anyConnected && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-90">
            {error ? (
              <>
                <FiVideoOff className="text-red-400 text-4xl mb-2" />
                <p className="text-red-400 text-sm mb-3 text-center px-4">{error}</p>
                <button
                  onClick={retry}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
                >
                  <FiRefreshCw size={14} />
                  Retry
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
        {anyConnected && (
          <div className="absolute top-2 left-2 flex gap-2">
            {cameraConnected && (
              <button
                onClick={() => setActiveView('camera')}
                className={`p-2 rounded-md transition-colors ${
                  activeView === 'camera'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Camera View"
              >
                <FiUser size={16} />
              </button>
            )}
            {screenConnected && (
              <button
                onClick={() => setActiveView('screen')}
                className={`p-2 rounded-md transition-colors ${
                  activeView === 'screen'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title="Screen Share"
              >
                <FiMonitor size={16} />
              </button>
            )}
          </div>
        )}

        {/* Connection dot */}
        <div
          className={`absolute top-2 right-2 w-3 h-3 rounded-full ${statusColor()} ${anyConnected ? 'animate-pulse' : ''}`}
        />
      </div>

      {/* Student info and controls */}
      <div className="p-3 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{userName}</p>
            <p className="text-gray-400 text-xs truncate">{userEmail}</p>
            <div className="mt-1 flex gap-2 text-xs">
              {cameraConnected && <span className="text-green-400">📷 Camera</span>}
              {screenConnected && <span className="text-blue-400">🖥️ Screen</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-3">
            <button
              onClick={toggleMute}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
              title="Fullscreen"
            >
              <FiMaximize2 size={16} />
            </button>

            {(error || connectionState === 'disconnected' || connectionState === 'failed') && (
              <button
                onClick={retry}
                className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
                title="Retry Connection"
              >
                <FiRefreshCw size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Connection state text */}
        <div className="mt-2 text-xs text-gray-500">
          Status:{' '}
          <span className={`font-medium ${anyConnected ? 'text-green-400' : 'text-yellow-400'}`}>
            {connectionState}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Main component – displays all active livestreams for an exam
 */
const LiveStreamViewerV2 = ({ testid }) => {
  const [activeStreams, setActiveStreams] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!testid) return;

    // Listen for students who are actively streaming
    const streamsRef = ref(database, `LiveStreams/${testid}`);
    const unsubscribeStreams = onValue(streamsRef, (snapshot) => {
      const streams = snapshot.val();
      if (streams) {
        const activeUserIds = Object.keys(streams).filter(
          (uid) => streams[uid]?.active === true
        );
        setActiveStreams(activeUserIds);
      } else {
        setActiveStreams([]);
      }
      setIsLoading(false);
    });

    // Fetch user metadata
    const usersRef = ref(database, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      if (usersData) setUsers(usersData);
    });

    return () => {
      unsubscribeStreams();
      unsubscribeUsers();
    };
  }, [testid]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (activeStreams.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
        <FiVideoOff className="text-gray-500 text-5xl mx-auto mb-4" />
        <p className="text-gray-400 text-lg">No active livestreams</p>
        <p className="text-gray-500 text-sm mt-2">Students will appear here when they start their exam</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">
          Live Camera &amp; Screen Feeds ({activeStreams.length})
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activeStreams.map((userId) => {
          const user = users[userId];
          return (
            <StudentStreamCardV2
              key={userId}
              testid={testid}
              userId={userId}
              userName={user?.name || 'Unknown Student'}
              userEmail={user?.email || 'No email'}
            />
          );
        })}
      </div>
    </div>
  );
};

export default LiveStreamViewerV2;
