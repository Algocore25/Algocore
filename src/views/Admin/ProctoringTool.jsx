import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePersonDetection } from '../../LiveProctoring/hooks/usePersonDetection';

const COLORS = {
  person_ok: '#10b981',
  person_bad: '#ef4444',
  phone: '#f59e0b',
};

const ProctoringTool = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const animFrameRef = useRef(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [detections, setDetections] = useState([]);
  const [stats, setStats] = useState({ persons: 0, phones: 0, totalPersonViolations: 0, totalPhoneViolations: 0 });
  const [log, setLog] = useState([]);
  const [error, setError] = useState('');
  const prevPhoneCount = useRef(0);
  const prevPersonCount = useRef(-1);

  const { detectObjects, isLoading, modelReady, error: modelError } = usePersonDetection();

  // ── Draw bounding boxes ──────────────────────────────────────────────
  const drawBoxes = useCallback((dets) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    dets.forEach(({ class: cls, bbox, score }) => {
      const [x, y, w, h] = bbox;
      const isPhone = cls === 'cell phone';
      const isPerson = cls === 'person';
      const personCount = dets.filter(d => d.class === 'person').length;

      let color = COLORS.person_ok;
      if (isPhone) color = COLORS.phone;
      else if (isPerson && (personCount !== 1)) color = COLORS.person_bad;

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      const label = isPhone
        ? `📱 Phone (${Math.round(score * 100)}%)`
        : `👤 Person (${Math.round(score * 100)}%)`;

      ctx.font = 'bold 14px sans-serif';
      const tw = ctx.measureText(label).width + 12;
      ctx.fillStyle = color;
      ctx.fillRect(x, y - 26, tw, 26);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, x + 6, y - 8);
    });
  }, []);

  // ── Detection loop ───────────────────────────────────────────────────
  const runDetection = useCallback(async () => {
    if (!videoRef.current || !modelReady) return;
    const { persons, phones } = await detectObjects(videoRef.current);
    const all = [...persons, ...phones];
    setDetections(all);
    drawBoxes(all);

    const pCount = persons.length;
    const phCount = phones.length;

    setStats(prev => {
      const newStats = { ...prev, persons: pCount, phones: phCount };

      // Person violation (changed from OK to bad)
      const wasOk = prevPersonCount.current === 1;
      const isOk = pCount === 1;
      if (!isOk && wasOk) {
        const reason = pCount === 0 ? 'No person detected' : `Multiple persons (${pCount})`;
        setLog(l => [{ time: new Date().toLocaleTimeString(), msg: reason, type: 'person' }, ...l.slice(0, 49)]);
        newStats.totalPersonViolations = prev.totalPersonViolations + 1;
      }
      prevPersonCount.current = pCount;

      // Phone violation (new phone appeared)
      if (phCount > 0 && prevPhoneCount.current === 0) {
        setLog(l => [{ time: new Date().toLocaleTimeString(), msg: 'Mobile phone detected!', type: 'phone' }, ...l.slice(0, 49)]);
        newStats.totalPhoneViolations = prev.totalPhoneViolations + 1;
      }
      prevPhoneCount.current = phCount;

      return newStats;
    });
  }, [detectObjects, modelReady, drawBoxes]);

  // ── Camera start / stop ──────────────────────────────────────────────
  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsStreaming(true);
    } catch (e) {
      setError(`Camera error: ${e.message}`);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsStreaming(false);
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setDetections([]);
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };

  // ── Detection start / stop ───────────────────────────────────────────
  const startDetection = () => {
    if (!isStreaming || !modelReady) return;
    setIsRunning(true);
    intervalRef.current = setInterval(runDetection, 800);
  };

  const stopDetection = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  const resetStats = () => {
    setStats({ persons: 0, phones: 0, totalPersonViolations: 0, totalPhoneViolations: 0 });
    setLog([]);
    prevPersonCount.current = -1;
    prevPhoneCount.current = 0;
  };

  // ── Cleanup on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopCamera();
      clearInterval(intervalRef.current);
    };
  }, []);

  // ── Status derive ────────────────────────────────────────────────────
  const statusInfo = (() => {
    if (!isRunning) return { label: 'Idle', color: 'bg-gray-500', text: 'text-gray-600 dark:text-gray-400' };
    if (stats.phones > 0) return { label: '📱 PHONE DETECTED', color: 'bg-amber-500 animate-pulse', text: 'text-amber-600 dark:text-amber-400' };
    if (stats.persons === 0) return { label: '⚠ NO PERSON', color: 'bg-red-500 animate-pulse', text: 'text-red-600 dark:text-red-400' };
    if (stats.persons > 1) return { label: `⚠ ${stats.persons} PERSONS`, color: 'bg-red-500 animate-pulse', text: 'text-red-600 dark:text-red-400' };
    return { label: '✅ COMPLIANT', color: 'bg-green-500', text: 'text-green-600 dark:text-green-400' };
  })();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <span className="text-2xl">🔬</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proctoring Lab</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Admin-only detection test tool — not used in real exams</p>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">AI Model:</span>
          {isLoading
            ? <span className="text-xs text-gray-500 dark:text-gray-400">Loading COCO-SSD…</span>
            : modelReady
              ? <span className="text-xs font-bold text-green-600 dark:text-green-400">✓ Ready</span>
              : <span className="text-xs text-red-600 dark:text-red-400">{modelError || 'Failed'}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Video Panel ── */}
        <div className="xl:col-span-2 space-y-4">
          {/* Video card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>Live Camera Feed</span>
                {isRunning && (
                  <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    LIVE
                  </span>
                )}
              </h2>
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.color}`} />
                <span className={`text-xs font-bold ${statusInfo.text}`}>{statusInfo.label}</span>
              </div>
            </div>

            {/* Video container */}
            <div className="relative bg-black aspect-video">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ objectFit: 'cover' }} />

              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                  <div className="text-center">
                    <span className="text-5xl">📷</span>
                    <p className="mt-3 text-white text-sm font-medium">Camera not active</p>
                    <p className="text-gray-400 text-xs mt-1">Click "Start Camera" to begin</p>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-blue-600/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading AI…
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="px-5 py-4 flex flex-wrap gap-3">
              {!isStreaming ? (
                <button
                  onClick={startCamera}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  📷 Start Camera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  ⏹ Stop Camera
                </button>
              )}

              {isStreaming && !isRunning ? (
                <button
                  onClick={startDetection}
                  disabled={!modelReady}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  ▶ Start Detection
                </button>
              ) : isRunning ? (
                <button
                  onClick={stopDetection}
                  className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  ⏸ Pause Detection
                </button>
              ) : null}

              <button
                onClick={resetStats}
                className="flex items-center gap-2 px-5 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                🔄 Reset Stats
              </button>
            </div>

            {error && (
              <div className="mx-5 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Detection Legend</h3>
            <div className="flex flex-wrap gap-4">
              {[
                { color: COLORS.person_ok, label: 'Single person (compliant)' },
                { color: COLORS.person_bad, label: 'Zero / multiple persons (violation)' },
                { color: COLORS.phone, label: 'Mobile phone (violation)' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-4 h-1.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Stats & Log Panel ── */}
        <div className="space-y-4">
          {/* Live counts */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Live Detection</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  icon: '👤',
                  label: 'Persons in frame',
                  value: stats.persons,
                  ok: stats.persons === 1,
                  bad: stats.persons === 0 || stats.persons > 1,
                },
                {
                  icon: '📱',
                  label: 'Phones in frame',
                  value: stats.phones,
                  ok: stats.phones === 0,
                  bad: stats.phones > 0,
                },
              ].map(({ icon, label, value, ok, bad }) => (
                <div key={label} className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <span className="text-2xl">{icon}</span>
                  <p className={`text-3xl font-black mt-1 ${bad ? 'text-red-500 dark:text-red-400' : ok ? 'text-green-500 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Session violations */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Session Violations</h3>
            <div className="space-y-3">
              {[
                { icon: '👤', label: 'Person violations', value: stats.totalPersonViolations, color: 'text-red-600 dark:text-red-400' },
                { icon: '📱', label: 'Phone detections', value: stats.totalPhoneViolations, color: 'text-amber-600 dark:text-amber-400' },
              ].map(({ icon, label, value, color }) => (
                <div key={label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </div>
                  <span className={`text-lg font-black ${color}`}>{value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span>⚠️</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Total events</span>
                </div>
                <span className="text-lg font-black text-gray-800 dark:text-gray-200">
                  {stats.totalPersonViolations + stats.totalPhoneViolations}
                </span>
              </div>
            </div>
          </div>

          {/* Event log */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Event Log</h3>
              {log.length > 0 && (
                <button
                  onClick={() => setLog([])}
                  className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {log.length === 0 ? (
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-6">No events yet</p>
              ) : (
                log.map((entry, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border-l-4 text-xs ${entry.type === 'phone'
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-amber-800 dark:text-amber-300'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-400 text-red-800 dark:text-red-300'
                      }`}
                  >
                    <span className="font-mono text-[10px] shrink-0 opacity-70 mt-0.5">{entry.time}</span>
                    <span className="font-medium">{entry.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProctoringTool;
