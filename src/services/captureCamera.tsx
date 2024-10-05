import { createDetector, movenet, MoveNetModelConfig, Pose, PoseDetector, SupportedModels } from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';

type PosesCallback = (poses: Pose[]) => void;

export class PoseDetectionContainer {
  private videoElement: HTMLVideoElement;
  private detectorPromise!: Promise<PoseDetector>;
  private rafId: number | null = null;
  private inferenceTimeSum = 0;
  private numInferences = 0;

  constructor(video: HTMLVideoElement, callback: PosesCallback) {
    this.videoElement = video;
    this.initializeModel(callback);
  }

  private async initializeModel(callback: PosesCallback) {
    try {
      await tf.ready();

      const detectionModel = SupportedModels.MoveNet;
      const moveNetMultiConfig: MoveNetModelConfig = {
        modelType: movenet.modelType.MULTIPOSE_LIGHTNING,
      };

      console.log("Creating MoveNet detector...");
      this.detectorPromise = createDetector(detectionModel, moveNetMultiConfig);
      this.startDetection(callback);
    } catch (error) {
      console.error("Error initializing Pose Detection Model:", error);
      alert("Failed to initialize pose detection. Please refresh or try a different device.");
    }
  }

  private async startDetection(callback: PosesCallback) {
    try {
      const detector = await this.detectorPromise;
      console.log("Pose Detector is ready.");

      const detectPoses = async () => {
        if (this.videoElement.readyState < 2) {
          await new Promise<void>((resolve) => {
            this.videoElement.onloadeddata = () => {
              resolve();
            };
          });
        }

        const startInferenceTime = performance.now();

        try {
          const poses = await detector.estimatePoses(this.videoElement, {
            maxPoses: 4,
            flipHorizontal: false,
          });
          callback(this.smoothPoses(poses));
        } catch (error) {
          console.error("Error estimating poses:", error);
        }

        const endInferenceTime = performance.now();
        this.inferenceTimeSum += endInferenceTime - startInferenceTime;
        this.numInferences++;

        if (this.rafId !== null) {
          this.rafId = requestAnimationFrame(detectPoses);
        }
      };

      detectPoses();
    } catch (error) {
      console.error("Error in startDetection:", error);
    }
  }

  private smoothPoses(poses: Pose[]): Pose[] {
    // Implement a simple moving average filter or other smoothing technique here
    // For now, we'll return the raw poses directly as a placeholder
    return poses;
  }

  public stopDetection() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
export async function captureCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
    }
  
    const videoConfig = {
      audio: false,
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
    };
  
    const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
    videoElement.srcObject = stream;
  
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        resolve(videoElement);
      };
    });
  
    videoElement.play();
    return stream;  // Ensure this returns the MediaStream
  }