/*
  Plik: /src/pages/Training.tsx
  Opis: Komponent Training jest stroną odpowiedzialną za wyświetlanie głównego ekranu treningowego.
  
  Zmiany:
  - Dodano licznik czasu treningu
  - Zmodyfikowano obsługę pauzy
  - Dodano inicjalizację kamery i detekcji pozy podczas odliczania
  - Dodano obsługę czasu dla treningu proceduralnego i map ręcznych
*/

import React, { useEffect, useRef, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonButtons,
  IonModal,
  IonFooter,
  useIonRouter,
} from '@ionic/react';
import { play, pause, settings, stop } from 'ionicons/icons';
import { CanvasRenderer } from '../components/CanvasRenderer';
import TrainingConfigurator from '../components/TrainingConfigurator';
import TrainingInfo from '../components/TrainingInfo';
import CountdownTimer from '../components/CountdownTimer';
import { CompleteTrainingConfig, TrainingAdjustments } from '../types/training';
import { TrainingConfig, captureCamera } from '../utils';
import { PoseDetectionContainer } from '../services/motionTracking';
import type { Keypoint } from '../types/motion';
import { predefinedTrainings } from '../config/predefinedTrainings';
import { defaultAdjustments } from '../config/defaultAdjustments';
import { TrainingStats, TrainingStatsRef } from '../components/TrainingStats';
import './Training.css';

enum TrainingState {
  IDLE,        // przed rozpoczęciem
  PREPARING,   // kamera i detekcja aktywne, odliczanie
  ACTIVE,      // trening w toku
  PAUSED,      // wstrzymany przez przycisk
  CONFIGURING  // wstrzymany przez modal
}

class TrainingManager {
  private canvasRenderer: CanvasRenderer | null = null;
  private poseDetection: PoseDetectionContainer | null = null;
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private config: CompleteTrainingConfig | null = null;
  private onHitCallback: ((keypointId: string) => void) | null = null;
  private onNewTargetsCallback: ((targetIds: string[]) => void) | null = null;
  private state: TrainingState = TrainingState.IDLE;
  
  // Nowy system zarządzania czasem
  private timeSegments: { start: number; end: number; }[] = [];
  private currentSegmentStart: number | null = null;
  private modalOpenTime: number | null = null;

  constructor() {
    this.config = {
      selectedTraining: predefinedTrainings[0],
      adjustments: defaultAdjustments as TrainingAdjustments
    };
  }

  // Inicjalizacja systemu
  async initialize(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    onHit: (keypointId: string) => void,
    onNewTargets: (targetIds: string[]) => void
  ): Promise<void> {
    this.video = video;
    this.canvas = canvas;
    this.onHitCallback = onHit;
    this.onNewTargetsCallback = onNewTargets;

    try {
      // Zatrzymaj poprzedni strumień
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      // Inicjalizacja kamery
      this.stream = await captureCamera();
      this.video.srcObject = this.stream;

      // Inicjalizacja detekcji pozy
      this.poseDetection = new PoseDetectionContainer(
        this.video,
        (keypoints: Keypoint[]) => {
          if (this.canvasRenderer) {
            this.canvasRenderer.updateKeypoints(keypoints);
          }
        }
      );

      // Konfiguracja renderera
      const headerHeight = (document.querySelector('ion-header') as HTMLElement)?.offsetHeight || 0;
      const footerHeight = (document.querySelector('ion-footer') as HTMLElement)?.offsetHeight || 0;

      if (this.config) {
        const trainingConfig: Partial<TrainingConfig> = {
          ...this.config.selectedTraining.config,
          ...this.config.adjustments,
        };

        this.canvasRenderer = new CanvasRenderer(
          this.stream,
          this.video,
          this.canvas,
          this.onHitCallback,
          trainingConfig,
          this.onNewTargetsCallback
        );

        this.canvasRenderer.adjustCanvasToVideo(headerHeight, footerHeight);
      }

      // Rozpocznij renderowanie i detekcję
      if (this.canvasRenderer && this.poseDetection) {
        this.canvasRenderer.startRendering();
        this.poseDetection.startDetection();
      }
      this.state = TrainingState.PREPARING;
    } catch (error) {
      console.error('Błąd podczas inicjalizacji treningu:', error);
      this.cleanup();
      throw error;
    }
  }

