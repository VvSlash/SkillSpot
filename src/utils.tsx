// src/utils.tsx

import { TEST_TRAINING_CONFIG } from './config/training';

export type Rectangle = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export type Point = {
  x: number;
  y: number;
};

export type Sprite = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// Typ dla punktu kontrolnego ścieżki
export type PathPoint = Point & {
  timestamp: number; // Względny czas w ms od początku ścieżki
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'; // Funkcja przejścia do następnego punktu
};

// Typ dla ścieżki
export type TargetPath = {
  points: PathPoint[];
  totalDuration: number; // Całkowity czas przejścia ścieżki w ms
  loop?: boolean; // Czy ścieżka ma się zapętlać
  showPath?: boolean; // Czy ścieżka ma być widoczna
  pathColor?: string; // Kolor ścieżki (domyślnie taki jak celu)
  pathOpacity?: number; // Przezroczystość ścieżki (0-1)
};

// Typy dla punktów kluczowych
export type KeypointId = 'leftWrist' | 'rightWrist' | 'leftAnkle' | 'rightAnkle';
export type TargetKeypoint = KeypointId | KeypointId[];

// Typ dla konfiguracji celu
export type TargetConfig = {
  keypoint: TargetKeypoint;
  color: string;
  zone: 'upper' | 'lower' | 'any';
  pair?: KeypointId;
  position?: Point; // Opcjonalna pozycja z edytora
  spawnTime?: number; // Czas utworzenia względem początku treningu (ms)
  variation?: { // Opcjonalne rozproszenie pozycji
    radius: number; // Promień rozproszenia w pikselach
    angle?: number; // Opcjonalny kąt (w radianach) - jeśli nie podany, będzie losowy
  };
};

// Funkcja do obliczania rzeczywistej pozycji celu z uwzględnieniem wariacji
export function calculateTargetPosition(
  basePosition: Point,
  variation?: TargetConfig['variation']
): Point {
  if (!variation) return basePosition;

  const angle = variation.angle ?? Math.random() * Math.PI * 2;
  const radius = Math.random() * variation.radius;

  return {
    x: basePosition.x + radius * Math.cos(angle),
    y: basePosition.y + radius * Math.sin(angle)
  };
}

// Typ dla konfiguracji celu
export type TargetBehavior = {
  type: 'static' | 'follow';
  duration?: number;
  followThreshold?: number;
  minFollowDistance?: number;
  path?: TargetPath;
  pathStarted?: boolean; // Flaga wskazująca czy ruch po ścieżce się rozpoczął
};

// Funkcje easingu
export const easingFunctions = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => 1 - (1 - t) * (1 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
};

// Funkcja do interpolacji punktów na ścieżce
export function interpolatePathPoint(
  start: Point,
  end: Point,
  progress: number,
  easing: keyof typeof easingFunctions = 'linear'
): Point {
  const easedProgress = easingFunctions[easing](progress);
  return {
    x: start.x + (end.x - start.x) * easedProgress,
    y: start.y + (end.y - start.y) * easedProgress,
  };
}

// Funkcja do rysowania ścieżki
export function drawPath(
  ctx: CanvasRenderingContext2D,
  path: TargetPath,
  targetSize: number,
  color: string,
  currentProgress: number = 1
): void {
  const { points, pathOpacity = 0.3 } = path;
  if (points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = path.pathColor || color;
  ctx.lineWidth = targetSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = pathOpacity;

  // Rysowanie ścieżki
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    const prevPoint = points[i - 1];
    const currentPoint = points[i];
    const segments = 10; // Liczba segmentów między punktami dla płynności

    // Rysowanie segmentów z uwzględnieniem easingu
    for (let j = 1; j <= segments; j++) {
      const segmentProgress = j / segments;
      const point = interpolatePathPoint(
        prevPoint,
        currentPoint,
        segmentProgress,
        currentPoint.easing
      );
      ctx.lineTo(point.x, point.y);
    }
  }

  // Rysowanie tylko części ścieżki do aktualnej pozycji
  if (currentProgress < 1) {
    ctx.globalAlpha = pathOpacity * 0.5;
  }
  
  ctx.stroke();
  ctx.restore();
}

