/// <reference lib="webworker" />

// Import types only, with aliases to avoid naming conflicts
import type * as poseDetectionTypes from '@tensorflow-models/pose-detection';
import type * as tfTypes from '@tensorflow/tfjs-core';

// Declare global variables for TensorFlow.js and Pose Detection
declare const tf: typeof tfTypes;
declare const poseDetection: typeof poseDetectionTypes;

// Import scripts in the worker
self.importScripts(
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.8.0/dist/tf-core.min.js',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.8.0/dist/tf-backend-webgl.min.js',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@4.4.0/dist/pose-detection.min.js'
);

let detector: poseDetectionTypes.PoseDetector | null = null;

const initializeDetector = async () => {
  await tf.setBackend('webgl');
  await tf.ready();
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    }
  );
};

self.onmessage = async (event: MessageEvent) => {
  const { type, data } = event.data;

  if (type === 'init') {
    await initializeDetector();
    self.postMessage({ type: 'init', status: 'success' });
  } else if (type === 'estimate' && detector) {
    const imageBitmap = data as ImageBitmap;
    const poses = await detector.estimatePoses(imageBitmap, {
      flipHorizontal: false,
    });
    self.postMessage({ type: 'result', poses });
    imageBitmap.close();
  }
};
