/// <reference lib="webworker" />

import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as poseDetection from '@tensorflow-models/pose-detection';

let detector: poseDetection.PoseDetector | null = null;

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
