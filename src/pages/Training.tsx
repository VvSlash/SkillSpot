/*
  Plik: /src/pages/Training.tsx
  Opis:
  Komponent Training jest stroną odpowiedzialną za wyświetlanie głównego ekranu treningowego, w którym użytkownik ma możliwość przeprowadzenia ćwiczeń opartych na wizualnych wskazówkach. Komponent ten integruje funkcjonalności związane z śledzeniem ruchu, wyświetlaniem punktów oraz pomiarem czasu reakcji.
*/

import React, { useRef, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
} from '@ionic/react';
import { PoseDetectionContainer } from '../services/motionTracking';
import { captureCamera } from '../utils';
import './Training.css';
import { throttle } from 'lodash';
import { useHistory } from 'react-router-dom';

// Komponent Training
const Training: React.FC = () => {
  // Referencje do elementów video i canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const poseDetectionRef = useRef<any | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Stany komponentu
  const [isTraining, setIsTraining] = useState(false);
  const [hitCount, setHitCount] = useState(0);
  const [totalCues, setTotalCues] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);

  const cueAppearTimeRef = useRef<number | null>(null);
  const targetsRef = useRef<
    Array<{ x: number; y: number; color: string; keypoint: string }>
  >([]);
  const history = useHistory();

  const latestKeypointsRef = useRef<any[]>([]);

  // Funkcja obsługująca rozpoczęcie treningu
  const startTraining = async () => {
    setIsTraining(true);
    setHitCount(0);
    setTotalCues(0);
    setReactionTimes([]);
    targetsRef.current = [];

    const stream = await captureCamera();
    if (canvasRef.current && videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      poseDetectionRef.current = new PoseDetectionContainer(
        videoRef.current,
        handlePoseDetection
      );

      adjustCanvasToVideo();
      startAnimationLoop();
      generateTargets();
    }
  };

  // Funkcja obsługująca zatrzymanie treningu
  const stopTraining = () => {
    setIsTraining(false);

    // Czyszczenie celów
    targetsRef.current = [];

    // Obliczanie statystyk
    const accuracy = totalCues > 0 ? (hitCount / totalCues) * 100 : 0;
    const averageReactionTime =
      reactionTimes.length > 0
        ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
        : 0;

    const sessionData = {
      hitCount: hitCount || 0,
      totalCues: totalCues || 0,
      accuracy: accuracy || 0,
      averageReactionTime: averageReactionTime || 0,
    };

    // Bezpieczne zapisywanie w localStorage
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    localStorage.setItem('sessions', JSON.stringify([...sessions, sessionData]));

    // Nawigacja do ekranu podsumowania
    history.push('/summary');

    // Zatrzymanie strumienia wideo
    if (poseDetectionRef.current) {
      poseDetectionRef.current.stopDetection();
      poseDetectionRef.current = null;
    }

    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    stopAnimationLoop();
  };

  const adjustCanvasToVideo = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;

    const headerHeight =
      (document.querySelector('ion-header') as HTMLElement)?.offsetHeight || 0;
    const controlsHeight =
      (document.querySelector('.training-controls') as HTMLElement)
        ?.offsetHeight || 0;
    const availableHeight = window.innerHeight - headerHeight - controlsHeight;

    const videoAspectRatio = videoWidth / videoHeight;
    const screenAspectRatio = window.innerWidth / availableHeight;

    let canvasWidth, canvasHeight;

    if (screenAspectRatio > videoAspectRatio) {
      canvasHeight = availableHeight;
      canvasWidth = canvasHeight * videoAspectRatio;
    } else {
      canvasWidth = window.innerWidth;
      canvasHeight = canvasWidth / videoAspectRatio;
    }

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    video.style.width = `${canvasWidth}px`;
    video.style.height = `${canvasHeight}px`;
    video.style.transform = 'scaleX(-1)'; // Lustrzane odbicie
    video.style.display = 'none'; // Ukrycie elementu video
  };

  const generateTargets = () => {
    const margin = 30;
    const canvasWidth = canvasRef.current?.width || 0;
    const canvasHeight = canvasRef.current?.height || 0;

    const colors = ['red', 'blue', 'green', 'yellow'];
    const keypoints = ['leftWrist', 'rightWrist', 'leftAnkle', 'rightAnkle'];

    targetsRef.current = keypoints.map((keypoint, i) => ({
      x: Math.random() * (canvasWidth - margin * 2) + margin,
      y: Math.random() * (canvasHeight - margin * 2) + margin,
      color: colors[i],
      keypoint,
    }));

    cueAppearTimeRef.current = Date.now();
    setTotalCues((prev) => prev + targetsRef.current.length);
  };

  const handlePoseDetection = throttle((poses: any[]) => {
    if (!poses.length) return;

    const keypoints = poses[0].keypoints;
    const trackedKeypoints = [
      { id: 'leftWrist', x: keypoints[9]?.x, y: keypoints[9]?.y, color: 'red' },
      {
        id: 'rightWrist',
        x: keypoints[10]?.x,
        y: keypoints[10]?.y,
        color: 'blue',
      },
      {
        id: 'leftAnkle',
        x: keypoints[15]?.x,
        y: keypoints[15]?.y,
        color: 'green',
      },
      {
        id: 'rightAnkle',
        x: keypoints[16]?.x,
        y: keypoints[16]?.y,
        color: 'yellow',
      },
    ];

    // Lustrzane odbicie współrzędnych x
    const canvasWidth = canvasRef.current?.width || 0;
    trackedKeypoints.forEach((kp) => {
      if (kp.x != null) {
        kp.x = canvasWidth - kp.x;
      }
    });

    checkForHits(trackedKeypoints);
    latestKeypointsRef.current = trackedKeypoints;
  });

  const drawCanvas = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const video = videoRef.current;
    if (!context) return;

    const drawFrame = () => {
      animationFrameIdRef.current = requestAnimationFrame(drawFrame);

      context.save();
      // Lustrzane odbicie
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      context.restore();

      drawKeypointsAndTargets(context);
    };

    drawFrame();
  };

  const drawKeypointsAndTargets = (context: CanvasRenderingContext2D) => {
    // Rysowanie kluczowych punktów
    const keypoints = latestKeypointsRef.current;
    if (keypoints) {
      keypoints.forEach(({ x, y, color }: any) => {
        if (x != null && y != null) {
          context.fillStyle = color;
          context.beginPath();
          context.arc(x, y, 10, 0, Math.PI * 2);
          context.fill();
        }
      });
    }

    // Rysowanie celów
    targetsRef.current.forEach(({ x, y, color }) => {
      context.fillStyle = color;
      context.fillRect(x, y, 30, 30);
    });
  };

  const checkForHits = (keypoints: any[]) => {
    setHitCount((prev) => {
      let newHitCount = prev;
      targetsRef.current.forEach((target, index) => {
        const correspondingKeypoint = keypoints.find(
          (kp) => kp.id === target.keypoint
        );
        if (
          correspondingKeypoint &&
          Math.hypot(
            correspondingKeypoint.x - target.x,
            correspondingKeypoint.y - target.y
          ) < 20
        ) {
          newHitCount++;
          targetsRef.current[index] = {
            ...target,
            x: Math.random() * (canvasRef.current!.width - 30),
            y: Math.random() * (canvasRef.current!.height - 30),
          };

          if (cueAppearTimeRef.current) {
            setReactionTimes((prevTimes) => [
              ...prevTimes,
              Date.now() - cueAppearTimeRef.current!,
            ]);
            cueAppearTimeRef.current = Date.now();
          }
        }
      });
      return newHitCount;
    });
  };

  const startAnimationLoop = () => {
    drawCanvas();
  };

  const stopAnimationLoop = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Training Mode</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="training-container">
          <video ref={videoRef} style={{ display: 'none' }} />
          <canvas ref={canvasRef}></canvas>
        </div>
        <div className="training-controls">
          {!isTraining ? (
            <IonButton expand="block" onClick={startTraining}>
              Start
            </IonButton>
          ) : (
            <IonButton expand="block" color="danger" onClick={stopTraining}>
              Stop
            </IonButton>
          )}
          <p>Hits: {hitCount}</p>
          <p>Total Cues: {totalCues}</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Training;

/*
  Podsumowanie:
  - Komponent Training wyświetla ekran treningowy.
  - Wykorzystuje serwis motionTracking do śledzenia ruchu użytkownika.
  - Generuje początkowe wizualne punkty do zbicia za pomocą funkcji generateTargets.
  - Używa IonPage z Ionic React do strukturyzacji strony.
*/