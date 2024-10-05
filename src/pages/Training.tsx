/*
  Plik: /src/pages/Training.tsx
  Opis:
  Komponent Training jest stroną odpowiedzialną za wyświetlanie głównego ekranu treningowego, w którym użytkownik ma możliwość przeprowadzenia ćwiczeń opartych na wizualnych wskazówkach. Komponent ten integruje funkcjonalności związane z śledzeniem ruchu, wyświetlaniem punktów oraz pomiarem czasu reakcji.
*/

import React, { useEffect, useRef, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/react';
import { PoseDetectionContainer } from '../services/motionTracking';
import { captureCamera } from '../utils';
import { CanvasRenderer } from '../components/CanvasRenderer';
import { useHistory } from 'react-router-dom';
import './Training.css';

// Komponent Training
const Training: React.FC = () => {
  // Referencje do elementów video i canvas
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseDetectionRef = useRef<PoseDetectionContainer | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const targetIdsRef = useRef<string[]>([]);
  const keypointColors = useRef<Map<string, string>>(new Map());
  const targetColors = useRef<Map<string, string>>(new Map());

  // Stany komponentu
  const [isTraining, setIsTraining] = useState(false);
  const [hitCount, setHitCount] = useState(0);
  const [totalCues, setTotalCues] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [targetPositions, setTargetPositions] = useState<Array<{ x: number; y: number; color: string }>>([]);

  const cueAppearTimeRef = useRef<number | null>(null);
  const history = useHistory();

  // useEffect - Inicjalizacja śledzenia ruchu i renderowania
  useEffect(() => {
    let animationFrameId: number;

    const initialize = async () => {
      try {
        const stream = await captureCamera();
        if (videoRef.current && canvasRef.current) {
          const renderer = new CanvasRenderer(stream, videoRef.current, canvasRef.current);
          rendererRef.current = renderer;

          // Dodanie event listenerów dla utraty i przywrócenia kontekstu WebGL
          const gl = canvasRef.current.getContext('webgl');
          if (gl) {
            canvasRef.current.addEventListener('webglcontextlost', handleContextLost, false);
            canvasRef.current.addEventListener('webglcontextrestored', () => handleContextRestored(renderer), false);
          }

          // Inicjalizacja śledzenia pozy
          poseDetectionRef.current = new PoseDetectionContainer(videoRef.current, (poses) => {
            if (poses.length > 0) {
              const keypoints = poses[0].keypoints;

              // Definiowanie kluczowych punktów do śledzenia (np. nadgarstki i kostki)
              const trackedKeypoints = [
                { keypoint: keypoints[9], id: 'leftWrist', color: 'red' },
                { keypoint: keypoints[10], id: 'rightWrist', color: 'blue' },
                { keypoint: keypoints[15], id: 'leftAnkle', color: 'green' },
                { keypoint: keypoints[16], id: 'rightAnkle', color: 'yellow' },
              ];

              // Aktualizacja pozycji kluczowych punktów
              trackedKeypoints.forEach(({ keypoint, id, color }) => {
                keypointColors.current.set(id, color);

                if (renderer.hasSprite(id)) {
                  renderer.moveSprite(id, keypoint.x - 10, keypoint.y - 10);
                } else {
                  renderer.addSprite(
                    {
                      x: keypoint.x - 10,
                      y: keypoint.y - 10,
                      width: 20,
                      height: 20,
                      color: color,
                    },
                    id
                  );
                }
              });

              // Sprawdzenie kolizji z celami
              checkForHits(trackedKeypoints.map(kp => kp.id));
            }
          });

          // Funkcja animująca renderowanie
          const animate = () => {
            renderer.renderCanvas();
            animationFrameId = requestAnimationFrame(animate);
          };

          animate();

          // Losowe rozmieszczenie celów
          if (rendererRef.current) {
            const [canvasWidth, canvasHeight] = rendererRef.current.getResolution();

            const newTargetPositions = [
              {
                x: Math.random() * (canvasWidth - 30),
                y: Math.random() * (canvasHeight - 30),
                color: 'red',
              },
              {
                x: Math.random() * (canvasWidth - 30),
                y: Math.random() * (canvasHeight - 30),
                color: 'blue',
              },
              {
                x: Math.random() * (canvasWidth - 30),
                y: Math.random() * (canvasHeight - 30),
                color: 'green',
              },
              {
                x: Math.random() * (canvasWidth - 30),
                y: Math.random() * (canvasHeight - 30),
                color: 'yellow',
              },
            ];

            setTargetPositions(newTargetPositions);
            setTotalCues(newTargetPositions.length);
            cueAppearTimeRef.current = Date.now();

            newTargetPositions.forEach((target, index) => {
              const id = `target-${index}`;
              targetIdsRef.current.push(id);
              targetColors.current.set(id, target.color);

              renderer.addSprite(
                {
                  x: target.x,
                  y: target.y,
                  width: 30,
                  height: 30,
                  color: target.color,
                },
                id
              );
            });
          }
        }
      } catch (error) {
        console.error('Error initializing training:', error);
      }
    };

    if (isTraining) {
      initialize();
    }

    return () => {
      if (poseDetectionRef.current) {
        poseDetectionRef.current.stopDetection();
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [isTraining]);

  // Obsługa utraty kontekstu WebGL
  const handleContextLost = (event: Event) => {
    event.preventDefault();
    console.warn("WebGL context lost. Attempting to restore...");
    setIsTraining(false);
  };

  // Obsługa przywrócenia kontekstu WebGL
  const handleContextRestored = (renderer: CanvasRenderer) => {
    console.log("WebGL context restored. Reinitializing...");
    renderer.renderCanvas();
    setIsTraining(true);
  };

  // Funkcja sprawdzająca trafienia
  const checkForHits = (keypointIds: string[]) => {
    keypointIds.forEach(keypointId => {
      const keypointColor = keypointColors.current.get(keypointId);
      const overlappingSprites = rendererRef.current?.getOverlappingSprites(keypointId) || [];

      const overlappingTargets = overlappingSprites.filter(targetId => targetIdsRef.current.includes(targetId));

      overlappingTargets.forEach(targetId => {
        const targetColor = targetColors.current.get(targetId);

        if (keypointColor === targetColor) {
          setHitCount(prev => prev + 1);

          const [canvasWidth, canvasHeight] = rendererRef.current!.getResolution();
          const newX = Math.random() * (canvasWidth - 30);
          const newY = Math.random() * (canvasHeight - 30);
          rendererRef.current!.moveSprite(targetId, newX, newY);

          const targetIndex = targetIdsRef.current.indexOf(targetId);
          if (targetIndex > -1) {
            setTargetPositions(prev => {
              const updated = [...prev];
              updated[targetIndex] = {
                ...updated[targetIndex],
                x: newX,
                y: newY,
              };
              return updated;
            });
          }

          setTotalCues(prev => prev + 1);

          if (cueAppearTimeRef.current) {
            const reactionTime = Date.now() - cueAppearTimeRef.current;
            setReactionTimes(prevTimes => [...prevTimes, reactionTime]);
            cueAppearTimeRef.current = Date.now();
          }
        }
      });
    });
  };

  // Funkcja obsługująca rozpoczęcie treningu
  const handleStartTraining = () => {
    setIsTraining(true);
    setHitCount(0);
    setReactionTimes([]);
  };

  // Funkcja obsługująca zatrzymanie treningu
  const handleStopTraining = () => {
    setIsTraining(false);

    targetIdsRef.current.forEach(targetId => {
      rendererRef.current?.deleteSprite(targetId);
    });
    targetIdsRef.current = [];
    targetColors.current.clear();
    setTargetPositions([]);

    const accuracy = totalCues > 0 ? (hitCount / totalCues) * 100 : 0;
    const averageReactionTime = reactionTimes.length > 0
      ? reactionTimes.reduce((a, b) => a + b) / reactionTimes.length
      : 0;

    const sessionData = {
      hitCount,
      totalCues,
      accuracy,
      averageReactionTime,
    };

    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    localStorage.setItem('sessions', JSON.stringify([...sessions, sessionData]));

    history.push('/summary');
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
          <video ref={videoRef} autoPlay style={{ display: 'none' }} />
          <canvas ref={canvasRef}></canvas>
        </div>
        <div className="training-controls">
          {!isTraining ? (
            <IonButton expand="block" onClick={handleStartTraining}>
              Start
            </IonButton>
          ) : (
            <IonButton expand="block" color="danger" onClick={handleStopTraining}>
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
  - Generuje początkowe wizualne punkty do zbicia za pomocą funkcji generateRandomCues.
  - Renderuje komponent VisualCue dla każdego aktywnego punktu.
  - Używa IonPage z Ionic React do strukturyzacji strony.
  - Obsługuje utratę i przywrócenie kontekstu WebGL, aby zapewnić stabilność działania aplikacji.
*/