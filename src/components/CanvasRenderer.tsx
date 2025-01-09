/*
  Plik: /src/components/CanvasRenderer.tsx
  Opis:
  Uproszczona implementacja klasy CanvasRenderer, zachowująca logikę biznesową i interfejs publiczny.
*/
// TODO: Zamienić na nowe stałe z konfiguracji zamiast starych stałych TEST_TRAINING_CONFIG
import {
  Point,
  RenderableObject,
  TrainingConfig,
  drawObject,
  drawKeypoint,
  distance,
  isPointInRect,
  generateTargetId,
  TargetPath,
  PathPoint,
  drawPath,
  calculatePositionOnPath,
  calculateTargetPosition,
  TargetGroup,
  generateRandomTargetGroup,
  drawSequenceNumber,
  KeypointId,
  TargetKeypoint,
  TargetConfig,
  TARGET_CONFIG,
  TargetBehavior,
} from '../utils';
import { TEST_TRAINING_CONFIG} from '../config/training';

// Zastąpienie starych stałych nowymi z konfiguracji
const PATH_CONFIG = TEST_TRAINING_CONFIG.FOLLOW;

// Typ dla punktów treningowych
export type TrainingTarget = RenderableObject & {
  keypoint: TargetKeypoint;
  targetId: string;
  spawnTime?: number;
  sequenceNumber?: number; // Numer w sekwencji
};

// Typ dla punktów kluczowych
export type Keypoint = {
  id: string;
  x: number | null;
  y: number | null;
  color: string;
  image?: HTMLImageElement | SVGImageElement;
};

export class CanvasRenderer {
  private readonly config: TrainingConfig;
  private readonly context: CanvasRenderingContext2D;
  private readonly onHit?: (keypointId: string) => void;
  private readonly onNewTargets?: (targetIds: string[]) => void;
  private rafId: number | null = null;
  private targets: TrainingTarget[] = [];
  private keypoints: RenderableObject[] = [];
  private trainingArea = { x: 0, y: 0, width: 0, height: 0 };
  private activeTargetPair = false;
  private previousTargetIds = new Set<string>();
  private activeGroup: TargetGroup | null = null;
  private trainingStartTime: number = 0;
  private isPaused: boolean = false;
  private isModalPaused: boolean = false;
  private isGeneratingTargets: boolean = false;
  private pausedTime: number = 0;
  private totalPausedTime: number = 0;
  private lastPauseStart: number | null = null;
  private state = {
    isRendering: false,
    isGeneratingTargets: false,
    isPaused: false,
    isConfigPause: false,
    wasGeneratingBeforePause: false
  };

  private timing = {
    segments: [] as { start: number; end: number; }[],
    currentSegmentStart: null as number | null,
    modalOpenTime: null as number | null,
    lastFrameTime: 0
  };

