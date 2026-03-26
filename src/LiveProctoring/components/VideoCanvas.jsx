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

    // Draw bounding boxes
    detections.forEach((detection) => {
      const [x, y, width, height] = detection.bbox;
      const isPerson = detection.class === 'person';
      const isPhone = detection.class === 'cell phone';

      // Set box color
      let color = '#10b981'; // Default green
      if (isPhone) {
        color = '#ef4444'; // Red for phone
      } else if (isPerson) {
        const personCount = detections.filter(d => d.class === 'person').length;
        color = personCount === 1 ? '#10b981' : '#ef4444'; // Green if 1 person, Red if multiple
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.fillStyle = color;

      // Draw bounding box
      ctx.strokeRect(x, y, width, height);

      // Draw label background
      let label = '';
      if (isPerson) {
        label = `Person (${Math.round(detection.score * 100)}%)`;
      } else if (isPhone) {
        label = `Mobile Phone (${Math.round(detection.score * 100)}%)`;
      } else {
        label = `${detection.class} (${Math.round(detection.score * 100)}%)`;
      }
      
      const labelWidth = ctx.measureText(label).width + 10;

      ctx.fillRect(x, y - 25, labelWidth, 25);

      // Draw label text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(label, x + 5, y - 8);
    });
  }, [detections, isActive]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
};
