import { useCallback, useState, useEffect, useRef } from 'react';

// ─── Thresholds ──────────────────────────────────────────────────────────────
const PERSON_MIN_SCORE = 0.45;  // Standard threshold for persons
const PHONE_MIN_SCORE  = 0.25;  // Increased from 0.12 to reduce false positives
const REMOTE_AS_PHONE_MIN_SCORE = 0.35; // Increased from 0.20 for better accuracy
const IOU_DEDUP_THRESHOLD = 0.35; // Suppress duplicate phone boxes

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Intersection-over-Union between two [x, y, w, h] bboxes.
 */
function iou([ax, ay, aw, ah], [bx, by, bw, bh]) {
  const ix = Math.max(ax, bx);
  const iy = Math.max(ay, by);
  const iw = Math.min(ax + aw, bx + bw) - ix;
  const ih = Math.min(ay + ah, by + bh) - iy;
  if (iw <= 0 || ih <= 0) return 0;
  const intersection = iw * ih;
  const union = aw * ah + bw * bh - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Filter phone detections by realistic size constraints.
 * Phones are typically small objects relative to the frame.
 */
function filterBySize(detections, frameWidth, frameHeight) {
  const minPhoneSize = Math.min(frameWidth, frameHeight) * 0.03; // 3% of smaller dimension
  const maxPhoneSize = Math.min(frameWidth, frameHeight) * 0.15; // 15% of smaller dimension
  
  return detections.filter(d => {
    const [x, y, w, h] = d.bbox;
    const area = w * h;
    const aspectRatio = w / h;
    
    // Filter by size
    if (area < minPhoneSize * minPhoneSize || area > maxPhoneSize * maxPhoneSize) {
      return false;
    }
    
    // Filter by aspect ratio (phones are typically taller than wide)
    if (aspectRatio < 0.3 || aspectRatio > 2.0) {
      return false;
    }
    
    return true;
  });
}

/**
 * Remove boxes that overlap heavily with a higher-confidence box.
 */
function nms(detections) {
  const sorted = [...detections].sort((a, b) => b.score - a.score);
  const keep = [];
  const suppressed = new Set();

  for (let i = 0; i < sorted.length; i++) {
    if (suppressed.has(i)) continue;
    keep.push(sorted[i]);
    for (let j = i + 1; j < sorted.length; j++) {
      if (iou(sorted[i].bbox, sorted[j].bbox) > IOU_DEDUP_THRESHOLD) {
        suppressed.add(j);
      }
    }
  }
  return keep;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export const usePersonDetection = () => {
  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Temporal consistency tracking
  const phoneDetectionHistory = useRef([]);
  const lastFrameTime = useRef(0);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        // cocoSsd is provided globally via a script tag in layout.jsx
        if (!globalThis.cocoSsd) {
          throw new Error('CocoSsd script not found on globalThis. Ensure the script is included in layout.jsx.');
        }
        const loadedModel = await globalThis.cocoSsd.load();
        setModel(loadedModel);
        setError(null);
        console.log('Detection model loaded successfully');
      } catch (err) {
        setError(err.message || 'Failed to load detection model');
        console.error('Model loading error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadModel();
  }, []);

  const detectPersons = useCallback(async (videoElement) => {
    if (!model || !videoElement) return [];

    try {
      const predictions = await model.detect(videoElement);
      return predictions
        .filter((p) => p.class === 'person' && p.score >= PERSON_MIN_SCORE)
        .map((p) => ({ class: p.class, score: p.score, bbox: p.bbox }));
    } catch (err) {
      console.error('Detection error:', err);
      return [];
    }
  }, [model]);

  const detectObjects = useCallback(async (videoElement) => {
    if (!model || !videoElement) return { persons: [], phones: [] };

    try {
      const currentTime = Date.now();
      const frameWidth = videoElement.videoWidth || 640;
      const frameHeight = videoElement.videoHeight || 480;
      
      // ── Pass 1: standard detection (used for persons) ──────────────────
      const standard = await model.detect(videoElement);

      const persons = standard
        .filter((p) => p.class === 'person' && p.score >= PERSON_MIN_SCORE)
        .map((p) => ({ class: p.class, score: p.score, bbox: p.bbox }));

      // ── Pass 2: aggressive low-threshold detection for phones ──────────
      // maxNumBoxes=20, minScore very low so partial / angled phones are caught
      let sensitive = [];
      try {
        sensitive = await model.detect(videoElement, 20, PHONE_MIN_SCORE);
      } catch (_) {
        sensitive = standard; // fallback if overload not supported
      }

      // Collect phone-class detections from both passes
      const phoneMap = new Map(); // bbox key → detection

      const addPhone = (p, label = 'cell phone') => {
        const key = p.bbox.map(Math.round).join(',');
        if (!phoneMap.has(key) || phoneMap.get(key).score < p.score) {
          phoneMap.set(key, { class: label, score: p.score, bbox: p.bbox });
        }
      };

      // From standard pass
      standard
        .filter((p) => p.class === 'cell phone')
        .forEach((p) => addPhone(p));

      // From sensitive pass — cell phone + remote (common misclassification)
      sensitive
        .filter((p) => p.class === 'cell phone' && p.score >= PHONE_MIN_SCORE)
        .forEach((p) => addPhone(p));

      sensitive
        .filter((p) => p.class === 'remote' && p.score >= REMOTE_AS_PHONE_MIN_SCORE)
        .forEach((p) => addPhone(p, 'cell phone')); // relabel as cell phone

      // Convert to array and apply size filtering
      let phones = Array.from(phoneMap.values());
      phones = filterBySize(phones, frameWidth, frameHeight);

      // Dedup via IoU-based NMS
      phones = nms(phones);

      // Apply temporal consistency - require phone to be detected consistently
      const currentDetection = {
        phones: phones,
        timestamp: currentTime,
        count: phones.length
      };

      // Maintain history of last 3 detections
      phoneDetectionHistory.current.push(currentDetection);
      if (phoneDetectionHistory.current.length > 3) {
        phoneDetectionHistory.current.shift();
      }

      // Only report phone if detected in at least 2 of last 3 frames
      const recentDetections = phoneDetectionHistory.current.slice(-3);
      const framesWithPhone = recentDetections.filter(d => d.count > 0).length;
      
      if (framesWithPhone < 2 && recentDetections.length === 3) {
        // Not consistently detected, clear phones
        phones = [];
      }

      // Log detection info for debugging
      if (phones.length > 0) {
        console.log('📱 Phone detected:', {
          count: phones.length,
          scores: phones.map(p => p.score.toFixed(3)),
          consistency: `${framesWithPhone}/3 frames`,
          history: recentDetections.map(d => d.count)
        });
      }

      return { persons, phones };
    } catch (err) {
      console.error('Detection error:', err);
      return { persons: [], phones: [] };
    }
  }, [model]);

  return { detectPersons, detectObjects, isLoading, error, modelReady: !!model };
};