  constructor(
    stream: MediaStream,
    private readonly video: HTMLVideoElement,
    private readonly canvas: HTMLCanvasElement,
    onHit?: (keypointId: string) => void,
    config: Partial<TrainingConfig> = {},
    onNewTargets?: (targetIds: string[]) => void
  ) {
    // Łączenie domyślnej konfiguracji z konfiguracją treningu testowego i konfiguracją użytkownika
    this.config = {
      speed: TEST_TRAINING_CONFIG.SPEED,
      trainingArea: {
        aspectRatio: TEST_TRAINING_CONFIG.TRAINING_AREA.ASPECT_RATIO,
        margin: TEST_TRAINING_CONFIG.TRAINING_AREA.MARGIN,
        targetSize: TEST_TRAINING_CONFIG.TRAINING_AREA.TARGET_SIZE,
        hitRadius: TEST_TRAINING_CONFIG.TRAINING_AREA.HIT_RADIUS,
        overlayOpacity: TEST_TRAINING_CONFIG.TRAINING_AREA.OVERLAY_OPACITY,
        upperZoneRatio: TEST_TRAINING_CONFIG.TRAINING_AREA.UPPER_ZONE_RATIO,
      },
      variation: TEST_TRAINING_CONFIG.VARIATION,
      disappearingProbability: TEST_TRAINING_CONFIG.DISAPPEARING_PROBABILITY,
      disappearingConfig: {
        minDuration: TEST_TRAINING_CONFIG.DISAPPEARING.MIN,
        maxDuration: TEST_TRAINING_CONFIG.DISAPPEARING.MAX,
        sequenceBuffer: TEST_TRAINING_CONFIG.DISAPPEARING.SEQUENCE_BUFFER,
        probabilities: {
          sequence: TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.SEQUENCE,
          follow: TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.FOLLOW,
          handPair: TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.HAND_PAIR,
          singleHand: TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.SINGLE_HAND,
          anyHand: TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.ANY_HAND,
          anyFoot: TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.ANY_FOOT,
          anyLimb: TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.ANY_LIMB,
          singleFoot: TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.SINGLE_FOOT,
        },
      },
      defaultBehavior: {
        type: TEST_TRAINING_CONFIG.DEFAULT_BEHAVIOR.TYPE as "static" | "follow",
        minFollowDistance: TEST_TRAINING_CONFIG.DEFAULT_BEHAVIOR.MIN_FOLLOW_DISTANCE,
        followThreshold: TEST_TRAINING_CONFIG.DEFAULT_BEHAVIOR.FOLLOW_THRESHOLD,
      },
      enabledKeypoints: {
        leftWrist: TEST_TRAINING_CONFIG.ENABLED_KEYPOINTS.LEFT_WRIST,
        rightWrist: TEST_TRAINING_CONFIG.ENABLED_KEYPOINTS.RIGHT_WRIST,
        leftAnkle: TEST_TRAINING_CONFIG.ENABLED_KEYPOINTS.LEFT_ANKLE,
        rightAnkle: TEST_TRAINING_CONFIG.ENABLED_KEYPOINTS.RIGHT_ANKLE,
      },
      sequenceConfig: {
        minSequenceSize: TEST_TRAINING_CONFIG.SEQUENCE.MIN_SIZE,
        maxSequenceSize: TEST_TRAINING_CONFIG.SEQUENCE.MAX_SIZE,
        enforceOrder: TEST_TRAINING_CONFIG.SEQUENCE.ENFORCE_ORDER,
        showNumbers: TEST_TRAINING_CONFIG.SEQUENCE.SHOW_NUMBERS,
        delayBetweenTargets: TEST_TRAINING_CONFIG.SEQUENCE.MIN_DELAY,
        handProbability: TEST_TRAINING_CONFIG.SEQUENCE.HAND_PROBABILITY,
        minDelay: TEST_TRAINING_CONFIG.SEQUENCE.MIN_DELAY,
        maxDelay: TEST_TRAINING_CONFIG.SEQUENCE.MAX_DELAY,
        pairProbability: TEST_TRAINING_CONFIG.SEQUENCE.PAIR_PROBABILITY,
        footMinDelay: TEST_TRAINING_CONFIG.SEQUENCE.FOOT_MIN_DELAY,
        footMaxDelay: TEST_TRAINING_CONFIG.SEQUENCE.FOOT_MAX_DELAY,
      },
      targetProbabilities: {
        sequence: TEST_TRAINING_CONFIG.TARGET_PROBABILITIES.SEQUENCE,
        follow: TEST_TRAINING_CONFIG.TARGET_PROBABILITIES.FOLLOW,
        handPair: TEST_TRAINING_CONFIG.TARGET_PROBABILITIES.HAND_PAIR,
        singleLeftWrist: TEST_TRAINING_CONFIG.TARGET_PROBABILITIES.SINGLE_LEFT_WRIST,
        singleRightWrist: TEST_TRAINING_CONFIG.TARGET_PROBABILITIES.SINGLE_RIGHT_WRIST,
        singleLeftAnkle: TEST_TRAINING_CONFIG.TARGET_PROBABILITIES.SINGLE_LEFT_ANKLE,
        singleRightAnkle: TEST_TRAINING_CONFIG.TARGET_PROBABILITIES.SINGLE_RIGHT_ANKLE,
        anyHand: TEST_TRAINING_CONFIG.TARGET_PROBABILITIES.ANY_HAND,
        anyFoot: TEST_TRAINING_CONFIG.TARGET_PROBABILITIES.ANY_FOOT,
        anyLimb: TEST_TRAINING_CONFIG.TARGET_PROBABILITIES.ANY_LIMB
      },
      followConfig: {
        minDuration: TEST_TRAINING_CONFIG.FOLLOW.MIN_DURATION,
        maxDuration: TEST_TRAINING_CONFIG.FOLLOW.MAX_DURATION,
        minRadius: TEST_TRAINING_CONFIG.FOLLOW.MIN_RADIUS,
        maxRadius: TEST_TRAINING_CONFIG.FOLLOW.MAX_RADIUS,
        circleProbability: TEST_TRAINING_CONFIG.FOLLOW.CIRCLE_PROBABILITY,
        showPath: TEST_TRAINING_CONFIG.FOLLOW.SHOW_PATH,
        pathOpacity: TEST_TRAINING_CONFIG.FOLLOW.PATH_OPACITY,
        segments: {
          path: TEST_TRAINING_CONFIG.FOLLOW.SEGMENTS.PATH,
          circle: TEST_TRAINING_CONFIG.FOLLOW.SEGMENTS.CIRCLE,
          line: TEST_TRAINING_CONFIG.FOLLOW.SEGMENTS.LINE,
        },
      },
      ...config
    };

    // Zamiast bezpośredniego przypisania i play(), dodaj zabezpieczenia
    const safeVideoSetup = async () => {
      try {
        // Sprawdź, czy strumień jest już przypisany
        if (video.srcObject !== stream) {
          video.srcObject = stream;
        }

        // Jeśli wideo jest już w trakcie odtwarzania, nie wzywaj play()
        if (video.paused) {
          await video.play();
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn('Video play aborted - this is usually safe to ignore');
        } else {
          console.error('Error setting up video:', err);
        }
      }
    };

    // Wywołaj metodę asynchroniczną
    safeVideoSetup();
    this.context = canvas.getContext('2d')!;
    this.onHit = onHit;
    this.onNewTargets = onNewTargets;
    //this.video.srcObject = stream;
    //this.video.play();
  }

  // Dostosowanie rozmiaru canvasu do wideo
  // adjustCanvasToVideo(headerHeight: number, controlsHeight: number): void {
  //   const { video, canvas } = this;
  //   const videoWidth = video.videoWidth || 640;
  //   const videoHeight = video.videoHeight || 480;
  //   const availableHeight = window.innerHeight - headerHeight - controlsHeight;
  //   const scale = Math.min(window.innerWidth / videoWidth, availableHeight / videoHeight);

  //   canvas.width = videoWidth;
  //   canvas.height = videoHeight;
  //   canvas.style.width = `${videoWidth * scale}px`;
  //   canvas.style.height = `${videoHeight * scale}px`;
  //   video.style.display = 'none';

  //   this.calculateTrainingArea();
  // }

  adjustCanvasToVideo(headerHeight: number, footerHeight: number): void {
    const { video, canvas } = this;
  
    // Rozmiar natywny kamery (video)
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    
    // Ile miejsca w pionie faktycznie mamy (wysokość ekranu - header - footer)
    const availableHeight = window.innerHeight - headerHeight - footerHeight;
    // Dostępna szerokość to cała szerokość okna
    const availableWidth = window.innerWidth;
  
    // Obliczamy proporcje
    const videoAspect = videoWidth / videoHeight;
    const containerAspect = availableWidth / availableHeight;
  
    // Canvas zachowuje natywny rozmiar w pikselach (width/height),
    // ale stylami CSS go skalujemy (style.width / style.height).
    canvas.width = videoWidth;
    canvas.height = videoHeight;
  
    // Jeśli kamera jest "szersza" niż kontener → ogranicza nas szerokość
    // if (videoAspect > containerAspect) {
    //   // Wypełniamy całą szerokość, w pionie będzie puste miejsce
    //   scale = availableWidth / videoWidth;
    // } else {
    //   // Wypełniamy całą wysokość, w poziomie będzie puste miejsce
    //   scale = availableHeight / videoHeight;
    // }
    // Wypełniamy całą wysokość, w poziomie będzie puste miejsce
    const scale = availableHeight / videoHeight;
    
    // Ustawiamy style tak, żeby canvas w CSS miał odpowiednie wymiary
    canvas.style.width = `${videoWidth * scale}px`;
    canvas.style.height = `${videoHeight * scale}px`;
  
    // Wyłączenie natywnego <video> (rysujemy je ręcznie na canvasie)
    video.style.display = 'none';
  
    // Obliczamy obszar treningu (9:16 itp.)
    this.calculateTrainingArea();

    // Jeśli są aktywne cele, dostosowujemy ich pozycje
    if (this.state.isGeneratingTargets && this.targets.length > 0) {
      this.adjustTargetsPositions();
    }
  }

