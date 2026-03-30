import React, { useRef, useEffect } from 'react';

export const VideoCanvas = ({ videoRef, detections, isActive }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

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
        color = confidence >= 0.4 ? '#f59e0b' : '#ef4444';
      } else if (isPerson) {
        color = personCount === 1 ? '#10b981' : '#ef4444';
      }

      // Opacity: lower for weak phone detections so admins can gauge confidence
      const alpha = isPhone ? Math.max(0.55, Math.min(1.0, confidence / 0.4)) : 1.0;

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = isPhone && confidence < 0.4 ? 2 : 3;

      // Dashed border for low-confidence / partial phone detections
      if (isPhone && confidence < 0.35) {
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
        label = `Person (${Math.round(confidence * 100)}%)`;
      } else if (isPhone) {
        const qualifier = confidence < 0.35 ? ' partial' : confidence < 0.5 ? '' : '';
        label = `📱 Phone${qualifier} (${Math.round(confidence * 100)}%)`;
      } else {
        label = `${detection.class} (${Math.round(confidence * 100)}%)`;
      }

      ctx.font = 'bold 13px Arial';
      const labelWidth = ctx.measureText(label).width + 12;
      ctx.fillStyle = color;
      ctx.fillRect(x, y - 24, labelWidth, 24);

      // Label text
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = 'white';
      ctx.fillText(label, x + 6, y - 7);
    });

    ctx.globalAlpha = 1.0;
  }, [detections, isActive]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
};