// Funkcja do obliczania pozycji na ścieżce
export function calculatePositionOnPath(
  path: TargetPath,
  elapsedTime: number
): Point {
  const { points, totalDuration, loop } = path;
  if (points.length < 2) return points[0];

  // Obliczanie aktualnego czasu z uwzględnieniem zapętlenia
  const currentTime = loop 
    ? elapsedTime % totalDuration 
    : Math.min(elapsedTime, totalDuration);

  // Znajdowanie odpowiedniego segmentu ścieżki
  let currentPoint = points[0];
  let nextPoint = points[1];
  let segmentStartTime = 0;

  for (let i = 1; i < points.length; i++) {
    if (points[i].timestamp > currentTime) {
      currentPoint = points[i - 1];
      nextPoint = points[i];
      segmentStartTime = currentPoint.timestamp;
      break;
    }
  }

  // Obliczanie postępu w aktualnym segmencie
  const segmentDuration = nextPoint.timestamp - currentPoint.timestamp;
  const segmentProgress = (currentTime - segmentStartTime) / segmentDuration;

  return interpolatePathPoint(
    currentPoint,
    nextPoint,
    segmentProgress,
    nextPoint.easing
  );
}

export type RenderableObject = {
  position: Point;
  size: number;
  color: string;
  image?: HTMLImageElement | SVGImageElement;
  id?: string;
  targetId?: string;
  behavior?: TargetBehavior;
  createdAt?: number; // timestamp utworzenia celu
  followTime?: number; // czas podążania za celem
};

export type TrainingConfig = {
  speed: number;
  trainingArea: {
    aspectRatio: number;
    margin: number;
    overlayOpacity: number;
    upperZoneRatio: number;
    targetSize: number;
    hitRadius: number;
  };
  defaultBehavior?: TargetBehavior;
  variation: number;
  disappearingProbability: number;
  enabledKeypoints: {
    leftWrist: boolean;
    rightWrist: boolean;
    leftAnkle: boolean;
    rightAnkle: boolean;
  };
  sequenceConfig?: {
    minSequenceSize: number;
    maxSequenceSize: number;
    enforceOrder: boolean; // Czy wymusić kolejność zbijania
    showNumbers: boolean; // Czy pokazywać numerację
    delayBetweenTargets?: number; // Opóźnienie między pojawieniem się celów (ms)
    handProbability: number;
    pairProbability: number;
    footMinDelay: number;
    footMaxDelay: number;
    minDelay: number;
    maxDelay: number;
  };
  targetProbabilities: {
    sequence: number;
    follow: number;
    handPair: number;
    singleLeftWrist: number;
    singleRightWrist: number;
    singleLeftAnkle: number;
    singleRightAnkle: number;
    anyHand: number;
    anyFoot: number;
    anyLimb: number;
  };
  followConfig?: {
    minDuration: number;
    maxDuration: number;
    minRadius: number;
    maxRadius: number;
    circleProbability: number;
    showPath: boolean;
    pathOpacity: number;
    segments: {
      path: number;
      circle: number;
      line: number;
    };
  };
  disappearingConfig?: {
    minDuration: number;
    maxDuration: number;
    sequenceBuffer?: number;
    probabilities?: {
      sequence?: number;
      follow?: number;
      handPair?: number;
      singleHand?: number;
      anyHand?: number;
      anyFoot?: number;
      anyLimb?: number;
      singleFoot?: number;
    };

  };
};

export const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
  speed: 1.0,
  trainingArea: {
    aspectRatio: 9/16,
    margin: 40,
    overlayOpacity: 0.5,
    upperZoneRatio: 0.66,
    targetSize: 30,
    hitRadius: 20,
  },
  variation: 0,
  disappearingProbability: 0.3,
  enabledKeypoints: {
    leftWrist: true,
    rightWrist: true,
    leftAnkle: true,
    rightAnkle: true,
  },
  defaultBehavior: {
    type: 'static',
    minFollowDistance: 30,
    followThreshold: 1000,
  },
  sequenceConfig: {
    minSequenceSize: 2,
    maxSequenceSize: 5,
    enforceOrder: false,
    showNumbers: true,
    handProbability: 0.7,
    pairProbability: 0.3,
    footMinDelay: 1000,
    footMaxDelay: 2000,
    minDelay: 500,
    maxDelay: 2000,
  },
  targetProbabilities: {
    sequence: 0.15,
    follow: 0.15,
    handPair: 0.15,
    singleLeftWrist: 0.06,
    singleRightWrist: 0.06,
    singleLeftAnkle: 0.06,
    singleRightAnkle: 0.06,
    anyHand: 0.05,
    anyFoot: 0.05,
    anyLimb: 0.05,
  },
  followConfig: {
    minDuration: 2000,
    maxDuration: 5000,
    minRadius: 30,
    maxRadius: 100,
    circleProbability: 0.6,
    showPath: true,
    pathOpacity: 0.4,
    segments: {
      path: 16,
      circle: 24,
      line: 2,
    },
  },
  disappearingConfig: {
    minDuration: 2000,
    maxDuration: 5000,
    sequenceBuffer: 1000,
    probabilities: {
      sequence: 0.3,
      follow: 0.7,
      handPair: 0.3,
      singleHand: 0.4,
      anyHand: 0.4,
      anyFoot: 0.3,
      anyLimb: 0.3,
      singleFoot: 0.3,
    },
  },
};