  // Dostosowanie pozycji celów po zmianie rozmiaru
  private adjustTargetsPositions(): void {
    this.targets.forEach(target => {
      // Sprawdzamy, czy cel nie wychodzi poza obszar treningu
      if (target.position.x < this.trainingArea.x) {
        target.position.x = this.trainingArea.x + this.config.trainingArea.margin;
      }
      if (target.position.x > this.trainingArea.x + this.trainingArea.width) {
        target.position.x = this.trainingArea.x + this.trainingArea.width - this.config.trainingArea.margin;
      }
      if (target.position.y < this.trainingArea.y) {
        target.position.y = this.trainingArea.y + this.config.trainingArea.margin;
      }
      if (target.position.y > this.trainingArea.y + this.trainingArea.height) {
        target.position.y = this.trainingArea.y + this.trainingArea.height - this.config.trainingArea.margin;
      }
    });
  }

  // Obliczanie obszaru treningu
  private calculateTrainingArea(): void {
    const { canvas, config } = this;
    const { trainingArea } = config;
    const { aspectRatio } = trainingArea;

    // Obliczamy wymiary obszaru treningowego zachowując proporcje z konfiguracji
    let width = canvas.width;
    if (width > window.innerWidth) {
      width = window.innerWidth;
    }
    let height = width / aspectRatio;

    if (height > canvas.height) {
      height = canvas.height;
      width = height * aspectRatio;
    }

    // Wyśrodkowanie obszaru treningowego
    this.trainingArea = {
      x: (canvas.width - width) / 2,
      y: (canvas.height - height) / 2,
      width,
      height,
    };
  }

