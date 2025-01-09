/*
  Plik: /src/types/training.ts
  Opis: Typy dla konfiguracji treningu
*/

import { TargetBehavior, TargetPath, TrainingConfig } from '../utils';

// Typ dla predefiniowanych treningów
export type PredefinedTraining = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  category: 'full' | 'upper' | 'lower' | 'random' | 'map';
  config: Partial<TrainingConfig>;
  isMapTraining?: boolean;
  mapData?: TrainingMapData;
};

// Typ dla danych mapy treningowej
export type TrainingMapData = {
  version: string;
  name: string;
  author: string;
  difficulty: 'easy' | 'medium' | 'hard';
  targets: TrainingMapTarget[];
  sequences: TrainingMapSequence[];
};

// Typ dla celu w mapie treningowej
export type TrainingMapTarget = {
  id: string;
  type: 'static' | 'follow';
  keypoint: string | string[];
  position: { x: number; y: number };
  spawnTime: number;
  duration?: number;
  path?: {
    type: 'circle' | 'line';
    radius?: number;
    startAngle?: number;
    endPoint?: { x: number; y: number };
    duration: number;
  };
};

// Typ dla sekwencji w mapie treningowej
export type TrainingMapSequence = {
  id: string;
  targets: string[]; // ID celów w kolejności
  enforceOrder: boolean;
  showNumbers: boolean;
};

// Typ dla ustawień dostosowania treningu
export interface TrainingAdjustments {
  speed: number;
  variation: number;
  disappearingProbability: number;
  trainingArea: {
    aspectRatio: number;
    margin: number;
    overlayOpacity: number;
    upperZoneRatio: number;
    targetSize: number;
    hitRadius: number;
  };
  enabledKeypoints: {
    leftWrist: boolean;
    rightWrist: boolean;
    leftAnkle: boolean;
    rightAnkle: boolean;
  };
//   keypointProbabilities: {
//     leftWrist: number;
//     rightWrist: number;
//     leftAnkle: number;
//     rightAnkle: number;
//   };
  defaultBehavior: {
    type: 'static' | 'follow';
    followThreshold: number;
    minFollowDistance: number;
    path?: TargetPath;
    pathStarted?: boolean;
  };
  targetProbabilities: {
    handPair: number;
    handSingle: number;
    singleLeftWrist: number;
    singleRightWrist: number;
    singleLeftAnkle: number;
    singleRightAnkle: number;
    anyHand: number;
    anyFoot: number;
    footSingle: number;
    anyLimb: number;
    sequence: number;
    follow: number;
  };
  sequenceConfig: {
    minSequenceSize: number;
    maxSequenceSize: number;
    minDelay: number;
    maxDelay: number;
    enforceOrder: boolean;
    showNumbers: boolean;
    handProbability: number;
    pairProbability: number;
    footMinDelay: number;
    footMaxDelay: number;
    delayBetweenTargets: number;
  };
  followConfig: {
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
  disappearingConfig: {
    probabilities: {
      sequence: number;
      follow: number;
      handPair: number;
      singleHand: number;
      anyHand: number;
      anyFoot: number;
      anyLimb: number;
      singleFoot: number;
    };
    minDuration: number;
    maxDuration: number;
    sequenceBuffer: number;
  };
}

// Typ dla konfiguracji całego treningu
export type CompleteTrainingConfig = {
  selectedTraining: PredefinedTraining;
  adjustments: TrainingAdjustments;
};