export function rectanglesIntersect(rectA: Rectangle, rectB: Rectangle): boolean {
  const aLeftOfB = rectA.xMax < rectB.xMin;
  const aRightOfB = rectA.xMin > rectB.xMax;
  const aAboveB = rectA.yMin > rectB.yMax;
  const aBelowB = rectA.yMax < rectB.yMin;
  return !(aLeftOfB || aRightOfB || aAboveB || aBelowB);
}

export function spriteToRect(sprite: Sprite): Rectangle {
  return {
    xMin: sprite.x,
    xMax: sprite.x + sprite.width,
    yMin: sprite.y,
    yMax: sprite.y + sprite.height,
  };
}

// Function to capture the camera feed
export async function captureCamera(): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    audio: false,
    video: {
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 30 },
    },
  };
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    console.error('Error accessing user media:', error);
    throw error;
  }
}

// Funkcje pomocnicze dla renderowania
export function drawObject(
  ctx: CanvasRenderingContext2D,
  object: RenderableObject
): void {
  const { position, size, color, image } = object;
  const x = position.x - size / 2;
  const y = position.y - size / 2;
  
  if (image) {
    ctx.drawImage(image, x, y, size, size);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);
  }
}

export function drawKeypoint(
  ctx: CanvasRenderingContext2D,
  object: RenderableObject
): void {
  const { position, size, color, image } = object;
  
  if (image) {
    ctx.drawImage(image, position.x - size/2, position.y - size/2, size, size);
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(position.x, position.y, size/2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Funkcja do obliczania odległości między punktami
export function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

// Funkcja do sprawdzania czy punkt jest w prostokącie
export function isPointInRect(point: Point, rect: { x: number; y: number; width: number; height: number }): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

// Funkcja generująca unikalny identyfikator dla celu
export function generateTargetId(keypoint: string): string {
  return `${keypoint}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Typ dla grupy celów
export type TargetGroup = {
  groupId: string;
  targets: TargetConfig[];
  sequenceNumbers?: boolean; // Czy wyświetlać numerację
  enforceSequence?: boolean; // Czy wymusić kolejność zbijania
  currentIndex?: number; // Aktualny indeks w sekwencji
};

// Funkcja do rysowania numeru sekwencji
export function drawSequenceNumber(
  ctx: CanvasRenderingContext2D,
  position: Point,
  size: number,
  number: number
): void {
  ctx.save();
  ctx.fillStyle = 'white';
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.font = `${size * 0.8}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const text = number.toString();
  ctx.fillText(text, position.x, position.y);
  ctx.strokeText(text, position.x, position.y);
  ctx.restore();
}

// Funkcja do generowania losowego odstępu czasowego
export function generateRandomDelay(maxDelay: number = 2000): number {
  return Math.random() * maxDelay;
}

// Zastąpienie starych stałych nowymi z konfiguracji
const { TARGET_PROBABILITIES } = TEST_TRAINING_CONFIG;

// Funkcja do generowania losowej grupy celów
export function generateRandomTargetGroup(
  startTime: number,
  config: TrainingConfig
): TargetGroup {
  const { targetProbabilities, sequenceConfig } = config;
  // Lista dostępnych kończyn (filtrowana wg. prawdopodobieństw)
  const availableHands: KeypointId[] = [];
  // Zakładamy, że SINGLE_LEFT_WRIST i SINGLE_RIGHT_WRIST odpowiadają lewemu/prawemu nadgarstkowi
  // i jeśli ich prawdopodobieństwo jest > 0, to dopuszczamy je do sekwencji.
  if (targetProbabilities.singleLeftWrist > 0) {
    availableHands.push('leftWrist');
  }
  if (targetProbabilities.singleRightWrist > 0) {
    availableHands.push('rightWrist');
  }

  const availableFeet: KeypointId[] = [];
  if (targetProbabilities.singleLeftAnkle > 0) {
    availableFeet.push('leftAnkle');
  }
  if (targetProbabilities.singleRightAnkle > 0) {
    availableFeet.push('rightAnkle');
  }

  const groupSize = Math.floor(Math.random() * (sequenceConfig?.maxSequenceSize ?? 4) + (sequenceConfig?.minSequenceSize ?? 2)); // od 2 do 5 celów
  const targets: TargetConfig[] = [];
  let currentTime = startTime;
  let usedHands = false;
  let usedFeet = false;

  for (let i = 0; i < groupSize; i++) {
    // Losujemy rękę czy stopę, ale tylko spośród dostępnych kończyn
    // const isHand = Math.random() < 0.7 && availableHands.length > 0;

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
      if (randomKeypointValue < cumulativeKeypointProbability && (availableHands.includes(keypoint.keypoint.keypoint as KeypointId) || availableFeet.includes(keypoint.keypoint.keypoint as KeypointId))) {
        selectedKeypoint = keypoint.keypoint;
        targets.push({
          ...selectedKeypoint,
          spawnTime: currentTime
        });
        usedHands = selectedKeypoint.keypoint === 'leftWrist' || selectedKeypoint.keypoint === 'rightWrist';
        usedFeet = selectedKeypoint.keypoint === 'leftAnkle' || selectedKeypoint.keypoint === 'rightAnkle';
        break;
      }
    }
    
    // if (isHand) {
    //   // Wybieramy losowo z puli dostępnych rąk
    //   const randomHand = availableHands[Math.floor(Math.random() * availableHands.length)];
    //   targets.push({
    //     ...TARGET_CONFIG[randomHand],
    //     spawnTime: currentTime
    //   });
    //   usedHands = true;
    // } else {
    //   // Jeśli brak dostępnych stóp, a wypadnie "stopa", można rozważyć ponowny wybór
    //   if (availableFeet.length === 0 && availableHands.length > 0) {
    //     // fallback - wracamy do rąk
    //     const randomHand = availableHands[Math.floor(Math.random() * availableHands.length)];
    //     targets.push({
    //       ...TARGET_CONFIG[randomHand],
    //       spawnTime: currentTime
    //     });
    //     usedHands = true;
    //   } else if (availableFeet.length > 0) {
    //     if (usedFeet) {
    //       currentTime += 1000 + Math.random() * 1000; // 1-2s przerwy między kolejnymi nogami
    //     }
    //     const randomFoot = availableFeet[Math.floor(Math.random() * availableFeet.length)];
    //     targets.push({
    //       ...TARGET_CONFIG[randomFoot],
    //       spawnTime: currentTime
    //     });
    //     usedFeet = true;
    //   }
    // }

    // Dodaj losowy odstęp czasowy przed następnym celem
    currentTime += generateRandomDelay();
  }

  return {
    groupId: `group_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    targets,
    sequenceNumbers: true,
  };
}

// Konfiguracja celów treningowych
export const TARGET_CONFIG: Record<string, TargetConfig> = {
  leftWrist: { keypoint: 'leftWrist', color: 'red', zone: 'upper', pair: 'rightWrist' },
  rightWrist: { keypoint: 'rightWrist', color: 'blue', zone: 'upper', pair: 'leftWrist' },
  leftAnkle: { keypoint: 'leftAnkle', color: 'green', zone: 'lower' },
  rightAnkle: { keypoint: 'rightAnkle', color: 'yellow', zone: 'lower' },
  anyHand: { keypoint: ['leftWrist', 'rightWrist'], color: 'purple', zone: 'upper' },
  anyFoot: { keypoint: ['leftAnkle', 'rightAnkle'], color: 'lime', zone: 'lower' },
  anyLimb: { keypoint: ['leftWrist', 'rightWrist', 'leftAnkle', 'rightAnkle'], color: 'white', zone: 'any' },
};
  