  // Rozpoczęcie właściwego treningu
  startTraining(): void {
    if (this.state === TrainingState.PREPARING) {
      this.state = TrainingState.ACTIVE;
      this.currentSegmentStart = Date.now();
      this.timeSegments = [];
      if (this.canvasRenderer) {
        this.canvasRenderer.startGeneratingTargets();
      }
    }
  }

  // Wstrzymanie treningu (przycisk)
  pauseTraining(): void {
    if (this.state === TrainingState.ACTIVE) {
      this.state = TrainingState.PAUSED;
      if (this.currentSegmentStart) {
        this.timeSegments.push({
          start: this.currentSegmentStart,
          end: Date.now()
        });
        this.currentSegmentStart = null;
      }
      if (this.canvasRenderer) {
        this.canvasRenderer.pauseTraining();
      }
    }
  }

  // Wstrzymanie treningu (modal)
  pauseForConfig(): void {
    if (this.state === TrainingState.ACTIVE || this.state === TrainingState.PAUSED) {
      const wasNormalPaused = this.state === TrainingState.PAUSED;
      
      // Jeśli trening był aktywny, zapisz segment czasu
      if (!wasNormalPaused && this.currentSegmentStart) {
        this.timeSegments.push({
          start: this.currentSegmentStart,
          end: Date.now()
        });
        this.currentSegmentStart = null;
      }

      this.state = TrainingState.CONFIGURING;
      this.modalOpenTime = Date.now();
      
      if (this.canvasRenderer) {
        this.canvasRenderer.pauseForConfig();
      }
    }
  }

  // Wznowienie treningu
  resumeTraining(): void {
    const wasConfiguring = this.state === TrainingState.CONFIGURING;
    
    if (this.state === TrainingState.PAUSED || this.state === TrainingState.CONFIGURING) {
      this.state = TrainingState.ACTIVE;
      this.currentSegmentStart = Date.now();
      this.modalOpenTime = null;

      if (this.canvasRenderer) {
        this.canvasRenderer.resumeTraining();
        if (wasConfiguring) {
          this.canvasRenderer.startGeneratingTargets();
        }
      }
    }
  }

  // Pobranie aktualnego czasu treningu
  getCurrentTime(): number {
    // Oblicz sumę wszystkich zakończonych segmentów
    const completedTime = this.timeSegments.reduce(
      (total, segment) => total + (segment.end - segment.start),
      0
    );

    // Dodaj czas aktualnego segmentu, jeśli istnieje
    const currentSegmentTime = this.currentSegmentStart 
      ? Date.now() - this.currentSegmentStart 
      : 0;

    return completedTime + currentSegmentTime;
  }

  // Sprawdzenie czy trening jest aktywny
  isActive(): boolean {
    return this.state === TrainingState.ACTIVE;
  }

  // Sprawdzenie czy trening jest wstrzymany
  isPaused(): boolean {
    return this.state === TrainingState.PAUSED || this.state === TrainingState.CONFIGURING;
  }

  // Pobranie aktualnego stanu
  getState(): TrainingState {
    return this.state;
  }