  // Generowanie celów treningowych
  generateTargets(): TrainingTarget[] {
    const currentTime = Date.now();
    const { config } = this;
    const { targetProbabilities, followConfig, sequenceConfig, disappearingProbability, disappearingConfig } = config;
    if (!this.trainingStartTime) {
      this.trainingStartTime = currentTime;
    }
  
    // Przed losowaniem sprawdzamy, czy prawa/lewa ręka, prawa/lewa noga mają zerowe szanse;
    // jeśli np. SINGLE_LEFT_WRIST = 0 lub SINGLE_RIGHT_WRIST = 0, ustawiamy HAND_PAIR = 0
    // w obiekcie TARGET_PROBABILITIES, aby wykluczyć wylosowanie pary.
  
    // Tworzymy lokalną kopię z obiektu Probability
    // const localProbabilities = { ...TEST_TRAINING_CONFIG.TARGET_PROBABILITIES };

    // Jeśli którakolwiek z rąk ma prawdopodobieństwo = 0, ustawiamy 0 również dla pary rąk
    if (targetProbabilities.singleLeftWrist === 0 || targetProbabilities.singleRightWrist === 0) {
      targetProbabilities.handPair = 0;
    }
  
    // Obliczamy skumulowane prawdopodobieństwo (bez SINGLE_HAND i SINGLE_FOOT).
    const randomValue = Math.random();
    let cumulativeProbability = 0;
  
    // 1. Sekwencja
    if (randomValue < (cumulativeProbability += targetProbabilities.sequence)) {
      this.activeGroup = generateRandomTargetGroup(
        currentTime - this.trainingStartTime,
        this.config
      );
  
      this.activeGroup.enforceSequence = sequenceConfig?.enforceOrder ?? false;
      this.activeGroup.currentIndex = 0;
      
      const shouldDisappear = Math.random() < (disappearingConfig?.probabilities?.sequence ?? TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.SEQUENCE);
      const firstTarget = this.activeGroup.targets[0];
  
      const baseDuration = shouldDisappear 
        ? disappearingConfig?.minDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MIN +
          Math.random() * (disappearingConfig?.maxDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MAX - (disappearingConfig?.minDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MIN))
        : undefined;
  
      this.targets = [
        this.createTarget(
          this.getZoneForConfig(firstTarget),
          firstTarget,
          1,
          shouldDisappear,
          baseDuration && baseDuration + (disappearingConfig?.sequenceBuffer ?? TEST_TRAINING_CONFIG.DISAPPEARING.SEQUENCE_BUFFER)
        )
      ];
    }
  
    // 2. Cel typu follow
    else if (randomValue < (cumulativeProbability += targetProbabilities.follow)) {
      this.activeGroup = null;
      this.activeTargetPair = false;

      // Obliczanie kumulatywnych prawdopodobieństw dla punktów kluczowych
      const keypointProbabilities = [
        { keypoint: TARGET_CONFIG.leftWrist, probability: targetProbabilities.singleLeftWrist },
        { keypoint: TARGET_CONFIG.rightWrist, probability: targetProbabilities.singleRightWrist },
        { keypoint: TARGET_CONFIG.leftAnkle, probability: targetProbabilities.singleLeftAnkle },
        { keypoint: TARGET_CONFIG.rightAnkle, probability: targetProbabilities.singleRightAnkle },
      ];

      // Obliczanie sumy prawdopodobieństw
      const totalProbability = keypointProbabilities.reduce((sum, keypoint) => sum + keypoint.probability, 0);

      // Losowanie wartości
      const randomKeypointValue = Math.random() * totalProbability;
      let cumulativeKeypointProbability = 0;
      let selectedKeypoint = keypointProbabilities[0].keypoint; // Domyślnie pierwsza kończyna

      // Wybór kończyny na podstawie wylosowanej wartości
      for (const keypoint of keypointProbabilities) {
        cumulativeKeypointProbability += keypoint.probability;
        if (randomKeypointValue < cumulativeKeypointProbability) {
          selectedKeypoint = keypoint.keypoint;
          break;
        }
      }

      const zone = selectedKeypoint.zone === 'upper' ? this.getUpperZone() : this.getLowerZone();
      const shouldDisappear = Math.random() < (disappearingConfig?.probabilities?.follow ?? TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.FOLLOW);
      const duration = shouldDisappear
        ? (followConfig?.minDuration ?? TEST_TRAINING_CONFIG.FOLLOW.MIN_DURATION) +
          Math.random() * ((followConfig?.maxDuration ?? TEST_TRAINING_CONFIG.FOLLOW.MAX_DURATION) - (followConfig?.minDuration ?? TEST_TRAINING_CONFIG.FOLLOW.MIN_DURATION))
        : undefined;

      // Przekazanie wybranej kończyny do generateFollowTarget
      const target = this.generateFollowTarget(zone, selectedKeypoint, duration);
      this.targets = [target];
    }
  
    // 3. Para celów dla rąk (o ile nie ustawiono prawdopodobieństwa = 0)
    else if (randomValue < (cumulativeProbability += targetProbabilities.handPair)) {
      this.activeGroup = null;
      this.activeTargetPair = true;
      const shouldDisappear = Math.random() < (disappearingConfig?.probabilities?.handPair ?? TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.HAND_PAIR);
      const duration = shouldDisappear
        ? disappearingConfig?.minDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MIN +
          Math.random() * (disappearingConfig?.maxDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MAX - (disappearingConfig?.minDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MIN))
        : undefined;
      this.targets = [
        this.createTarget(this.getUpperZone(), TARGET_CONFIG.leftWrist, undefined, shouldDisappear, duration),
        this.createTarget(this.getUpperZone(), TARGET_CONFIG.rightWrist, undefined, shouldDisappear, duration),
      ];
    }
  
    // 4. Cel tylko dla lewej ręki
    else if (randomValue < (cumulativeProbability += targetProbabilities.singleLeftWrist)) {
      this.activeGroup = null;
      this.activeTargetPair = false;
      const zone = this.getUpperZone();
      const shouldDisappear = Math.random() < (disappearingConfig?.probabilities?.singleHand ?? TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.SINGLE_HAND);
      const duration = shouldDisappear
        ? disappearingConfig?.minDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MIN +
          Math.random() * (disappearingConfig?.maxDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MAX - (disappearingConfig?.minDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MIN))
        : undefined;
      this.targets = [this.createTarget(zone, TARGET_CONFIG.leftWrist, undefined, shouldDisappear, duration)];
    }
  
    // 5. Cel tylko dla prawej ręki
    else if (randomValue < (cumulativeProbability += targetProbabilities.singleRightWrist)) {
      this.activeGroup = null;
      this.activeTargetPair = false;
      const zone = this.getUpperZone();
      const shouldDisappear = Math.random() < (disappearingConfig?.probabilities?.singleHand ?? TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.SINGLE_HAND);
      const duration = shouldDisappear
        ? disappearingConfig?.minDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MIN +
          Math.random() * (disappearingConfig?.maxDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MAX - (disappearingConfig?.minDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MIN))
        : undefined;
      this.targets = [this.createTarget(zone, TARGET_CONFIG.rightWrist, undefined, shouldDisappear, duration)];
    }
  
    // 6. Cel tylko dla lewej nogi
    else if (randomValue < (cumulativeProbability += targetProbabilities.singleLeftAnkle)) {
      this.activeGroup = null;
      this.activeTargetPair = false;
      const zone = this.getLowerZone();
      const shouldDisappear = Math.random() < (disappearingConfig?.probabilities?.singleFoot ?? TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.SINGLE_FOOT);
      const duration = shouldDisappear
        ? disappearingConfig?.minDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MIN +
          Math.random() * (disappearingConfig?.maxDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MAX - (disappearingConfig?.minDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MIN))
        : undefined;
      this.targets = [this.createTarget(zone, TARGET_CONFIG.leftAnkle, undefined, shouldDisappear, duration)];
    }
  
    // 7. Cel tylko dla prawej nogi
    else if (randomValue < (cumulativeProbability += targetProbabilities.singleRightAnkle)) {
      this.activeGroup = null;
      this.activeTargetPair = false;
      const zone = this.getLowerZone();
      const shouldDisappear = Math.random() < (disappearingConfig?.probabilities?.singleFoot ?? TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.SINGLE_FOOT);
      const duration = shouldDisappear
        ? disappearingConfig?.minDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MIN +
          Math.random() * (disappearingConfig?.maxDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MAX - (disappearingConfig?.minDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MIN))
        : undefined;
      this.targets = [this.createTarget(zone, TARGET_CONFIG.rightAnkle, undefined, shouldDisappear, duration)];
    }
  
    // 8. Pozostałe typy celów (m.in. ANY_HAND, ANY_FOOT, ANY_LIMB)
    else {
      const targetType = randomValue;
      let config: TargetConfig;
      let zone: { y: number; height: number };
      let probability: number;
  
      // dowolna ręka
      if (targetType < cumulativeProbability + targetProbabilities.anyHand) {
        zone = this.getUpperZone();
        config = TARGET_CONFIG.anyHand;
        probability = disappearingConfig?.probabilities?.anyHand ?? TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.ANY_HAND;
      }
      // dowolna stopa
      else if (targetType < cumulativeProbability + targetProbabilities.anyFoot) {
        zone = this.getLowerZone();
        config = TARGET_CONFIG.anyFoot;
        probability = disappearingConfig?.probabilities?.anyFoot ?? TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.ANY_FOOT;
      }
      // dowolna kończyna
      else if (targetType < cumulativeProbability + targetProbabilities.anyLimb) {
        zone = Math.random() < 0.5 ? this.getUpperZone() : this.getLowerZone();
        config = TARGET_CONFIG.anyLimb;
        probability = disappearingConfig?.probabilities?.anyLimb ?? TEST_TRAINING_CONFIG.DISAPPEARING.PROBABILITIES.ANY_LIMB;
      }
      // w razie, gdy nic nie pasuje (lub aby uniknąć pustego losowania),
      // możemy losować np. lewą lub prawą nogę
      else {
        // Obliczanie kumulatywnych prawdopodobieństw dla punktów kluczowych
        const keypointProbabilities = [
          { keypoint: TARGET_CONFIG.leftWrist, probability: targetProbabilities.singleLeftWrist },
          { keypoint: TARGET_CONFIG.rightWrist, probability: targetProbabilities.singleRightWrist },
          { keypoint: TARGET_CONFIG.leftAnkle, probability: targetProbabilities.singleLeftAnkle },
          { keypoint: TARGET_CONFIG.rightAnkle, probability: targetProbabilities.singleRightAnkle },
        ];

        // Obliczanie sumy prawdopodobieństw
        const totalProbability = keypointProbabilities.reduce((sum, keypoint) => sum + keypoint.probability, 0);

        // Losowanie wartości
        const randomKeypointValue = Math.random() * totalProbability;
        let cumulativeKeypointProbability = 0;
        let selectedKeypoint = keypointProbabilities[0].keypoint; // Domyślnie pierwsza kończyna

        // Wybór kończyny na podstawie wylosowanej wartości
        for (const keypoint of keypointProbabilities) {
          cumulativeKeypointProbability += keypoint.probability;
          if (randomKeypointValue < cumulativeKeypointProbability) {
            selectedKeypoint = keypoint.keypoint;
            break;
          }
        }
        zone = selectedKeypoint.zone === 'upper' ? this.getUpperZone() : this.getLowerZone();
        config = selectedKeypoint;
        probability = disappearingProbability;
      }
  
      const shouldDisappear = Math.random() < probability;
      const duration = shouldDisappear
        ? disappearingConfig?.minDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MIN +
          Math.random() * (disappearingConfig?.maxDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MAX - (disappearingConfig?.minDuration ?? TEST_TRAINING_CONFIG.DISAPPEARING.MIN))
        : undefined;
  
      this.activeGroup = null;
      this.activeTargetPair = false;
      this.targets = [this.createTarget(zone, config, undefined, shouldDisappear, duration)];
    }
  
    // Sprawdzamy, czy wylosowano nowe ID (aby ewentualnie powiadomić).
    const newTargetIds = this.targets
      .map(t => t.targetId)
      .filter(id => !this.previousTargetIds.has(id));
  
    if (newTargetIds.length > 0) {
      this.onNewTargets?.(newTargetIds);
      newTargetIds.forEach(id => this.previousTargetIds.add(id));
    }
  
    return this.targets;
  }

