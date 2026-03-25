import { useRef, useCallback, useEffect } from 'react';
import { ref, set } from 'firebase/database';
import { database } from '../../firebase';

/**
 * useExamRecorder
 * Records camera+audio stream and screen stream, uploads chunks to Azure Blob Storage,
 * and saves the final URLs to Firebase under ExamRecordings/{testid}/{uid}/
 */
export function useExamRecorder(testid, uid, cameraStream, screenStream, isActive) {
  const camRecorderRef = useRef(null);
  const screenRecorderRef = useRef(null);
  const camBlockIds = useRef([]);
  const screenBlockIds = useRef([]);
  const camBlobName = useRef('');
  const screenBlobName = useRef('');
  const chunkIndexCam = useRef(0);
  const chunkIndexScreen = useRef(0);
  const isUploadingRef = useRef(false);

  const getSupportedMimeType = () => {
    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'video/webm';
  };

  const uploadChunk = useCallback(async (blob, blobName, blockId, blockIds, isLast) => {
    if (!blob || blob.size === 0) return;
    try {
      const formData = new FormData();
      formData.append('chunk', blob);
      formData.append('blobName', blobName);
      formData.append('blockId', blockId);
      formData.append('isLast', String(isLast));
      if (isLast) formData.append('blockIds', JSON.stringify(blockIds));

      const res = await fetch('/api/upload-recording', { method: 'POST', body: formData });
      const data = await res.json();
      if (isLast && data.url) return data.url;
    } catch (err) {
      console.error('[Recorder] Chunk upload error:', err);
    }
    return null;
  }, []);

  const startRecording = useCallback(() => {
    if (!testid || !uid || isUploadingRef.current) return;
    if (!cameraStream && !screenStream) return;

    const mimeType = getSupportedMimeType();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // ── Camera + Mic recording ──────────────────────────────────────────
    if (cameraStream) {
      camBlobName.current = `${testid}/${uid}/camera-${timestamp}.webm`;
      camBlockIds.current = [];
      chunkIndexCam.current = 0;

      try {
        const camRecorder = new MediaRecorder(cameraStream, { mimeType, videoBitsPerSecond: 500000 });
        camRecorderRef.current = camRecorder;

        camRecorder.ondataavailable = async (e) => {
          if (e.data && e.data.size > 0) {
            const idx = chunkIndexCam.current++;
            const blockId = `c${String(idx).padStart(15, '0')}`;
            camBlockIds.current.push(blockId);
            await uploadChunk(e.data, camBlobName.current, blockId, camBlockIds.current, false);
          }
        };

        camRecorder.onstop = async () => {
          const blockId = `c${String(chunkIndexCam.current++).padStart(15, '0')}`;
          camBlockIds.current.push(blockId);
          const emptyBlob = new Blob([], { type: mimeType });
          const url = await uploadChunk(emptyBlob, camBlobName.current, blockId, camBlockIds.current, true);
          if (url) {
            await set(ref(database, `ExamRecordings/${testid}/${uid}/cameraUrl`), url);
            console.log('[Recorder] Camera recording saved:', url);
          }
        };

        camRecorder.start(10000); // 10s chunks
        console.log('[Recorder] Camera recording started');
      } catch (err) {
        console.error('[Recorder] Camera recorder error:', err);
      }
    }

    // ── Screen Share recording ──────────────────────────────────────────
    if (screenStream) {
      screenBlobName.current = `${testid}/${uid}/screen-${timestamp}.webm`;
      screenBlockIds.current = [];
      chunkIndexScreen.current = 0;

      try {
        // Merge screen video with camera audio if available
        let recordStream = screenStream;
        if (cameraStream) {
          const audioTracks = cameraStream.getAudioTracks();
          if (audioTracks.length > 0) {
            const combined = new MediaStream([
              ...screenStream.getVideoTracks(),
              ...audioTracks,
            ]);
            recordStream = combined;
          }
        }

        const screenRecorder = new MediaRecorder(recordStream, { mimeType, videoBitsPerSecond: 800000 });
        screenRecorderRef.current = screenRecorder;

        screenRecorder.ondataavailable = async (e) => {
          if (e.data && e.data.size > 0) {
            const idx = chunkIndexScreen.current++;
            const blockId = `s${String(idx).padStart(15, '0')}`;
            screenBlockIds.current.push(blockId);
            await uploadChunk(e.data, screenBlobName.current, blockId, screenBlockIds.current, false);
          }
        };

        screenRecorder.onstop = async () => {
          const blockId = `s${String(chunkIndexScreen.current++).padStart(15, '0')}`;
          screenBlockIds.current.push(blockId);
          const emptyBlob = new Blob([], { type: mimeType });
          const url = await uploadChunk(emptyBlob, screenBlobName.current, blockId, screenBlockIds.current, true);
          if (url) {
            await set(ref(database, `ExamRecordings/${testid}/${uid}/screenUrl`), url);
            console.log('[Recorder] Screen recording saved:', url);
          }
        };

        screenRecorder.start(10000);
        console.log('[Recorder] Screen recording started');
      } catch (err) {
        console.error('[Recorder] Screen recorder error:', err);
      }
    }

    // Save metadata to Firebase
    set(ref(database, `ExamRecordings/${testid}/${uid}/meta`), {
      startedAt: new Date().toISOString(),
      status: 'recording',
      uid,
      testid,
    });

    isUploadingRef.current = true;
  }, [testid, uid, cameraStream, screenStream, uploadChunk]);

  const stopRecording = useCallback(() => {
    if (camRecorderRef.current && camRecorderRef.current.state !== 'inactive') {
      camRecorderRef.current.stop();
    }
    if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
      screenRecorderRef.current.stop();
    }
    isUploadingRef.current = false;

    if (testid && uid) {
      set(ref(database, `ExamRecordings/${testid}/${uid}/meta/status`), 'completed');
      set(ref(database, `ExamRecordings/${testid}/${uid}/meta/endedAt`), new Date().toISOString());
    }
  }, [testid, uid]);

  // Auto start/stop based on isActive
  useEffect(() => {
    console.log('[Recorder] isActive changed:', isActive, 'cameraStream:', !!cameraStream, 'isUploading:', isUploadingRef.current);
    if (isActive && cameraStream && !isUploadingRef.current) {
      startRecording();
    } else if (!isActive && isUploadingRef.current) {
      console.log('[Recorder] stopping recording because isActive is false');
      stopRecording();
    }
  }, [isActive, cameraStream, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isUploadingRef.current) {
        console.log('[Recorder] cleaning up on unmount');
        stopRecording();
      }
    };
  }, [stopRecording]);

  return { startRecording, stopRecording };
}