  // Zakończenie treningu
  cleanup(): void {
    this.state = TrainingState.IDLE;
    this.currentSegmentStart = null;
    this.modalOpenTime = null;
    this.timeSegments = [];

    if (this.canvasRenderer) {
      this.canvasRenderer.cleanup();
      this.canvasRenderer = null;
    }

    if (this.poseDetection) {
      this.poseDetection.stopDetection();
      this.poseDetection = null;
    }

    if (this.video) {
      this.video.srcObject = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  // Aktualizacja konfiguracji
  updateConfig(config: CompleteTrainingConfig): void {
    this.config = config;
    if (this.canvasRenderer && this.onHitCallback && this.onNewTargetsCallback) {
      const trainingConfig: Partial<TrainingConfig> = {
        ...config.selectedTraining.config,
        ...config.adjustments,
      };
      const headerHeight = (document.querySelector('ion-header') as HTMLElement)?.offsetHeight || 0;
      const footerHeight = (document.querySelector('ion-footer') as HTMLElement)?.offsetHeight || 0;

      if (this.stream && this.video && this.canvas) {
        this.canvasRenderer.stopRendering();
        this.canvasRenderer.stopGeneratingTargets();
        this.canvasRenderer = new CanvasRenderer(
          this.stream,
          this.video,
          this.canvas,
          this.onHitCallback,
          trainingConfig,
          this.onNewTargetsCallback
        );
        this.canvasRenderer.adjustCanvasToVideo(headerHeight, footerHeight);
        this.canvasRenderer.startRendering();
        if (this.isActive() && !this.isPaused()) {
          this.canvasRenderer.startGeneratingTargets();
        }
      }
    }
  }

  // Dostosowanie rozmiaru canvasu
  adjustCanvasSize(headerHeight: number, footerHeight: number): void {
    this.canvasRenderer?.adjustCanvasToVideo(headerHeight, footerHeight);
  }
}

const Training: React.FC = () => {
  const router = useIonRouter();
  const [isTraining, setIsTraining] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [trainingConfig, setTrainingConfig] = useState<CompleteTrainingConfig>({
    selectedTraining: predefinedTrainings[0],
    adjustments: defaultAdjustments as TrainingAdjustments
  });
  
  const statsRef = useRef<TrainingStatsRef>(null);
  const cueAppearTimeRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trainingManagerRef = useRef<TrainingManager>(new TrainingManager());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerDisplayRef = useRef<HTMLDivElement>(null);
  const elapsedTimeRef = useRef<number>(0);

  // Obsługa rozpoczęcia treningu
  const handleTrainingStart = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      await trainingManagerRef.current.initialize(
        videoRef.current,
        canvasRef.current,
        handleHit,
        handleNewTargets
      );
      
      setIsTraining(true);
      setIsCountingDown(true);
    } catch (error) {
      console.error('Nie udało się rozpocząć treningu:', error);
    }
  };

  // Obsługa zakończenia odliczania
  const handleCountdownComplete = () => {
    setIsCountingDown(false);
    
    if (trainingManagerRef.current.getState() === TrainingState.PREPARING) {
      // Rozpocznij nowy trening
      trainingManagerRef.current.startTraining();
    } else {
      // Wznów trening po pauzie
      trainingManagerRef.current.resumeTraining();
    }
    
    setIsPaused(false);
    startTimeTracking();
  };

  // Rozpoczęcie śledzenia czasu - zoptymalizowane
  const startTimeTracking = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      elapsedTimeRef.current = trainingManagerRef.current.getCurrentTime();
      