  private generateTargetPair(zone: { y: number; height: number }): TrainingTarget[] {
    return [
      this.createTarget(zone, TARGET_CONFIG.leftWrist),
      this.createTarget(zone, TARGET_CONFIG.rightWrist),
    ];
  }

  private generateSingleTarget(zone: { y: number; height: number }, isHand: boolean): TrainingTarget {
    const config = isHand
      ? Math.random() < 0.5 ? TARGET_CONFIG.leftWrist : TARGET_CONFIG.rightWrist
      : Math.random() < 0.5 ? TARGET_CONFIG.leftAnkle : TARGET_CONFIG.rightAnkle;
    
    return this.createTarget(zone, config);
  }

  private createTarget(
    zone: { y: number; height: number },
    config: TargetConfig,
    sequenceNumber?: number,
    shouldDisappear?: boolean,
    duration?: number
  ): TrainingTarget {
    const {config: { trainingArea, defaultBehavior } } = this;
    const { margin, targetSize } = trainingArea;
    
    // Obliczamy pozycję środka celu
    const basePosition = config.position ?? {
      x: Math.random() * (this.trainingArea.width - margin * 2) + this.trainingArea.x + margin + targetSize / 2,
      y: Math.random() * (zone.height - margin * 2) + zone.y + margin + targetSize / 2
    };

    const position = calculateTargetPosition(basePosition, config.variation);
    const targetId = generateTargetId(Array.isArray(config.keypoint) ? config.keypoint[0] : config.keypoint);

    // Tworzymy zachowanie celu
    const behavior: TargetBehavior = {
      type: defaultBehavior?.type || 'static',
      duration,
      followThreshold: defaultBehavior?.followThreshold,
      minFollowDistance: defaultBehavior?.minFollowDistance,
      path: defaultBehavior?.path,
      pathStarted: defaultBehavior?.pathStarted,
    };

    return {
      position,
      size: targetSize,
      color: config.color,
      keypoint: config.keypoint,
      targetId,
      behavior,
      createdAt: Date.now(),
      spawnTime: config.spawnTime,
      followTime: 0,
      sequenceNumber,
    };
  }

  // Aktualizacja punktów kluczowych
  updateKeypoints(keypoints: Keypoint[]): void {
    this.keypoints = keypoints
      .filter(kp => kp.x !== null && kp.y !== null)
      .map(kp => ({
        position: {
          x: this.canvas.width - (kp.x as number),
          y: kp.y as number,
        },
        size: this.config.trainingArea.targetSize,
        color: kp.color,
        image: kp.image,
        id: kp.id,
      }))
      .filter(kp => isPointInRect(kp.position, this.trainingArea));

    this.checkHits();
  }

  private checkHits(): void {
    if (!this.state.isGeneratingTargets || this.state.isPaused) return;

    let allPairHit = true;
    const currentTime = Date.now();

    // Sprawdzanie czy należy dodać kolejny cel z sekwencji
    if (this.activeGroup && this.activeGroup.currentIndex !== undefined) {
      const nextIndex = this.activeGroup.currentIndex + 1;
      if (nextIndex < this.activeGroup.targets.length) {
        const nextTarget = this.activeGroup.targets[nextIndex];
        const firstTargetTime = this.targets[0]?.createdAt || currentTime;
        const timeSinceFirst = currentTime - firstTargetTime;
        const expectedDelay = nextIndex * (this.config.sequenceConfig?.delayBetweenTargets ?? 500);

        if (timeSinceFirst >= expectedDelay) {
          const newTarget = this.createTarget(
            this.getZoneForConfig(nextTarget),
            nextTarget,
            nextIndex + 1
          );
          this.targets.push(newTarget);
          this.activeGroup.currentIndex = nextIndex;
          
          // Powiadamiamy o nowym celu
          this.onNewTargets?.([newTarget.targetId]);
          this.previousTargetIds.add(newTarget.targetId);
        }
      }
    }

    this.targets = this.targets.filter(target => {
      // Sprawdzanie czasu trwania celu
      if (target.behavior?.duration) {
        //To musi takie być ponieważ segmenty czasowe powodują lawinę generowanych celów
        const elapsedTime = currentTime - (target.createdAt || 0);
        // Dla celów typu follow sprawdzamy czas tylko po rozpoczęciu ruchu
        if (target.behavior.type === 'follow') {
          if (target.behavior.pathStarted && elapsedTime > target.behavior.duration) {
            return false; // Cel wygasł
          // Sprawdzanie czasu trwania celu przed rozpoczęciem ruchu
          }else if (!target.behavior.pathStarted && elapsedTime > target.behavior.duration) {
            return false; // Cel wygasł
          }
        } else if (elapsedTime > target.behavior.duration) {
          return false; // Cel wygasł
        }
      }

      // Sprawdzanie trafienia dla wszystkich możliwych punktów kluczowych
      const keypoints = Array.isArray(target.keypoint) ? target.keypoint : [target.keypoint];
      const matchingKeypoint = this.keypoints.find(kp => 
        kp.id && keypoints.includes(kp.id as KeypointId) &&
        distance(kp.position, target.position) < this.config.trainingArea.hitRadius
      );
      
      if (!matchingKeypoint || !matchingKeypoint.id) {
        if (this.activeTargetPair) allPairHit = false;
        return true; // Zachowujemy cel
      }

      // Sprawdzanie kolejności w sekwencji
      if (this.activeGroup?.enforceSequence && target.sequenceNumber !== undefined) {
        const lowestSequenceNumber = Math.min(
          ...this.targets
            .filter(t => t.sequenceNumber !== undefined)
            .map(t => t.sequenceNumber as number)
        );
        
        if (target.sequenceNumber !== lowestSequenceNumber) {
          return true; // Cel nie może być jeszcze zbity
        }
      }

      // Obsługa różnych typów celów
      if (target.behavior?.type === 'follow') {
        // Rozpoczęcie ruchu po pierwszej kolizji
        if (!target.behavior.pathStarted) {
          target.behavior.pathStarted = true;
          target.createdAt = currentTime; // Reset czasu dla ścieżki
          return true; // Zachowujemy cel
        }

        if (target.followTime === undefined) target.followTime = 0;
        target.followTime += 16.67; // Około 60fps
        
        if (target.followTime >= (target.behavior.followThreshold || 1000)) {
          this.onHit?.(matchingKeypoint.id);
          return false; // Usuwamy cel
        }
        return true; // Zachowujemy cel
      } else { // Typ 'static'
        this.onHit?.(matchingKeypoint.id);
        return false; // Usuwamy cel
      }
    });

    // Generowanie nowych celów
    if (this.targets.length === 0 || (this.activeTargetPair && allPairHit)) {
      this.generateTargets();
    }
  }

