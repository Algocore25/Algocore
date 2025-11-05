import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ref, onValue, set, remove, onDisconnect, get } from 'firebase/database';
import { database } from '../../firebase';
import { FiVideo, FiVideoOff, FiVolume2, FiVolumeX, FiMaximize2, FiRefreshCw, FiUser, FiSearch, FiFilter, FiGrid, FiList, FiMic, FiMicOff } from 'react-icons/fi';

/**
 * Redesigned Student Stream Card - Simplified architecture
 */
const StudentStreamCard = ({ testid, userId, userName, userEmail }) => {
  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [connectionState, setConnectionState] = useState('new');
  const [isMuted, setIsMuted] = useState(true); // Muted by default to allow autoplay (browser policy)
  const [error, setError] = useState(null);
  const [diagnostics, setDiagnostics] = useState({ iceState: 'new', gatheringState: 'new', candidatesReceived: 0, candidatesSent: 0 });
  const listenersRef = useRef([]);
  const iceCandidateQueueRef = useRef([]);
  const isSetupRef = useRef(false);
  const isPlayingRef = useRef(false);
  const isCleaningUpRef = useRef(false);
  
  // Admin audio streaming state
  const [isSpeakingToStudent, setIsSpeakingToStudent] = useState(false);
  const adminAudioStreamRef = useRef(null);
  const adminPeerConnectionRef = useRef(null);
  const adminListenersRef = useRef([]);
  const isAdminSetupRef = useRef(false);
  
  // Generate unique viewer ID on each mount (ensures fresh ID on page reload)
  const [viewerId] = useState(() => {
    const id = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[Viewer] Generated new viewer ID: ${id} for user ${userId}`);
    return id;
  });
  const viewerIdRef = useRef(viewerId);
  
  // Update ref when viewerId changes
  useEffect(() => {
    viewerIdRef.current = viewerId;
  }, [viewerId]);

  const rtcConfig = {
    iceServers: (() => {
      const servers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
      ];
      const turnUrl = process.env.REACT_APP_TURN_URL;
      const turnUser = process.env.REACT_APP_TURN_USERNAME;
      const turnCred = process.env.REACT_APP_TURN_CREDENTIAL;
      if (turnUrl && turnUser && turnCred) {
        servers.push({ urls: turnUrl, username: turnUser, credential: turnCred });
      }
      if (typeof window !== 'undefined' && window.__TURN_CONFIG__) {
        const t = window.__TURN_CONFIG__;
        if (t.urls) servers.push({ urls: t.urls, username: t.username, credential: t.credential });
      }
      return servers;
    })(),
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceTransportPolicy: 'all',
    // Enable smooth video streaming
    sdpSemantics: 'unified-plan'
  };

  const cleanup = useCallback(() => {
    console.log(`[Viewer ${viewerIdRef.current}] Cleaning up`);
    
    isCleaningUpRef.current = true;
    isSetupRef.current = false;
    isPlayingRef.current = false;
    
    // Stop and remove all tracks from video element
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`[Viewer ${viewerIdRef.current}] Stopped track:`, track.kind);
      });
      videoRef.current.srcObject = null;
    }
    
    // Close peer connection with all event handlers removed
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.oniceconnectionstatechange = null;
        peerConnectionRef.current.onicegatheringstatechange = null;
        peerConnectionRef.current.onconnectionstatechange = null;
        peerConnectionRef.current.onsignalingstatechange = null;
        peerConnectionRef.current.close();
      } catch (e) {
        console.error(`[Viewer ${viewerIdRef.current}] Error closing peer connection:`, e);
      }
      peerConnectionRef.current = null;
    }

    // Unsubscribe from all Firebase listeners
    listenersRef.current.forEach(unsub => {
      if (typeof unsub === 'function') {
        try {
          unsub();
        } catch (e) {
          console.error(`[Viewer ${viewerIdRef.current}] Error unsubscribing:`, e);
        }
      }
    });
    listenersRef.current = [];

    // Clear ICE candidate queue
    iceCandidateQueueRef.current = [];

    setConnectionState('closed');
    
    // Remove viewer registration from Firebase asynchronously and track completion
    (async () => {
      try {
        await remove(ref(database, `LiveStreams/${testid}/${userId}/viewers/${viewerIdRef.current}`));
        console.log(`[Viewer ${viewerIdRef.current}] Viewer removed from Firebase`);
        
        // Wait a bit more for Firebase to propagate
        await new Promise(resolve => setTimeout(resolve, 300));
        isCleaningUpRef.current = false;
        console.log(`[Viewer ${viewerIdRef.current}] Cleanup complete`);
      } catch (e) {
        console.error(`[Viewer ${viewerIdRef.current}] Error removing viewer:`, e);
        isCleaningUpRef.current = false;
      }
    })();
  }, [testid, userId]);

  const setupConnection = useCallback(async () => {
    // Wait for cleanup to complete if in progress
    if (isCleaningUpRef.current) {
      console.log(`[Viewer ${viewerIdRef.current}] Cleanup in progress, waiting...`);
      setTimeout(() => setupConnection(), 150);
      return;
    }
    
    if (isSetupRef.current) {
      console.log(`[Viewer ${viewerIdRef.current}] Already setting up`);
      return;
    }

    isSetupRef.current = true;
    setError(null);
    setConnectionState('connecting');

    try {
      console.log(`[Viewer ${viewerIdRef.current}] Setting up connection for student:`, userId);
      
      // Check if student is actually streaming
      const streamStatusRef = ref(database, `LiveStreams/${testid}/${userId}`);
      const streamStatus = await get(streamStatusRef);
      if (!streamStatus.exists() || !streamStatus.val()?.active) {
        console.warn(`[Viewer ${viewerIdRef.current}] Student is not streaming yet`);
        setError('Student not streaming');
        isSetupRef.current = false;
        // Retry after a delay
        setTimeout(() => setupConnection(), 3000);
        return;
      }
      console.log(`[Viewer ${viewerIdRef.current}] Student stream is active`);

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      // Handle incoming tracks
      pc.ontrack = (event) => {
        console.log(`[Viewer ${viewerIdRef.current}] ===== TRACK RECEIVED =====`);
        console.log(`[Viewer ${viewerIdRef.current}] Track kind:`, event.track.kind);
        console.log(`[Viewer ${viewerIdRef.current}] Track readyState:`, event.track.readyState);
        console.log(`[Viewer ${viewerIdRef.current}] Track enabled:`, event.track.enabled);
        console.log(`[Viewer ${viewerIdRef.current}] Track muted:`, event.track.muted);
        
        if (!event.streams || event.streams.length === 0) {
          console.error(`[Viewer ${viewerIdRef.current}] No streams in track event`);
          return;
        }

        const stream = event.streams[0];
        const tracks = stream.getTracks();
        console.log(`[Viewer ${viewerIdRef.current}] Stream ID:`, stream.id);
        console.log(`[Viewer ${viewerIdRef.current}] Stream tracks:`, tracks.map(t => `${t.kind}:${t.readyState}`));
        console.log(`[Viewer ${viewerIdRef.current}] Stream active:`, stream.active);
        
        // Ensure track is enabled and not muted
        event.track.enabled = true;
        
        // For audio tracks, ensure they're not muted
        if (event.track.kind === 'audio') {
          event.track.enabled = true;
          console.log(`[Viewer ${viewerIdRef.current}] Audio track received and enabled`);
        }
        
        if (videoRef.current) {
          // Don't stop existing tracks if stream is already set - just update if needed
          const currentStream = videoRef.current.srcObject;
          
          if (!currentStream || currentStream.id !== stream.id) {
            console.log(`[Viewer ${viewerIdRef.current}] Setting new stream to video element`);
            
            // Stop old tracks
            if (currentStream) {
              currentStream.getTracks().forEach(track => {
                track.stop();
                console.log(`[Viewer ${viewerIdRef.current}] Stopped old track:`, track.kind);
              });
            }
            
            // Set new stream
            videoRef.current.srcObject = stream;
            console.log(`[Viewer ${viewerIdRef.current}] srcObject set to video element`);
          } else {
            console.log(`[Viewer ${viewerIdRef.current}] Stream already set, track will be added automatically`);
          }
          
          // Set video properties
          videoRef.current.playbackRate = 1.0;
          videoRef.current.volume = 1; // Full volume
          // Respect current mute state - don't force mute if user has already unmuted
          videoRef.current.muted = isMuted;
          
          // Enable all audio tracks in the stream (they're ready when user unmutes)
          const audioTracks = stream.getAudioTracks();
          console.log(`[Viewer ${viewerIdRef.current}] Found ${audioTracks.length} audio track(s)`);
          audioTracks.forEach(track => {
            track.enabled = true;
            console.log(`[Viewer ${viewerIdRef.current}] ✅ Enabled audio track:`, track.label, 'State:', track.readyState, 'Muted:', track.muted);
          });
          console.log(`[Viewer ${viewerIdRef.current}] Video element muted state:`, videoRef.current.muted, 'Volume:', videoRef.current.volume);
          
          // Disable picture-in-picture
          if (videoRef.current.disablePictureInPicture !== undefined) {
            videoRef.current.disablePictureInPicture = true;
          }
          
          // Wait a bit for the stream to be ready, then play
          setTimeout(async () => {
            if (!videoRef.current || isPlayingRef.current) return;
            
            try {
              console.log(`[Viewer ${viewerIdRef.current}] Video element readyState:`, videoRef.current.readyState);
              console.log(`[Viewer ${viewerIdRef.current}] Video element videoWidth:`, videoRef.current.videoWidth);
              console.log(`[Viewer ${viewerIdRef.current}] Video element videoHeight:`, videoRef.current.videoHeight);
              
              isPlayingRef.current = true;
              await videoRef.current.play();
              console.log(`[Viewer ${viewerIdRef.current}] ✅ Video playback started successfully`);
              setConnectionState('connected');
              setError(null);
              
              // Log dimensions after play
              setTimeout(() => {
                if (videoRef.current) {
                  console.log(`[Viewer ${viewerIdRef.current}] After play - videoWidth:`, videoRef.current.videoWidth);
                  console.log(`[Viewer ${viewerIdRef.current}] After play - videoHeight:`, videoRef.current.videoHeight);
                  
                  if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
                    console.error(`[Viewer ${viewerIdRef.current}] ⚠️ VIDEO HAS NO DIMENSIONS - BLACK SCREEN LIKELY`);
                  }
                }
              }, 1000);
            } catch (error) {
              console.error(`[Viewer ${viewerIdRef.current}] Video play error:`, error);
              isPlayingRef.current = false;
              if (error.name === 'NotAllowedError') {
                setError('Autoplay blocked. Click retry to play.');
              } else if (error.name !== 'AbortError') {
                // Ignore AbortError as it's expected when interrupted
                setError('Failed to start video playback');
              }
            }
          }, 300);
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(`[Viewer ${viewerIdRef.current}] ICE candidate:`, event.candidate.type, event.candidate.candidate);
          setDiagnostics(prev => ({ ...prev, candidatesSent: prev.candidatesSent + 1 }));
          const candidateRef = ref(
            database,
            `LiveStreams/${testid}/${userId}/ice/${viewerIdRef.current}/viewer/${Date.now()}`
          );
          set(candidateRef, event.candidate.toJSON())
            .catch(error => {
              console.error(`[Viewer ${viewerIdRef.current}] Error sending ICE candidate:`, error);
            });
        } else {
          console.log(`[Viewer ${viewerIdRef.current}] All ICE candidates sent (total: ${diagnostics.candidatesSent})`);
        }
      };

      // Handle connection state
      let restartAttempted = false;
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log(`[Viewer ${viewerIdRef.current}] Connection state:`, state);
        setConnectionState(state);
        
        if (state === 'connected') {
          console.log(`[Viewer ${viewerIdRef.current}] Connection established successfully`);
          setError(null);
          restartAttempted = false;
        } else if (state === 'failed') {
          console.error(`[Viewer ${viewerIdRef.current}] Connection failed`);
          console.error(`[Viewer ${viewerIdRef.current}] Diagnostics:`, {
            connectionState: state,
            iceState: pc.iceConnectionState,
            gatheringState: pc.iceGatheringState,
            signalingState: pc.signalingState,
            candidatesSent: diagnostics.candidatesSent,
            candidatesReceived: diagnostics.candidatesReceived,
            localDescription: !!pc.localDescription,
            remoteDescription: !!pc.remoteDescription
          });
          
          console.error(`[Viewer ${viewerIdRef.current}] 🔍 TROUBLESHOOTING TIPS:`);
          console.error(`  1. Check if student has enabled camera/microphone`);
          console.error(`  2. Verify network connectivity on both sides`);
          console.error(`  3. If behind firewall/NAT, configure TURN server:`);
          console.error(`     REACT_APP_TURN_URL, REACT_APP_TURN_USERNAME, REACT_APP_TURN_CREDENTIAL`);
          console.error(`  4. ICE candidates - Sent: ${diagnostics.candidatesSent}, Received: ${diagnostics.candidatesReceived}`);
          if (diagnostics.candidatesReceived === 0) {
            console.error(`     ⚠️ No candidates received from student - student may not be streaming`);
          }
          if (pc.iceConnectionState === 'failed') {
            console.error(`     ⚠️ ICE connection failed - likely network/firewall issue`);
          }
          
          // Try ICE restart first
          if (!restartAttempted && typeof pc.restartIce === 'function') {
            console.log(`[Viewer ${viewerIdRef.current}] Attempting ICE restart`);
            restartAttempted = true;
            try {
              pc.restartIce();
              // Wait a bit before giving up
              setTimeout(() => {
                if (pc.connectionState === 'failed') {
                  console.log(`[Viewer ${viewerIdRef.current}] ICE restart failed, recreating connection`);
                  setError('Connection failed, retrying...');
                  isSetupRef.current = false;
                  cleanup();
                  setTimeout(() => setupConnection(), 2000);
                }
              }, 3000);
            } catch (e) {
              console.error(`[Viewer ${viewerIdRef.current}] ICE restart error:`, e);
              setError('Connection failed, retrying...');
              isSetupRef.current = false;
              cleanup();
              setTimeout(() => setupConnection(), 2000);
            }
          } else {
            setError('Connection failed, retrying...');
            isSetupRef.current = false;
            cleanup();
            setTimeout(() => setupConnection(), 2000);
          }
        } else if (state === 'disconnected') {
          console.warn(`[Viewer ${viewerIdRef.current}] Connection disconnected, waiting for recovery...`);
          // Wait a bit to see if it reconnects automatically
          setTimeout(() => {
            if (pc.connectionState === 'disconnected') {
              console.log(`[Viewer ${viewerIdRef.current}] Still disconnected, attempting reconnection`);
              setError('Reconnecting...');
              isSetupRef.current = false;
              cleanup();
              setTimeout(() => setupConnection(), 1500);
            }
          }, 5000);
        }
      };

      // Handle ICE connection state
      pc.oniceconnectionstatechange = () => {
        const iceState = pc.iceConnectionState;
        console.log(`[Viewer ${viewerIdRef.current}] ICE state:`, iceState);
        setDiagnostics(prev => ({ ...prev, iceState }));
        
        if (iceState === 'connected' || iceState === 'completed') {
          console.log(`[Viewer ${viewerIdRef.current}] ICE connection established`);
        } else if (iceState === 'failed') {
          console.error(`[Viewer ${viewerIdRef.current}] ICE connection failed - No route to peer. May need TURN server.`);
          setError(`ICE failed: Network issue (ICE: ${iceState}, Sent: ${diagnostics.candidatesSent}, Received: ${diagnostics.candidatesReceived})`);
        }
      };

      pc.onicegatheringstatechange = () => {
        const gatheringState = pc.iceGatheringState;
        console.log(`[Viewer ${viewerIdRef.current}] ICE gathering:`, gatheringState);
        setDiagnostics(prev => ({ ...prev, gatheringState }));
        
        if (gatheringState === 'complete') {
          console.log(`[Viewer ${viewerIdRef.current}] ICE gathering complete. Total candidates sent: ${diagnostics.candidatesSent}`);
        }
      };

      // Register as viewer
      const viewerRef = ref(database, `LiveStreams/${testid}/${userId}/viewers/${viewerIdRef.current}`);
      await set(viewerRef, {
        connected: true,
        timestamp: Date.now(),
      });
      onDisconnect(viewerRef).remove();

      // Listen for offer from student
      const offerRef = ref(database, `LiveStreams/${testid}/${userId}/offers/${viewerIdRef.current}`);
      const unsubscribeOffer = onValue(offerRef, async (snapshot) => {
        const offer = snapshot.val();
        if (!offer || !offer.sdp) return;

        console.log(`[Viewer ${viewerIdRef.current}] Received offer`);

        if (pc.signalingState !== 'stable') {
          console.log(`[Viewer ${viewerIdRef.current}] Skipping offer, wrong signaling state:`, pc.signalingState);
          return;
        }

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          
          // Process queued ICE candidates
          for (const candidate of iceCandidateQueueRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          iceCandidateQueueRef.current = [];

          // Create answer
          const answer = await pc.createAnswer();
          // Prefer H.264 for Safari compatibility
          const preferH264 = (sdp) => {
            try {
              const lines = sdp.split('\n');
              const mLineIndex = lines.findIndex(l => l.startsWith('m=video'));
              if (mLineIndex === -1) return sdp;
              const h264Pt = lines
                .filter(l => l.startsWith('a=rtpmap:'))
                .map(l => ({ pt: l.match(/a=rtpmap:(\d+)/)?.[1], codec: l.toLowerCase() }))
                .find(x => x.codec.includes('h264'))?.pt;
              if (!h264Pt) return sdp;
              const parts = lines[mLineIndex].split(' ');
              const header = parts.slice(0, 3);
              const pts = parts.slice(3).filter(Boolean);
              const reordered = [h264Pt, ...pts.filter(p => p !== h264Pt)];
              lines[mLineIndex] = [...header, ...reordered].join(' ');
              return lines.join('\n');
            } catch (_) {
              return sdp;
            }
          };
          const mungedAnswer = { ...answer, sdp: preferH264(answer.sdp) };
          await pc.setLocalDescription(mungedAnswer);

          console.log(`[Viewer ${viewerIdRef.current}] Sending answer`);
          await set(ref(database, `LiveStreams/${testid}/${userId}/answers/${viewerIdRef.current}`), {
            sdp: mungedAnswer.sdp,
            type: mungedAnswer.type,
            timestamp: Date.now(),
          });
        } catch (error) {
          console.error(`[Viewer ${viewerIdRef.current}] Error handling offer:`, error);
          setError('Failed to establish connection');
          isSetupRef.current = false;
        }
      });

      listenersRef.current.push(unsubscribeOffer);

      // Listen for ICE candidates from student
      const studentIceRef = ref(database, `LiveStreams/${testid}/${userId}/ice/${viewerIdRef.current}/student`);
      const unsubscribeIce = onValue(studentIceRef, (snapshot) => {
        const candidates = snapshot.val();
        if (!candidates) return;

        Object.entries(candidates).forEach(([key, candidate]) => {
          setDiagnostics(prev => ({ ...prev, candidatesReceived: prev.candidatesReceived + 1 }));
          
          if (pc.remoteDescription) {
            pc.addIceCandidate(new RTCIceCandidate(candidate))
              .then(() => {
                console.log(`[Viewer ${viewerIdRef.current}] Added ICE candidate successfully (total: ${diagnostics.candidatesReceived})`);
              })
              .catch(error => {
                if (pc.connectionState !== 'connected' && pc.connectionState !== 'completed') {
                  console.error(`[Viewer ${viewerIdRef.current}] Error adding ICE candidate:`, error);
                }
              });
          } else {
            // Queue for later when remote description is set
            console.log(`[Viewer ${viewerIdRef.current}] Queueing ICE candidate (queued: ${iceCandidateQueueRef.current.length})`);
            iceCandidateQueueRef.current.push(candidate);
          }
        });
      });

      listenersRef.current.push(unsubscribeIce);

    } catch (error) {
      console.error(`[Viewer ${viewerIdRef.current}] Setup error:`, error);
      setError('Failed to initialize');
      isSetupRef.current = false;
    }
  }, [testid, userId]);

  // Initialize on mount
  useEffect(() => {
    console.log(`[Viewer ${viewerIdRef.current}] Component mounted for user ${userId}`);
    
    // Reset flags to allow new connection
    isSetupRef.current = false;
    isPlayingRef.current = false;
    isCleaningUpRef.current = false;
    
    const initTimer = setTimeout(() => {
      setupConnection();
    }, 500);

    return () => {
      console.log(`[Viewer ${viewerIdRef.current}] Component unmounting for user ${userId}`);
      clearTimeout(initTimer);
      cleanup();
    };
  }, [userId, testid, setupConnection, cleanup]);

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted;
      videoRef.current.muted = newMutedState;
      videoRef.current.volume = newMutedState ? 0 : 1;
      setIsMuted(newMutedState);
      
      // Also control audio tracks
      if (videoRef.current.srcObject) {
        const audioTracks = videoRef.current.srcObject.getAudioTracks();
        console.log(`[Viewer ${viewerIdRef.current}] ${newMutedState ? 'Muting' : 'Unmuting'} ${audioTracks.length} audio track(s)`);
        audioTracks.forEach(track => {
          track.enabled = !newMutedState;
          console.log(`[Viewer ${viewerIdRef.current}] Track ${track.label} enabled:`, track.enabled);
        });
      }
      
      console.log(`[Viewer ${viewerIdRef.current}] ✅ Student audio ${newMutedState ? 'MUTED' : 'UNMUTED'} (video.muted: ${videoRef.current.muted}, volume: ${videoRef.current.volume})`);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current && videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const retry = () => {
    setError(null);
    
    // If video already has a stream, try to play it
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.play()
        .then(() => {
          console.log(`[Viewer ${viewerIdRef.current}] Manual playback started`);
          setConnectionState('connected');
        })
        .catch(error => {
          console.error(`[Viewer ${viewerIdRef.current}] Manual play failed:`, error);
          // If play fails, reconnect
          cleanup();
          setTimeout(() => {
            setupConnection();
          }, 1000);
        });
    } else {
      // No stream, reconnect
      cleanup();
      setTimeout(() => {
        setupConnection();
      }, 1000);
    }
  };

  // Cleanup admin audio connection
  const cleanupAdminAudio = useCallback(() => {
    console.log(`[Admin Audio ${viewerIdRef.current}] Cleaning up admin audio`);
    
    // Stop admin audio stream
    if (adminAudioStreamRef.current) {
      adminAudioStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`[Admin Audio ${viewerIdRef.current}] Stopped admin audio track`);
      });
      adminAudioStreamRef.current = null;
    }
    
    // Close admin peer connection
    if (adminPeerConnectionRef.current) {
      try {
        adminPeerConnectionRef.current.onicecandidate = null;
        adminPeerConnectionRef.current.oniceconnectionstatechange = null;
        adminPeerConnectionRef.current.onconnectionstatechange = null;
        adminPeerConnectionRef.current.close();
      } catch (e) {
        console.error(`[Admin Audio ${viewerIdRef.current}] Error closing admin peer connection:`, e);
      }
      adminPeerConnectionRef.current = null;
    }

    // Unsubscribe from admin listeners
    adminListenersRef.current.forEach(unsub => {
      if (typeof unsub === 'function') {
        try {
          unsub();
        } catch (e) {
          console.error(`[Admin Audio ${viewerIdRef.current}] Error unsubscribing:`, e);
        }
      }
    });
    adminListenersRef.current = [];

    // Clean up Firebase data for this admin audio session
    (async () => {
      try {
        // Remove admin registration
        await remove(ref(database, `AdminAudio/${testid}/${userId}/admin/${viewerIdRef.current}`));
        console.log(`[Admin Audio ${viewerIdRef.current}] Admin audio removed from Firebase`);
        
        // Clean up signaling data (offers, answers, ICE candidates)
        await remove(ref(database, `AdminAudio/${testid}/${userId}/offers/${viewerIdRef.current}`));
        await remove(ref(database, `AdminAudio/${testid}/${userId}/answers/${viewerIdRef.current}`));
        await remove(ref(database, `AdminAudio/${testid}/${userId}/ice/${viewerIdRef.current}`));
        console.log(`[Admin Audio ${viewerIdRef.current}] Cleaned up Firebase signaling data`);
      } catch (e) {
        console.error(`[Admin Audio ${viewerIdRef.current}] Error removing admin audio:`, e);
      }
    })();

    isAdminSetupRef.current = false;
  }, [testid, userId]);

  // Toggle admin speaking to this student
  const toggleAdminAudio = async () => {
    if (isSpeakingToStudent) {
      // Stop speaking
      setIsSpeakingToStudent(false);
      cleanupAdminAudio();
    } else {
      // Start speaking
      try {
        console.log(`[Admin Audio ${viewerIdRef.current}] Starting admin audio to student ${userId}`);
        
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        adminAudioStreamRef.current = stream;
        console.log(`[Admin Audio ${viewerIdRef.current}] Admin microphone captured`);

        // Create peer connection for admin audio
        const pc = new RTCPeerConnection(rtcConfig);
        adminPeerConnectionRef.current = pc;

        // Add admin audio tracks to peer connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
          console.log(`[Admin Audio ${viewerIdRef.current}] Added admin audio track to peer connection`);
        });

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log(`[Admin Audio ${viewerIdRef.current}] Admin ICE candidate:`, event.candidate.type);
            const candidateRef = ref(
              database,
              `AdminAudio/${testid}/${userId}/ice/${viewerIdRef.current}/admin/${Date.now()}`
            );
            set(candidateRef, event.candidate.toJSON())
              .catch(error => {
                console.error(`[Admin Audio ${viewerIdRef.current}] Error sending admin ICE candidate:`, error);
              });
          }
        };

        // Handle connection state
        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          console.log(`[Admin Audio ${viewerIdRef.current}] Admin audio connection state:`, state);
          
          if (state === 'failed' || state === 'disconnected') {
            console.error(`[Admin Audio ${viewerIdRef.current}] Admin audio connection ${state}`);
            setIsSpeakingToStudent(false);
            cleanupAdminAudio();
          }
        };

        // Register admin audio
        const adminAudioRef = ref(database, `AdminAudio/${testid}/${userId}/admin/${viewerIdRef.current}`);
        await set(adminAudioRef, {
          active: true,
          timestamp: Date.now(),
        });
        onDisconnect(adminAudioRef).remove();

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        console.log(`[Admin Audio ${viewerIdRef.current}] Sending admin audio offer`);
        await set(ref(database, `AdminAudio/${testid}/${userId}/offers/${viewerIdRef.current}`), {
          sdp: offer.sdp,
          type: offer.type,
          timestamp: Date.now(),
        });

        // Listen for answer from student
        const answerRef = ref(database, `AdminAudio/${testid}/${userId}/answers/${viewerIdRef.current}`);
        const unsubscribeAnswer = onValue(answerRef, async (snapshot) => {
          const answer = snapshot.val();
          if (!answer || !answer.sdp) return;

          console.log(`[Admin Audio ${viewerIdRef.current}] Received answer from student`);

          if (pc.signalingState !== 'have-local-offer') {
            console.log(`[Admin Audio ${viewerIdRef.current}] Skipping answer, wrong signaling state:`, pc.signalingState);
            return;
          }

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log(`[Admin Audio ${viewerIdRef.current}] Admin audio connection established`);
          } catch (error) {
            console.error(`[Admin Audio ${viewerIdRef.current}] Error handling answer:`, error);
          }
        });

        adminListenersRef.current.push(unsubscribeAnswer);

        // Listen for ICE candidates from student
        const studentIceRef = ref(database, `AdminAudio/${testid}/${userId}/ice/${viewerIdRef.current}/student`);
        const unsubscribeIce = onValue(studentIceRef, (snapshot) => {
          const candidates = snapshot.val();
          if (!candidates) return;

          Object.entries(candidates).forEach(async ([key, candidate]) => {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
              console.log(`[Admin Audio ${viewerIdRef.current}] Added student ICE candidate for admin audio`);
            } catch (error) {
              console.error(`[Admin Audio ${viewerIdRef.current}] Error adding student ICE candidate:`, error);
            }
          });
        });

        adminListenersRef.current.push(unsubscribeIce);

        setIsSpeakingToStudent(true);
        isAdminSetupRef.current = true;
        
      } catch (error) {
        console.error(`[Admin Audio ${viewerIdRef.current}] Error setting up admin audio:`, error);
        alert('Failed to access microphone. Please grant microphone permission and try again.');
        cleanupAdminAudio();
      }
    }
  };

  // Cleanup admin audio on unmount
  useEffect(() => {
    return () => {
      if (isSpeakingToStudent) {
        cleanupAdminAudio();
      }
    };
  }, [cleanupAdminAudio, isSpeakingToStudent]);

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'failed':
      case 'closed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'failed':
        return 'Failed';
      case 'closed':
        return 'Closed';
      default:
        return 'Initializing...';
    }
  };

  return (
    <div id={`stream-${userId}`} className="relative bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 transition-colors scroll-mt-4">
      {/* Video element */}
      <div className="relative aspect-video bg-gray-100 dark:bg-black transition-colors">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          preload="auto"
          className="w-full h-full object-cover"
          style={{
            backgroundColor: '#000',
            willChange: 'transform',
            transform: 'translateZ(0)',
            minWidth: '100%',
            minHeight: '100%'
          }}
          onLoadedMetadata={(e) => {
            console.log(`[Viewer ${viewerIdRef.current}] Video metadata loaded`);
            if (e.target) {
              e.target.playbackRate = 1.0;
              e.target.volume = 1;
              // Keep muted for autoplay - user can unmute with button
              console.log(`[Viewer ${viewerIdRef.current}] Video volume set to:`, e.target.volume);
              console.log(`[Viewer ${viewerIdRef.current}] Video muted:`, e.target.muted);
            }
          }}
          onCanPlay={() => {
            console.log(`[Viewer ${viewerIdRef.current}] Video can play`);
            if (videoRef.current && !isPlayingRef.current) {
              // Video is ready - keep muted for autoplay compliance
              videoRef.current.volume = 1;
              
              // Note: Don't call play() here - let the ontrack handler manage playback
              // to avoid concurrent play() calls causing AbortError
            }
          }}
          onVolumeChange={() => {
            if (videoRef.current) {
              console.log(`[Viewer ${viewerIdRef.current}] Volume changed to:`, videoRef.current.volume, 'Muted:', videoRef.current.muted);
            }
          }}
          onPlaying={() => {
            console.log(`[Viewer ${viewerIdRef.current}] Video is playing`);
            isPlayingRef.current = false; // Reset flag once playing
          }}
          onError={(e) => {
            console.error(`[Viewer ${viewerIdRef.current}] Video error:`, e);
            setError('Video playback error');
          }}
          onStalled={() => {
            console.warn(`[Viewer ${viewerIdRef.current}] Video stalled, attempting recovery...`);
            if (videoRef.current && videoRef.current.readyState < 3 && !isPlayingRef.current) {
              isPlayingRef.current = true;
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(e => {
                    console.error(`[Viewer ${viewerIdRef.current}] Recovery play failed:`, e);
                    isPlayingRef.current = false;
                  });
                }
              }, 500);
            }
          }}
          onWaiting={() => {
            console.log(`[Viewer ${viewerIdRef.current}] Video buffering...`);
          }}
          onSuspend={() => {
            console.log(`[Viewer ${viewerIdRef.current}] Video suspended`);
          }}
        />
        
        {/* Overlay when not connected */}
        {connectionState !== 'connected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 bg-opacity-95 transition-colors">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 transition-colors">
                <FiUser className="text-gray-400 dark:text-gray-500 text-2xl" />
              </div>
              {error ? (
                <>
                  <FiVideoOff className="text-red-400 text-3xl mb-2" />
                  <p className="text-red-400 text-sm mb-2">{error}</p>
                  {diagnostics && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-mono">
                      <div>ICE: {diagnostics.iceState} | Gathering: {diagnostics.gatheringState}</div>
                      <div>Sent: {diagnostics.candidatesSent} | Received: {diagnostics.candidatesReceived}</div>
                    </div>
                  )}
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
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{getStatusText()}</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Status indicator */}
        <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${getStatusColor()}`}></div>
        
        {/* Muted indicator - show when connected and muted */}
        {connectionState === 'connected' && isMuted && (
          <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1.5 rounded-md flex items-center gap-2 text-sm">
            <FiVolumeX size={16} />
            <span>Click to unmute</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 dark:text-white font-medium text-sm truncate">{userName}</p>
            <p className="text-gray-600 dark:text-gray-400 text-xs truncate">{userEmail}</p>
          </div>
          
          <div className="flex items-center gap-2 ml-3">
            <button
              onClick={toggleAdminAudio}
              className={`p-2 rounded-md transition-colors ${
                isSpeakingToStudent
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title={isSpeakingToStudent ? 'Stop speaking to student' : 'Speak to student'}
            >
              {isSpeakingToStudent ? <FiMicOff size={16} /> : <FiMic size={16} />}
            </button>
            
            <button
              onClick={toggleMute}
              className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-md transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-md transition-colors"
              title="Fullscreen"
            >
              <FiMaximize2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main viewer component
 */
const LiveStreamViewer = ({ testid }) => {
  const [activeStreams, setActiveStreams] = useState([]);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');

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
        console.log('[LiveStreamViewer] Active streams:', activeUserIds);
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

  // Filter and sort students
  const filteredAndSortedStreams = useMemo(() => {
    let filtered = activeStreams.filter(userId => {
      const user = users[userId];
      if (!user) return false;
      
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = user.name?.toLowerCase().includes(searchLower);
      const emailMatch = user.email?.toLowerCase().includes(searchLower);
      
      return nameMatch || emailMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      const userA = users[a];
      const userB = users[b];
      
      if (!userA || !userB) return 0;
      
      switch (sortBy) {
        case 'name':
          return (userA.name || '').localeCompare(userB.name || '');
        case 'email':
          return (userA.email || '').localeCompare(userB.email || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [activeStreams, users, searchQuery, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (activeStreams.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
        <FiVideoOff className="text-gray-400 dark:text-gray-500 text-5xl mx-auto mb-4" />
        <p className="text-gray-700 dark:text-gray-400 text-lg font-medium">No active livestreams</p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Students will appear here when they start their exam</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Live Camera Feeds
              </h3>
            </div>
            <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
              {filteredAndSortedStreams.length} / {activeStreams.length}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-colors"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 appearance-none cursor-pointer transition-colors"
              >
                <option value="name">Sort by Name</option>
                <option value="email">Sort by Email</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Grid View"
              >
                <FiGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="List View"
              >
                <FiList size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Student Count Info */}
        {searchQuery && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredAndSortedStreams.length === 0 ? (
                <span>No students found matching "<span className="font-medium">{searchQuery}</span>"</span>
              ) : (
                <span>Showing {filteredAndSortedStreams.length} of {activeStreams.length} students</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Student List/Grid */}
      {filteredAndSortedStreams.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <FiSearch className="text-gray-400 dark:text-gray-500 text-5xl mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-400 text-lg font-medium">No students found</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Try adjusting your search query</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedStreams.map((userId) => {
            const user = users[userId];
            return (
              <StudentStreamCard
                key={`${testid}-${userId}`}
                testid={testid}
                userId={userId}
                userName={user?.name || 'Unknown Student'}
                userEmail={user?.email || 'No email'}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedStreams.map((userId, index) => {
              const user = users[userId];
              return (
                <div key={userId} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FiUser className="text-gray-400 dark:text-gray-500" size={14} />
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user?.name || 'Unknown Student'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {user?.email || 'No email'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 dark:bg-green-900 rounded-full">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">Live</span>
                      </div>
                      <button
                        onClick={() => {
                          // Scroll to the video in grid view
                          setViewMode('grid');
                          setTimeout(() => {
                            const element = document.getElementById(`stream-${userId}`);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }, 100);
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        View Stream
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreamViewer;
