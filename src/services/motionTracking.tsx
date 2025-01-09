/*
  Plik: /src/services/motionTracking.tsx
  Opis:
  Plik zawiera definicję klasy PoseDetectionContainer, która obsługuje wykrywanie pozycji użytkownika za pomocą modelu TensorFlow MoveNet. 
  Klasa ta jest odpowiedzialna za inicjalizację modelu, śledzenie pozycji w czasie rzeczywistym oraz przekazywanie wyników do odpowiedniego callbacku.
*/

import {
  createDetector,
  movenet,
  MoveNetModelConfig,
  Pose,
  PoseDetector,
  SupportedModels,
} from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';
import { Keypoint } from '../components/CanvasRenderer';

// Typ definiujący funkcję callback, która będzie przyjmować przetworzone punkty kluczowe
type KeypointsCallback = (keypoints: Keypoint[]) => void;

// Mapowanie indeksów punktów kluczowych na ich nazwy i kolory
const KEYPOINT_CONFIG = {
  leftWrist: { index: 9, color: 'red' },
  rightWrist: { index: 10, color: 'blue' },
  leftAnkle: { index: 15, color: 'green' },
  rightAnkle: { index: 16, color: 'yellow' },
} as const;

// Klasa PoseDetectionContainer
export class PoseDetectionContainer {
  private videoElement: HTMLVideoElement;
  private detector: PoseDetector | null = null;
  private rafId: number | null = null;
  private inferenceTimeSum = 0;
  private numInferences = 0;
  private lastPanelUpdate = 0;
  private callback: KeypointsCallback;
  private isDetecting: boolean = false;

  constructor(video: HTMLVideoElement, callback: KeypointsCallback) {
    this.videoElement = video;
    this.callback = callback;
    this.initializeModel();
  }

  // Mapowanie punktów kluczowych z modelu na format aplikacji
  private mapKeypoints(poses: Pose[]): Keypoint[] {
    if (!poses.length) return [];

    const keypoints = poses[0].keypoints;
    return Object.entries(KEYPOINT_CONFIG).map(([id, config]) => ({
      id,
      x: keypoints[config.index]?.x ?? null,
      y: keypoints[config.index]?.y ?? null,
      color: config.color,
    }));
  }

  // Inicjalizacja modelu MoveNet
  private async initializeModel() {
    try {
      await tf.setBackend('webgl');
      await tf.ready();

      const backend = tf.getBackend();
      console.log(`Current TensorFlow.js backend: ${backend}`);

      const detectionModel = SupportedModels.MoveNet;
      const moveNetMultiConfig: MoveNetModelConfig = {
        modelType: movenet.modelType.SINGLEPOSE_LIGHTNING,
      };

      console.log('Creating MoveNet detector...');
      this.detector = await createDetector(detectionModel, moveNetMultiConfig);
      console.log('MoveNet detector created successfully');
    } catch (error) {
      console.error('Error initializing Pose Detection Model:', error);
      this.detector = null;
    }
  }

  // Rozpoczęcie wykrywania pozycji
  public async startDetection() {
    if (!this.detector) {
      console.log('Waiting for detector initialization...');
      await this.initializeModel();
      if (!this.detector) {
        console.error('Failed to initialize detector');
        return;
      }
    }

    try {
      console.log('Starting pose detection...');
      this.isDetecting = true;

      const poseInterval = 33;
      let lastPoseTime = 0;

      const detectPoses = async (timestamp: number) => {
        if (!this.isDetecting || !this.detector) return;

        if (this.videoElement.readyState < 2) {
          await new Promise<void>((resolve) => {
            this.videoElement.onloadeddata = () => {
              resolve();
            };
          });
        }

        if (!lastPoseTime || timestamp - lastPoseTime >= poseInterval) {
          lastPoseTime = timestamp;

          const startInferenceTime = performance.now();

          try {
            const poses = await this.detector.estimatePoses(this.videoElement, {
              maxPoses: 4,
              flipHorizontal: false,
            });
            
            // Mapowanie i przekazanie przetworzonych punktów kluczowych
            const mappedKeypoints = this.mapKeypoints(poses);
            this.callback(mappedKeypoints);
          } catch (error) {
            console.error('Error during pose detection:', error);
          }

          const endInferenceTime = performance.now();
          this.inferenceTimeSum += endInferenceTime - startInferenceTime;
          this.numInferences += 1;

          const panelUpdateMilliseconds = 1000;
          if (endInferenceTime - this.lastPanelUpdate >= panelUpdateMilliseconds) {
            const averageInferenceTime = this.inferenceTimeSum / this.numInferences;
            this.inferenceTimeSum = 0;
            this.numInferences = 0;
            this.lastPanelUpdate = endInferenceTime;
          }
        }

        if (this.isDetecting) {
          this.rafId = requestAnimationFrame(detectPoses);
        }
      };

      this.rafId = requestAnimationFrame(detectPoses);
    } catch (error) {
      console.error('Error starting detection:', error);
      this.isDetecting = false;
    }
  }

  // Zatrzymanie wykrywania pozycji
  public stopDetection() {
    this.isDetecting = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

/*
  Podsumowanie zmian:
  - Dodano mapowanie punktów kluczowych z modelu na format aplikacji
  - Zdefiniowano stałą KEYPOINT_CONFIG z konfiguracją punktów kluczowych
  - Zmieniono typ callback na KeypointsCallback przyjmujący przetworzone punkty
  - Dodano metodę mapKeypoints do przetwarzania surowych danych z modelu
  - Zmodyfikowano logikę wykrywania, aby używała nowego mapowania
*/