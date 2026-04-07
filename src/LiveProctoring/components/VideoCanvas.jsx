import React, { useRef, useEffect } from 'react';

export const VideoCanvas = ({ videoRef, detections, isActive }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Read live dimensions — video must be playing for these to be non-zero
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    if (!vw || !vh) {
      // Video not ready yet — clear and bail
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Keep canvas pixel dimensions in sync with actual video resolution
    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width = vw;
      canvas.height = vh;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isActive || detections.length === 0) return;

    const personCount = detections.filter(d => d.class === 'person').length;

    // Draw bounding boxes
    detections.forEach((detection) => {
      const [x, y, width, height] = detection.bbox;
      const isPerson = detection.class === 'person';
      const isPhone = detection.class === 'cell phone';
      const confidence = detection.score;

      // --- Colour logic ---
      let color = '#10b981'; // Default green
      if (isPhone) {
        // Phone: amber at high confidence, orange-red at low (partial detection)
        color = confidence >= 0.40 ? '#f59e0b' : '#ef4444';
      } else if (isPerson) {
        color = personCount === 1 ? '#10b981' : '#ef4444';
      }

      // Opacity: lower for weak phone detections so admins can gauge confidence
      const alpha = isPhone ? Math.max(0.60, Math.min(1.0, confidence / 0.35)) : 1.0;

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = isPhone && confidence < 0.4 ? 2 : 3;

      // Dashed border for low-confidence / partial phone detections
      if (isPhone && confidence < 0.30) {
        ctx.setLineDash([8, 4]);
      } else {
        ctx.setLineDash([]);
      }

      // Draw bounding box
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);

      // Label
      let label = '';
      if (isPerson) {
        label = `Person${personCount > 1 ? ' ⚠️' : ''} (${Math.round(confidence * 100)}%)`;
      } else if (isPhone) {
        label = `📱 Phone (${Math.round(confidence * 100)}%)`;
      } else {
        label = `${detection.class} (${Math.round(confidence * 100)}%)`;
      }

      ctx.font = 'bold 13px Arial';
      const labelWidth = ctx.measureText(label).width + 14;
      const labelHeight = 24;
      const labelY = y >= labelHeight ? y - labelHeight : y + height;

      // Label background
      ctx.fillStyle = color;
      ctx.fillRect(x, labelY, labelWidth, labelHeight);

      // Label text
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = 'white';
      ctx.fillText(label, x + 7, labelY + 16);
    });

    ctx.globalAlpha = 1.0;
  }, [detections, isActive, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
};
