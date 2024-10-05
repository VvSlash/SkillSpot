import { createDetector, movenet, MoveNetModelConfig, Pose, PoseDetector, SupportedModels } from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';

type PosesCallback = (poses: Pose[]) => void;

export class PoseDetectionContainer {
  private videoElement: HTMLVideoElement;
  private detectorPromise!: Promise<PoseDetector>;
  private rafId: number | null = null;

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

        try {
          const poses = await detector.estimatePoses(this.videoElement, {
            maxPoses: 4,
            flipHorizontal: false,
          });
          callback(poses);
        } catch (error) {
          console.error("Error estimating poses:", error);
        }

        if (this.rafId !== null) {
          this.rafId = requestAnimationFrame(detectPoses);
        }
      };

      detectPoses();
    } catch (error) {
      console.error("Error in startDetection:", error);
    }
  }

  public stopDetection() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
