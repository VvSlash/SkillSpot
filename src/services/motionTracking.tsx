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
import '@tensorflow/tfjs-backend-webgl'; // Ensure WebGL backend is imported
import * as tf from '@tensorflow/tfjs';

// Typ definiujący funkcję callback, która będzie przyjmować wykryte pozycje
type PosesCallback = (poses: Pose[]) => void;

// Klasa PoseDetectionContainer
export class PoseDetectionContainer {
  private videoElement: HTMLVideoElement; // Element video, z którego będą pobierane dane do analizy
  private detectorPromise!: Promise<PoseDetector>; // Obietnica utworzenia detektora pozycji
  private rafId: number | null = null; // Identyfikator requestAnimationFrame
  private inferenceTimeSum = 0; // Sumaryczny czas wnioskowania, używany do obliczania średniego czasu wnioskowania
  private numInferences = 0; // Liczba wykonanych wnioskowań
  private lastPanelUpdate = 0; // Czas ostatniej aktualizacji panelu
  private callback: PosesCallback; // Funkcja callback do przetwarzania wykrytych pozycji
  private isDetecting: boolean = false; // Flaga kontrolująca pętlę wykrywania

  constructor(video: HTMLVideoElement, callback: PosesCallback) {
    this.videoElement = video;
    this.callback = callback;
    this.initializeModel();
  }

  // Inicjalizacja modelu MoveNet
  private async initializeModel() {
    try {
      // Ustawienie backendu TensorFlow.js na WebGL i oczekiwanie na gotowość
      await tf.setBackend('webgl');
      await tf.ready();

      const backend = tf.getBackend();
      console.log(`Current TensorFlow.js backend: ${backend}`);

      const detectionModel = SupportedModels.MoveNet;
      const moveNetMultiConfig: MoveNetModelConfig = {
        modelType: movenet.modelType.SINGLEPOSE_LIGHTNING,
      };

      console.log('Creating MoveNet detector...');
      this.detectorPromise = createDetector(detectionModel, moveNetMultiConfig);

      // Oczekiwanie na utworzenie detektora, zanim rozpocznie się wykrywanie
      await this.detectorPromise;

      this.startDetection();
    } catch (error) {
      console.error('Error initializing Pose Detection Model:', error);
    }
  }

  // Rozpoczęcie wykrywania pozycji
  public async startDetection() {
    try {
      const detector = await this.detectorPromise;
      console.log('Pose Detector is ready.');

      this.isDetecting = true;

      const poseInterval = 33; // Interwał wykrywania (w ms) - około 30 klatek na sekundę
      let lastPoseTime = 0;

      // Funkcja do wykrywania pozycji
      const detectPoses = async (timestamp: number) => {
        if (!this.isDetecting) return;

        if (this.videoElement.readyState < 2) {
          await new Promise<void>((resolve) => {
            this.videoElement.onloadeddata = () => {
              resolve();
            };
          });
        }

        // Przepuszczenie wykrywania co zadany interwał czasowy
        if (!lastPoseTime || timestamp - lastPoseTime >= poseInterval) {
          lastPoseTime = timestamp;

          const startInferenceTime = performance.now();

          try {
            // Wykrywanie pozycji na podstawie obrazu z elementu video
            const poses = await detector.estimatePoses(this.videoElement, {
              maxPoses: 4,
              flipHorizontal: false,
            });
            this.callback(poses);
          } catch (error) {
            console.error('Error during pose detection:', error);
          }

          const endInferenceTime = performance.now();
          this.inferenceTimeSum += endInferenceTime - startInferenceTime;
          this.numInferences += 1;

          // Aktualizacja panelu statystyk co 1000 ms
          const panelUpdateMilliseconds = 1000;
          if (endInferenceTime - this.lastPanelUpdate >= panelUpdateMilliseconds) {
            const averageInferenceTime = this.inferenceTimeSum / this.numInferences;
            this.inferenceTimeSum = 0;
            this.numInferences = 0;
            // Możliwość zalogowania średniego czasu wnioskowania
            // console.log(`Average Inference Time: ${averageInferenceTime.toFixed(2)}ms`);
            this.lastPanelUpdate = endInferenceTime;
          }
        }

        this.rafId = requestAnimationFrame(detectPoses);
      };

      this.rafId = requestAnimationFrame(detectPoses);
    } catch (error) {
      console.error('Error starting detection:', error);
    }
  }

  // Zatrzymanie wykrywania pozycji
  public stopDetection() {
    this.isDetecting = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Stop the video stream
    if (this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  }
}

/*
  Podsumowanie:
  - Klasa PoseDetectionContainer obsługuje wykrywanie pozycji użytkownika za pomocą modelu MoveNet.
  - Inicjalizuje model, ustawia backend na WebGL, rozpoczyna pętlę wykrywania i przekazuje wykryte pozycje do callbacku.
  - Funkcja startDetection odpowiada za uruchomienie wykrywania w pętli, a stopDetection za zatrzymanie.
  - Klasa zarządza średnim czasem wnioskowania, co umożliwia monitorowanie wydajności modelu.
*/