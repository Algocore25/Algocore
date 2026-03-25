import { useCallback, useState, useEffect } from 'react';

export const usePersonDetection = () => {
  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        // cocoSsd is provided globally via a script tag in layout.jsx
        if (!globalThis.cocoSsd) {
          // If not loaded yet, wait a bit or throw error
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
        .filter((prediction) => prediction.class === 'person')
        .map((prediction) => ({
          class: prediction.class,
          score: prediction.score,
          bbox: prediction.bbox,
        }));
    } catch (err) {
      console.error('Detection error:', err);
      return [];
    }
  }, [model]);

  const detectObjects = useCallback(async (videoElement) => {
    if (!model || !videoElement) return { persons: [], phones: [] };

    try {
      const predictions = await model.detect(videoElement);
      const persons = predictions
        .filter((prediction) => prediction.class === 'person')
        .map((prediction) => ({
          class: prediction.class,
          score: prediction.score,
          bbox: prediction.bbox,
        }));

      const phones = predictions
        .filter((prediction) => prediction.class === 'cell phone')
        .map((prediction) => ({
          class: prediction.class,
          score: prediction.score,
          bbox: prediction.bbox,
        }));

      return { persons, phones };
    } catch (err) {
      console.error('Detection error:', err);
      return { persons: [], phones: [] };
    }
  }, [model]);

  return { detectPersons, detectObjects, isLoading, error, modelReady: !!model };
};
