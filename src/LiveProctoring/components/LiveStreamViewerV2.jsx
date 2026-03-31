import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ref, onValue, set, remove, get } from 'firebase/database';
import { database } from '../../firebase';
import { FiVideo, FiVideoOff, FiVolume2, FiVolumeX, FiMaximize2, FiRefreshCw, FiMonitor, FiUser } from 'react-icons/fi';

/**
 * Component to display a single student's livestream with both camera and screen share
 * This component properly handles dual streams from a single peer connection
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
  const [activeView, setActiveView] = useState('camera'); // 'camera' or 'screen'
  const candidatesQueueRef = useRef([]);
  const adminIdRef = useRef(`admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const isInitializingRef = useRef(false);
  const connectionTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const unsubscribersRef = useRef([]);

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
  };

  // Clean up peer connection
  const cleanupPeerConnection = useCallback(() => {
    // Clear timeouts
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Unsubscribe from Firebase listeners
    unsubscribersRef.current.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    unsubscribersRef.current = [];

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    setCameraConnected(false);
    setScreenConnected(false);
    setConnectionState('closed');
    isInitializingRef.current = false;
  }, []);

  // Initialize peer connection and request stream
  const initializeConnection = useCallback(async () => {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializingRef.current) {
      console.log('Already initializing connection for', userId);
      return;
    }

    try {
      isInitializingRef.current = true;
      setError(null);
      cleanupPeerConnection();

      setConnectionState('connecting');

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      // Handle incoming tracks - this will receive both camera and screen tracks
      pc.ontrack = (event) => {
        console.log('Received track from student:', userId, 'Track kind:', event.track.kind, 'Track label:', event.track.label);
        
        // Determine if this is camera or screen based on track label or properties
        const isScreenTrack = event.track.label.toLowerCase().includes('screen') || 
                             event.track.label.toLowerCase().includes('display') ||
                             event.track.settings?.displaySurface;
        
        const videoRef = isScreenTrack ? screenVideoRef : cameraVideoRef;
        
        if (videoRef && event.streams[0]) {
          // If this is the first track for this video element, set the stream
          if (!videoRef.srcObject) {
            videoRef.srcObject = event.streams[0];
          } else {
            // If we already have a stream, we need to handle multiple tracks
            // For now, we'll assume the student sends separate streams for camera and screen
            const existingStream = videoRef.srcObject;
            
            // Check if this track is already in the stream
            const trackExists = existingStream.getTracks().some(t => t.id === event.track.id);
            if (!trackExists) {
              existingStream.addTrack(event.track);
            }
          }
          
          if (isScreenTrack) {
            setScreenConnected(true);
          } else {
            setCameraConnected(true);
          }
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidateRef = ref(
            database,
            `LiveStreams/${testid}/${userId}/ice/${adminIdRef.current}/viewer/${Date.now()}`
          );
          set(candidateRef, event.candidate.toJSON());
        }
      };

      // Handle connection state
      pc.onconnectionstatechange = () => {
        console.log(`Connection state for ${userId}: ${pc.connectionState}`);
        setConnectionState(pc.connectionState);
        
        if (pc.connectionState === 'connected') {
          setError(null);
          isInitializingRef.current = false;
          // Clear connection timeout
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
        } else if (pc.connectionState === 'failed') {
          setError('Connection failed');
          isInitializingRef.current = false;
          // Don't auto-retry, let user manually retry
          pc.close();
        } else if (pc.connectionState === 'disconnected') {
          isInitializingRef.current = false;
        }
      };

      // Set connection timeout (30 seconds)
      connectionTimeoutRef.current = setTimeout(() => {
        if (pc.connectionState !== 'connected') {
          setError('Connection timeout');
          isInitializingRef.current = false;
          cleanupPeerConnection();
        }
      }, 30000);

      // Add ourselves as a viewer
      const viewerRef = ref(database, `LiveStreams/${testid}/${userId}/viewers/${adminIdRef.current}`);
      await set(viewerRef, {
        adminId: adminIdRef.current,
        timestamp: Date.now(),
        type: 'admin'
      });

      // Listen for offer from student
      const offerRef = ref(database, `LiveStreams/${testid}/${userId}/offers/${adminIdRef.current}`);
      const unsubscribeOffer = onValue(offerRef, async (snapshot) => {
        const data = snapshot.val();
        if (data && data.sdp && pc.signalingState !== 'closed') {
          try {
            console.log('Received offer from student:', userId);
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            
            // Process queued candidates
            while (candidatesQueueRef.current.length > 0) {
              const candidate = candidatesQueueRef.current.shift();
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (err) {
                console.error('Error adding queued ICE candidate:', err);
              }
            }

            // Create answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Send answer to student
            const answerRef = ref(database, `LiveStreams/${testid}/${userId}/answers/${adminIdRef.current}`);
            await set(answerRef, {
              sdp: answer.sdp,
              type: answer.type,
              timestamp: Date.now(),
            });

            console.log('Sent answer to student:', userId);
          } catch (error) {
            console.error('Error handling offer:', error);
            setError('Failed to establish connection');
          }
        }
      });

      // Listen for ICE candidates from student
      const candidatesRef = ref(database, `LiveStreams/${testid}/${userId}/ice/${adminIdRef.current}/student`);
      const unsubscribeCandidates = onValue(candidatesRef, (snapshot) => {
        const candidates = snapshot.val();
        if (candidates && pc && pc.connectionState !== 'closed') {
          Object.values(candidates).forEach(async (candidate) => {
            if (candidate) {
              try {
                if (pc.remoteDescription) {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                  candidatesQueueRef.current.push(candidate);
                }
              } catch (error) {
                // Ignore errors if connection is already established
                if (pc.connectionState !== 'connected') {
                  console.error('Error adding ICE candidate:', error);
                }
              }
            }
          });
        }
      });

      // Store unsubscribers
      unsubscribersRef.current.push(unsubscribeOffer, unsubscribeCandidates);

      isInitializingRef.current = false;
    } catch (error) {
      console.error('Error initializing connection:', error);
      setError('Failed to initialize connection');
      isInitializingRef.current = false;
    }
  }, [testid, userId, cleanupPeerConnection]);

  // Initialize on mount with debounce
  useEffect(() => {
    // Delay initial connection to avoid race conditions
    const initTimer = setTimeout(() => {
      initializeConnection();
    }, 500);

    return () => {
      clearTimeout(initTimer);
      cleanupPeerConnection();
    };
  }, [initializeConnection, cleanupPeerConnection]);

  const toggleMute = () => {
    const activeVideoRef = activeView === 'camera' ? cameraVideoRef.current : screenVideoRef.current;
    if (activeVideoRef) {
      activeVideoRef.muted = !activeVideoRef.muted;
      setIsMuted(activeVideoRef.muted);
    }
  };

  const toggleFullscreen = () => {
    const activeVideoRef = activeView === 'camera' ? cameraVideoRef.current : screenVideoRef.current;
    if (activeVideoRef) {
      if (activeVideoRef.requestFullscreen) {
        activeVideoRef.requestFullscreen();
      }
    }
  };

  const retry = () => {
    if (!isInitializingRef.current) {
      // Debounce retry attempts
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      retryTimeoutRef.current = setTimeout(() => {
        initializeConnection();
      }, 1000);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'failed':
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

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
        
        {/* Screen video */}
        <video
          ref={screenVideoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className={`w-full h-full object-cover ${activeView === 'camera' ? 'hidden' : ''}`}
        />
        
        {/* Overlay when not connected */}
        {(!cameraConnected && !screenConnected) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-90">
            {error ? (
              <>
                <FiVideoOff className="text-red-400 text-4xl mb-2" />
                <p className="text-red-400 text-sm mb-3">{error}</p>
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
                <p className="text-gray-400 text-sm">Connecting...</p>
              </>
            )}
          </div>
        )}

        {/* View toggle buttons */}
        {(cameraConnected || screenConnected) && (
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

        {/* Connection status indicator */}
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getConnectionStatusColor()} ${(cameraConnected || screenConnected) ? 'animate-pulse' : ''}`}></div>
      </div>

      {/* Student info and controls */}
      <div className="p-3 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{userName}</p>
            <p className="text-gray-400 text-xs truncate">{userEmail}</p>
            <div className="mt-1 flex gap-2 text-xs">
              {cameraConnected && (
                <span className="text-green-400">Camera</span>
              )}
              {screenConnected && (
                <span className="text-blue-400">Screen</span>
              )}
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
          </div>
        </div>
        
        {/* Connection state text */}
        <div className="mt-2 text-xs text-gray-500">
          Status: <span className={`font-medium ${(cameraConnected || screenConnected) ? 'text-green-400' : 'text-yellow-400'}`}>
            {connectionState}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Main component to display all active livestreams for an exam (V2 with screen share)
 */
const LiveStreamViewerV2 = ({ testid }) => {
  const [activeStreams, setActiveStreams] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!testid) return;

    // Listen for active streams
    const streamsRef = ref(database, `LiveStreams/${testid}`);
    const unsubscribeStreams = onValue(streamsRef, (snapshot) => {
      const streams = snapshot.val();
      if (streams) {
        const activeUserIds = Object.keys(streams).filter(
          (userId) => streams[userId]?.active === true
        );
        setActiveStreams(activeUserIds);
      } else {
        setActiveStreams([]);
      }
      setIsLoading(false);
    });

    // Fetch user details
    const usersRef = ref(database, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      if (usersData) {
        setUsers(usersData);
      }
    });

    return () => {
      unsubscribeStreams();
      unsubscribeUsers();
    };
  }, [testid]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
          Live Camera & Screen Feeds ({activeStreams.length})
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
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