  // Renderowanie
  startRendering(): void {
    if (this.state.isRendering) return;
    
    this.state.isRendering = true;
    this.timing.lastFrameTime = Date.now();
    
    const render = () => {
      if (!this.state.isRendering) return;

      const currentTime = Date.now();
      const deltaTime = this.timing.lastFrameTime > 0 ? 
        currentTime - this.timing.lastFrameTime : 0;
      this.timing.lastFrameTime = currentTime;

      // Renderowanie obrazu z kamery
      this.renderCamera();

      // Renderowanie obszaru treningowego
      this.renderTrainingArea();

      // Renderowanie punktów kluczowych
      this.keypoints.forEach(keypoint => drawKeypoint(this.context, keypoint));

      // Aktualizacja i renderowanie celów
      if (this.state.isGeneratingTargets) {
        // Sprawdzanie kolizji zawsze
        this.checkHits();

        // Renderowanie celów tylko jeśli nie ma pauzy
        if (!this.state.isPaused) {
          this.targets.forEach(target => {
            if (target.behavior?.type === 'follow' && target.behavior.path) {
              this.renderFollowTarget(target, currentTime);
            } else {
              this.renderTarget(this.context, target);
            }
          });
        }
      }

      this.rafId = requestAnimationFrame(render);
    };

    this.rafId = requestAnimationFrame(render);
  }