      // Aktualizuj tylko wyświetlanie czasu bez re-renderowania całego komponentu
      if (timerDisplayRef.current) {
        timerDisplayRef.current.textContent = `${Math.floor(elapsedTimeRef.current / 1000)}s`;
      }
    }, 1000);
  };

  // Obsługa pauzy/wznowienia
  const handlePauseResume = () => {
    if (!isPaused) {
      // Pauzujemy trening
      trainingManagerRef.current.pauseTraining();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsPaused(true);
    } else {
      // Rozpoczynamy odliczanie przed wznowieniem
      setIsCountingDown(true);
      setIsPaused(false);
    }
  };

  // Obsługa otwarcia/zamknięcia konfiguracji
  const handleConfigModal = (show: boolean) => {
    if (show && isTraining) {
      trainingManagerRef.current.pauseForConfig();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsPaused(true);
    }
    setShowConfig(show);
  };

  // Obsługa zamknięcia modalu
  const handleModalDismiss = () => {
    setShowConfig(false);
    if (isTraining) {
      setIsCountingDown(true);
    }
  };

  // Obsługa zakończenia treningu - zmodyfikowana
  const handleTrainingEnd = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Zapisz sesję w localStorage
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    sessions.push({
      trainingId: trainingConfig?.selectedTraining.id,
      ...statsRef.current?.getStats(),
      trainingTime: elapsedTimeRef.current,
      timestamp: Date.now(),
    });
    localStorage.setItem('sessions', JSON.stringify(sessions));

    // Cleanup
    trainingManagerRef.current.cleanup();
    statsRef.current?.reset();
    setIsTraining(false);
    setIsPaused(false);

    router.push('/summary');
  };

  // Zoptymalizowany ResizeObserver
  const resizeObserver = new ResizeObserver(
    // Throttle callback do 60fps
    (() => {
      let ticking = false;
      return (entries: ResizeObserverEntry[]) => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const headerHeight = (document.querySelector('ion-header') as HTMLElement)?.offsetHeight || 0;
            const footerHeight = (document.querySelector('ion-footer') as HTMLElement)?.offsetHeight || 0;
            trainingManagerRef.current.adjustCanvasSize(headerHeight, footerHeight);
            ticking = false;
          });
          ticking = true;
        }
      };
    })()
  );

  // Obsługa trafień - zoptymalizowana
  const handleHit = (() => {
    let lastHitTime = 0;
    let hits = 0;
    const MIN_HIT_INTERVAL = 16; // ~60fps

    return (keypointId: string) => {
      const now = Date.now();
      if (now - lastHitTime < MIN_HIT_INTERVAL) return;
      lastHitTime = now;

      hits++;
      statsRef.current?.updateHits(hits);
      
      if (cueAppearTimeRef.current !== null) {
        const reactionTime = now - cueAppearTimeRef.current;
        statsRef.current?.updateReactionTime(reactionTime);
        cueAppearTimeRef.current = null;
      }
    };
  })();

  // Obsługa nowych celów - zoptymalizowana
  const handleNewTargets = (() => {
    let lastTargetTime = 0;
    let totalCues = 0;
    const MIN_TARGET_INTERVAL = 16; // ~60fps

    return (targetIds: string[]) => {
      const now = Date.now();
      if (now - lastTargetTime < MIN_TARGET_INTERVAL) return;
      lastTargetTime = now;

      totalCues += targetIds.length;
      statsRef.current?.updateCues(totalCues);
      cueAppearTimeRef.current = now;
    };
  })();

  // Obsługa zmiany konfiguracji - zoptymalizowana
  const handleConfigChange = (() => {
    let lastConfigTime = 0;
    const MIN_CONFIG_INTERVAL = 100; // Throttle do 10 aktualizacji/s

    return (config: CompleteTrainingConfig) => {
      const now = Date.now();
      if (now - lastConfigTime < MIN_CONFIG_INTERVAL) return;
      lastConfigTime = now;

      setTrainingConfig(config);
      trainingManagerRef.current.updateConfig(config);
    };
  })();

  // Pobierz najlepszy wynik - zoptymalizowany
  const getBestScore = (() => {
    const cache = new Map<string, any>();
    const CACHE_TTL = 5000; // 5s cache

    return (trainingId: string) => {
      const now = Date.now();
      const cached = cache.get(trainingId);
      if (cached && now - cached.timestamp < CACHE_TTL) {
        return cached.score;
      }

      const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
      const trainingScores = sessions.filter((s: any) => s.trainingId === trainingId);
      
      if (trainingScores.length === 0) {
        cache.set(trainingId, { score: null, timestamp: now });
        return null;
      }

      const bestScore = trainingScores.reduce((best: any, current: any) => {
        if (!best || current.accuracy > best.accuracy) {
          return {
            accuracy: current.accuracy,
            averageReactionTime: current.averageReactionTime,
            timestamp: current.timestamp,
            trainingTime: current.trainingTime
          };
        }
        return best;
      }, null);

      cache.set(trainingId, { score: bestScore, timestamp: now });
      return bestScore;
    };
  })();

  const bestScore = trainingConfig ? getBestScore(trainingConfig.selectedTraining.id) : null;

  // Obsługa wyboru treningu
  const handleTrainingSelect = (trainingId: string) => {
    const stored = localStorage.getItem('customTrainings');
    const customTrainings = stored ? JSON.parse(stored) : [];
    const allTrainings = [...predefinedTrainings, ...customTrainings];

    const foundTraining = allTrainings.find(t => t.id === trainingId);
    if (foundTraining) {
      const mergedAdjustments = {
        ...defaultAdjustments,
        ...foundTraining.config, 
      };

      handleConfigChange({
        selectedTraining: foundTraining,
        adjustments: mergedAdjustments
      });
    } else {
      console.warn("Trening o podanym ID nie istnieje w allTrainings:", trainingId);
    }
  };

  // Podłącz ResizeObserver do kontenera
  if (containerRef.current) {
    resizeObserver.observe(containerRef.current);
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Trening</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => handleConfigModal(true)}>
              <IonIcon slot="icon-only" icon={settings} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="training-container" ref={containerRef}>
          {!isTraining && trainingConfig && (
            <TrainingInfo 
              config={trainingConfig}
              onTrainingSelect={handleTrainingSelect}
            />
          )}
          
          <div className="camera-container">
            <video
              ref={videoRef}
              className="camera-feed"
              style={{ display: isTraining || isCountingDown ? 'block' : 'none' }}
              playsInline
              autoPlay
              muted
            />
            
            <canvas 
              id="training-canvas" 
              ref={canvasRef}
              className="training-canvas"
              style={{ display: isTraining ? 'block' : 'none' }}
            />

            {isCountingDown && (
              <CountdownTimer
                duration={5}
                onComplete={handleCountdownComplete}
              />
            )}
          </div>
        </div>
      </IonContent>

      <IonFooter>
        <IonToolbar>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '0 10px' 
          }}>
            <div style={{ flex: 2 }}>
              {isTraining ? (
                <>
                  <TrainingStats ref={statsRef} />
                  <div ref={timerDisplayRef}>0s</div>
                </>
              ) : bestScore ? (
                <>
                  <div>Najlepszy wynik:</div>
                  <div>Dokładność: {bestScore.accuracy.toFixed(1)}%</div>
                  <div>Czas: {Math.floor(bestScore.trainingTime / 1000)}s</div>
                  <div>Średni czas: {(bestScore.averageReactionTime / 1000).toFixed(2)}s</div>
                </>
              ) : (
                <div>Brak wyników</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {isTraining ? (
                <>
                  <IonButton
                    onClick={handlePauseResume}
                    color={isPaused ? "success" : "warning"}
                  >
                    <IonIcon slot="icon-only" icon={isPaused ? play : pause} />
                  </IonButton>
                  <IonButton
                    onClick={handleTrainingEnd}
                    color="danger"
                  >
                    <IonIcon slot="icon-only" icon={stop} />
                  </IonButton>
                </>
              ) : (
                <IonButton
                  onClick={() => {
                    setIsTraining(true);
                    handleTrainingStart();
                  }}
                  color="success"
                  disabled={!trainingConfig}
                >
                  <IonIcon slot="icon-only" icon={play} />
                </IonButton>
              )}
            </div>
          </div>
        </IonToolbar>
      </IonFooter>

      <IonModal
        isOpen={showConfig}
        onDidDismiss={handleModalDismiss}
        breakpoints={[0, 0.5, 0.75, 1]}
        initialBreakpoint={0.75}
        className="config-modal"
      >
        <TrainingConfigurator 
          onConfigChange={handleConfigChange}
          initialConfig={trainingConfig || undefined}
          onTrainingSelect={handleTrainingSelect}
        />
      </IonModal>
    </IonPage>
  );
};

export default Training;