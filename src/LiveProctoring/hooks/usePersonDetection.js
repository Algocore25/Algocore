import { useCallback, useState, useEffect, useRef } from 'react';

// ─── Thresholds ──────────────────────────────────────────────────────────────
const PERSON_MIN_SCORE = 0.40;  // Slightly lower to detect partially occluded persons
const PHONE_MIN_SCORE  = 0.20;  // Lower to catch angled / partially occluded phones
const REMOTE_AS_PHONE_MIN_SCORE = 0.25; // Remote controls often misclassified as phone
const IOU_DEDUP_THRESHOLD = 0.40; // Suppress duplicate phone boxes

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
 * Phones can range from a small object in the background to filling
 * most of the frame if held close to the camera.
 */
function filterBySize(detections, frameWidth, frameHeight) {
  const frameArea = frameWidth * frameHeight;
  const minPhoneArea = frameArea * 0.003;  // at least 0.3% of frame area
  const maxPhoneArea = frameArea * 0.60;   // at most 60% (held very close)

  return detections.filter(d => {
    const [x, y, w, h] = d.bbox;
    const area = w * h;
    const aspectRatio = w / h;

    // Filter by area
    if (area < minPhoneArea || area > maxPhoneArea) {
      return false;
    }

    // Filter by aspect ratio (phones are typically portrait or landscape)
    // Allow wider range: 0.2 (very tall/narrow) to 3.5 (very wide/landscape)
    if (aspectRatio < 0.20 || aspectRatio > 3.5) {
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

  // Temporal smoothing: track phone presence over sliding window
  const phoneHistoryRef = useRef([]); // array of booleans (was phone detected?)
  const HISTORY_WINDOW = 3;           // look at last N frames
  const CONFIRM_THRESHOLD = 1;        // phone confirmed if detected in >= 1 of N frames

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        // cocoSsd is provided globally via a script tag in layout.jsx
        if (!globalThis.cocoSsd) {
          throw new Error('CocoSsd script not found on globalThis. Ensure the script is included in layout.jsx.');
        }
        const loadedModel = await globalThis.cocoSsd.load({
          base: 'mobilenet_v2', // faster & more accurate than lite_mobilenet_v2
        });
        setModel(loadedModel);
        setError(null);
        console.log('✅ Detection model loaded successfully');
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

    // Guard: video must have valid dimensions
    const frameWidth = videoElement.videoWidth;
    const frameHeight = videoElement.videoHeight;
    if (!frameWidth || !frameHeight) return { persons: [], phones: [] };

    try {
      // ── Pass 1: standard detection at default threshold ──────────────────
      const standard = await model.detect(videoElement);

      // Persons from standard pass
      const persons = standard
        .filter((p) => p.class === 'person' && p.score >= PERSON_MIN_SCORE)
        .map((p) => ({ class: p.class, score: p.score, bbox: p.bbox }));

      // ── Pass 2: low-threshold detection for phones ───────────────────────
      // Increase box count and lower score to catch partially-visible phones
      let sensitive = [];
      try {
        sensitive = await model.detect(videoElement, 20, PHONE_MIN_SCORE);
      } catch (_) {
        sensitive = standard; // fallback if overloaded args not supported
      }

      // Collect phone-class detections from both passes into a map
      const phoneMap = new Map(); // bbox key → detection

      const addPhone = (p, label = 'cell phone') => {
        const key = p.bbox.map(v => Math.round(v)).join(',');
        if (!phoneMap.has(key) || phoneMap.get(key).score < p.score) {
          phoneMap.set(key, { class: label, score: p.score, bbox: p.bbox });
        }
      };

      // From standard pass — cell phone
      standard
        .filter((p) => p.class === 'cell phone')
        .forEach((p) => addPhone(p));

      // From sensitive pass — cell phone
      sensitive
        .filter((p) => p.class === 'cell phone' && p.score >= PHONE_MIN_SCORE)
        .forEach((p) => addPhone(p));

      // From sensitive pass — remote (common COCO misclassification for phones)
      sensitive
        .filter((p) => p.class === 'remote' && p.score >= REMOTE_AS_PHONE_MIN_SCORE)
        .forEach((p) => addPhone(p, 'cell phone'));

      // Also catch 'book' class sometimes confused for a phone in partial views
      sensitive
        .filter((p) => p.class === 'book' && p.score >= 0.40)
        .forEach((p) => addPhone(p, 'cell phone'));

      // Convert to array
      let phones = Array.from(phoneMap.values());

      // Size filter (generous limits)
      phones = filterBySize(phones, frameWidth, frameHeight);

      // Dedup via IoU-based NMS
      phones = nms(phones);

      // ── Temporal smoothing ───────────────────────────────────────────────
      // Track whether a phone was detected this frame
      phoneHistoryRef.current.push(phones.length > 0);
      if (phoneHistoryRef.current.length > HISTORY_WINDOW) {
        phoneHistoryRef.current.shift();
      }

      // Count how many recent frames had a phone detection
      const recentPositive = phoneHistoryRef.current.filter(Boolean).length;

      // Suppress only if we have a full history AND zero recent positives
      // This is intentionally lenient — 1 positive in 3 frames is enough to report
      if (
        phoneHistoryRef.current.length >= HISTORY_WINDOW &&
        recentPositive < CONFIRM_THRESHOLD
      ) {
        phones = [];
      }

      // Debug logging
      if (phones.length > 0 || persons.length !== 1) {
        console.log('🔍 Detection:', {
          persons: persons.length,
          phones: phones.length,
          phoneScores: phones.map(p => p.score.toFixed(3)),
          consistency: `${recentPositive}/${phoneHistoryRef.current.length}`,
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