  stopRendering(): void {
    this.state.isRendering = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  // Przykładowa metoda do tworzenia ścieżki kołowej
  createCircularPath(
    center: Point,
    radius: number,
    duration: number,
    segments: number = this.config.followConfig?.segments?.circle ?? TEST_TRAINING_CONFIG.FOLLOW.SEGMENTS.CIRCLE,
    startAngle: number = 0 // Dodany parametr kąta początkowego
  ): TargetPath {
    const points: PathPoint[] = [];
    const segmentTime = duration / segments;
    
    // Losowy kierunek ruchu (zgodnie lub przeciwnie do ruchu wskazówek zegara)
    const clockwise = Math.random() < 0.5;

    // Pierwszy punkt to pozycja na okręgu pod zadanym kątem
    points.push({
      x: center.x + Math.cos(startAngle) * radius,
      y: center.y + Math.sin(startAngle) * radius,
      timestamp: 0,
      easing: 'easeInOut',
    });

    // Generowanie pozostałych punktów na okręgu
    for (let i = 1; i <= segments; i++) {
      const angle = startAngle + (clockwise ? 1 : -1) * (i / segments) * Math.PI * 2;
      points.push({
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
        timestamp: i * segmentTime,
        easing: 'easeInOut',
      });
    }

    // Dodanie punktu końcowego (powrót do pozycji początkowej)
    points.push({
      x: center.x + Math.cos(startAngle) * radius,
      y: center.y + Math.sin(startAngle) * radius,
      timestamp: duration,
      easing: 'easeInOut',
    });

    return {
      points,
      totalDuration: duration,
      loop: true,
      showPath: true,
      pathOpacity: this.config.followConfig?.pathOpacity ?? TEST_TRAINING_CONFIG.FOLLOW.PATH_OPACITY,
    };
  }

  // Przykładowa metoda do tworzenia ścieżki liniowej
  createLinearPath(
    start: Point,
    end: Point,
    duration: number = this.config.followConfig?.minDuration ?? TEST_TRAINING_CONFIG.FOLLOW.MIN_DURATION +
      Math.random() * (this.config.followConfig?.maxDuration ?? TEST_TRAINING_CONFIG.FOLLOW.MAX_DURATION - (this.config.followConfig?.minDuration ?? TEST_TRAINING_CONFIG.FOLLOW.MIN_DURATION)),
    segments: number = this.config.followConfig?.segments?.line ?? TEST_TRAINING_CONFIG.FOLLOW.SEGMENTS.LINE
  ): TargetPath {
    const points: PathPoint[] = [];
    const segmentTime = duration / (segments - 1);

    // Pierwszy punkt to zawsze pozycja początkowa
    points.push({
      x: start.x,
      y: start.y,
      timestamp: 0,
      easing: 'linear',
    });

    // Generowanie punktów pośrednich
    for (let i = 1; i < segments - 1; i++) {
      points.push({
        x: start.x + (end.x - start.x) * (i / (segments - 1)),
        y: start.y + (end.y - start.y) * (i / (segments - 1)),
        timestamp: i * segmentTime,
        easing: 'linear',
      });
    }

    // Punkt końcowy
    points.push({
      x: end.x,
      y: end.y,
      timestamp: duration,
      easing: 'linear',
    });

    return {
      points,
      totalDuration: duration,
      loop: false,
      showPath: true,
      pathOpacity: this.config.followConfig?.pathOpacity ?? TEST_TRAINING_CONFIG.FOLLOW.PATH_OPACITY,
    };
  }

  private getZoneForConfig(config: TargetConfig): { y: number; height: number } {
    const { config: { trainingArea } } = this;
    const { margin, upperZoneRatio } = trainingArea;
    if (config.zone === 'upper' || 
        (config.zone === 'any' && Math.random() < upperZoneRatio)) {
      return {
        y: this.trainingArea.y + margin,
        height: this.trainingArea.height * upperZoneRatio - margin * 2,
      };
    } else {
      return {
        y: this.trainingArea.y + this.trainingArea.height * upperZoneRatio + margin,
        height: this.trainingArea.height * (1 - upperZoneRatio) - margin * 2,
      };
    }
  }

  private getUpperZone(): { y: number; height: number } {
    const { config: { trainingArea } } = this;
    const { margin, upperZoneRatio } = trainingArea;
    return {
      y: this.trainingArea.y + margin,
      height: this.trainingArea.height * upperZoneRatio - margin * 2,
    };
  }

  private getLowerZone(): { y: number; height: number } {
    const { config: { trainingArea } } = this;
    const { margin, upperZoneRatio } = trainingArea;
    return {
      y: this.trainingArea.y + this.trainingArea.height * upperZoneRatio + margin,
      height: this.trainingArea.height * (1 - upperZoneRatio) - margin * 2,
    };
  }

  private renderTarget(ctx: CanvasRenderingContext2D, target: TrainingTarget): void {
    drawObject(ctx, target);
    
    // Rysowanie numeru sekwencji jeśli istnieje
    if (target.sequenceNumber !== undefined && this.activeGroup?.sequenceNumbers) {
      drawSequenceNumber(ctx, target.position, target.size, target.sequenceNumber);
    }

    const currentTime = Date.now();

    // Rysowanie odliczania dla znikających celów
    if (target.behavior?.duration && (!target.behavior.type || target.behavior.type === 'static' ||
        (target.behavior.type === 'follow' && !target.behavior.pathStarted))) {
      const elapsedTime = currentTime - (target.createdAt || currentTime);
      const remainingTime = target.behavior.duration - elapsedTime;
      if (remainingTime > 0) {
        const progress = remainingTime / target.behavior.duration;
        
        // Rysowanie okręgu odliczania
        ctx.beginPath();
        ctx.arc(
          target.position.x,
          target.position.y,
          target.size * progress,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = target.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Rysowanie wskaźnika postępu dla celów typu 'follow'
    if (target.behavior?.type === 'follow' && target.followTime) {
      const progress = target.followTime / (target.behavior.followThreshold || 1000);
      
      // Rysowanie okręgu postępu
      ctx.beginPath();
      ctx.arc(
        target.position.x,
        target.position.y,
        target.size * 0.8,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * progress
      );
      ctx.strokeStyle = target.color;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  private generateFollowTarget(
    zone: { y: number; height: number }, 
    keypoint: TargetConfig,
    disappearDuration?: number
  ): TrainingTarget {
    const { config } = this;
    const { defaultBehavior, followConfig, trainingArea } = config;
    // TODO: Implementacja targetProbabilities
    // const keypoint = isHand
    //   ? Math.random() < 0.5 ? TARGET_CONFIG.leftWrist : TARGET_CONFIG.rightWrist
    //   : Math.random() < 0.5 ? TARGET_CONFIG.leftAnkle : TARGET_CONFIG.rightAnkle;

    const target = this.createTarget(zone, keypoint, undefined, true, disappearDuration);
    
    const duration = followConfig?.minDuration ?? PATH_CONFIG.MIN_DURATION + 
      Math.random() * (followConfig?.maxDuration ?? PATH_CONFIG.MAX_DURATION - (followConfig?.minDuration ?? PATH_CONFIG.MIN_DURATION));

    // Losowy wybór między ścieżką kołową a liniową
    if (Math.random() < (followConfig?.circleProbability ?? TEST_TRAINING_CONFIG.FOLLOW.CIRCLE_PROBABILITY)) {
      // Ścieżka kołowa
      const radius = followConfig?.minRadius ?? PATH_CONFIG.MIN_RADIUS + 
        Math.random() * (followConfig?.maxRadius ?? PATH_CONFIG.MAX_RADIUS - (followConfig?.minRadius ?? PATH_CONFIG.MIN_RADIUS));
      
      // Losowy kąt dla pozycji początkowej
      const startAngle = Math.random() * Math.PI * 2;
      
      // Sprawdzenie, czy okrąg wychodzi poza obszar treningowy
      if(target.position.x+radius > this.trainingArea.width) {
        target.position.x = this.trainingArea.width - radius;
      };
      if(target.position.y+radius > this.trainingArea.height) {
        target.position.y = this.trainingArea.height - radius;
      };
      if(target.position.x-radius < 0) {
        target.position.x = radius;
      };
      if(target.position.y-radius < 0) {
        target.position.y = radius;
      };

      // Obliczamy środek okręgu na podstawie pozycji początkowej i kąta
      const center = {
        x: target.position.x - Math.cos(startAngle) * radius,
        y: target.position.y - Math.sin(startAngle) * radius,
      };
      
      target.behavior = {
        type: 'follow',
        duration: duration,
        followThreshold: defaultBehavior?.followThreshold,
        path: this.createCircularPath(center, radius, duration, followConfig?.segments?.circle ?? TEST_TRAINING_CONFIG.FOLLOW.SEGMENTS.CIRCLE, startAngle),
        pathStarted: false
      };
    } else {
      // Ścieżka liniowa
      const endPoint = {
        x: Math.random() * (this.trainingArea.width - trainingArea.targetSize - trainingArea.margin * 2) + 
          this.trainingArea.x + trainingArea.margin,
        y: Math.random() * zone.height + zone.y
      };
      target.behavior = {
        type: 'follow',
        duration: duration,
        followThreshold: defaultBehavior?.followThreshold,
        path: this.createLinearPath(target.position, endPoint, duration, followConfig?.segments?.line ?? TEST_TRAINING_CONFIG.FOLLOW.SEGMENTS.LINE),
        pathStarted: false
      };
    }

    return target;
  }

  // Metoda do obliczania skorygowanego czasu
  private getAdjustedTime(startTime: number): number {
    const currentTime = Date.now();
    
    // Oblicz sumę wszystkich zakończonych segmentów
    const completedTime = this.timing.segments.reduce(
      (total, segment) => total + (segment.end - segment.start),
      0
    );

    // Dodaj czas aktualnego segmentu, jeśli istnieje
    const currentSegmentTime = this.timing.currentSegmentStart 
      ? currentTime - this.timing.currentSegmentStart 
      : 0;

    // Oblicz całkowity czas aktywny
    const totalActiveTime = completedTime + currentSegmentTime;

    // Zwróć różnicę między czasem startowym a aktywnym czasem
    return currentTime - startTime - (currentTime - startTime - totalActiveTime);
  }

  // Metody związane z pauzą i wznowieniem
  pauseTraining(): void {
    if (!this.state.isPaused) {
      this.state.wasGeneratingBeforePause = this.state.isGeneratingTargets;
      this.state.isPaused = true;
      
      if (this.timing.currentSegmentStart) {
        this.timing.segments.push({
          start: this.timing.currentSegmentStart,
          end: Date.now()
        });
        this.timing.currentSegmentStart = null;
      }
      
      this.timing.lastFrameTime = 0;
    }
  }

  pauseForConfig(): void {
    if (!this.state.isPaused || !this.state.isConfigPause) {
      const wasNormalPaused = this.state.isPaused && !this.state.isConfigPause;
      
      if (!wasNormalPaused && this.timing.currentSegmentStart) {
        this.timing.segments.push({
          start: this.timing.currentSegmentStart,
          end: Date.now()
        });
        this.timing.currentSegmentStart = null;
      }

      this.state.wasGeneratingBeforePause = this.state.isGeneratingTargets;
      this.state.isPaused = true;
      this.state.isConfigPause = true;
      this.timing.modalOpenTime = Date.now();
      this.timing.lastFrameTime = 0;
    }
  }

  resumeTraining(): void {
    if (this.state.isPaused) {
      this.state.isPaused = false;
      this.state.isConfigPause = false;
      this.timing.currentSegmentStart = Date.now();
      this.timing.modalOpenTime = null;
      this.timing.lastFrameTime = Date.now();

      if (this.state.wasGeneratingBeforePause) {
        this.state.isGeneratingTargets = true;
        if (this.targets.length === 0) {
          this.generateTargets();
        }
      }
    }
  }

  // Metody związane z celami
  startGeneratingTargets(): void {
    if (!this.state.isGeneratingTargets) {
      this.state.isGeneratingTargets = true;
      this.state.wasGeneratingBeforePause = true;
      this.timing.currentSegmentStart = Date.now();
      this.timing.segments = [];
      this.timing.lastFrameTime = Date.now();
      this.targets = [];
      this.generateTargets();
    }
  }

  stopGeneratingTargets(): void {
    this.state.isGeneratingTargets = false;
    this.state.wasGeneratingBeforePause = false;
    this.targets = [];
  }

  // Zakończenie pracy
  cleanup(): void {
    this.stopRendering();
    this.state.isGeneratingTargets = false;
    this.state.wasGeneratingBeforePause = false;
    this.state.isPaused = false;
    this.state.isConfigPause = false;
    this.timing.currentSegmentStart = null;
    this.timing.modalOpenTime = null;
    this.timing.segments = [];
    this.targets = [];
  }

  private renderCamera(): void {
    const { context: ctx, video, canvas } = this;
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(
      video,
      0, 0,
      video.videoWidth,
      video.videoHeight,
      -canvas.width, 0,
      canvas.width,
      canvas.height
    );
    ctx.restore();
  }

  private renderTrainingArea(): void {
    const { context: ctx, canvas, config } = this;
    const { trainingArea } = config;

    ctx.fillStyle = `rgba(0, 0, 0, ${trainingArea.overlayOpacity})`;
    ctx.fillRect(0, 0, this.trainingArea.x, canvas.height);
    ctx.fillRect(
      this.trainingArea.x + this.trainingArea.width,
      0,
      canvas.width - (this.trainingArea.x + this.trainingArea.width),
      canvas.height
    );
    ctx.fillRect(0, 0, canvas.width, this.trainingArea.y);
    ctx.fillRect(
      0,
      this.trainingArea.y + this.trainingArea.height,
      canvas.width,
      canvas.height - (this.trainingArea.y + this.trainingArea.height)
    );
  }

  private renderFollowTarget(target: TrainingTarget, currentTime: number): void {
    const { context: ctx } = this;
    const path = target.behavior?.path;
    if (path) {
      if (!target.behavior?.pathStarted) {
        drawPath(ctx, path, target.size, target.color, 1);
      } else {
        //const elapsedTime = this.getAdjustedTime(target.createdAt || 0);
        const elapsedTime = currentTime - (target.createdAt || 0);
        const pathProgress = Math.min(elapsedTime / path.totalDuration, 1);
        drawPath(ctx, path, target.size, target.color, pathProgress);
      }
    }
    // Aktualizacja pozycji dla celów typu 'follow'
    if (target.behavior?.type === 'follow' && 
        target.behavior.pathStarted && 
        target.behavior.path) {
      const path = target.behavior.path;
      const elapsedTime = currentTime - (target.createdAt || currentTime);
      //const elapsedTime = this.getAdjustedTime(target.createdAt || 0);
      // Obliczanie nowej pozycji na ścieżce
      target.position = calculatePositionOnPath(path, elapsedTime);

      // Jeśli ścieżka się skończyła i nie jest zapętlona, usuwamy cel
      if (!path.loop && elapsedTime >= path.totalDuration) {
        this.targets = this.targets.filter(t => t.targetId !== target.targetId);
        return;
      }
    }

    this.renderTarget(ctx, target);
  }
}

/*
  Podsumowanie zmian:
  - Uproszczono strukturę kodu przez wykorzystanie typów i funkcji pomocniczych
  - Dodano obsługę obrazów dla celów i punktów kluczowych
  - Wprowadzono konfigurowalność przez TrainingConfig
  - Zachowano całą logikę biznesową i interfejs publiczny
  - Poprawiono czytelność i maintainability kodu
*/