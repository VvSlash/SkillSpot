/*
  Plik: /src/types/motion.ts
  Opis: Typy dla detekcji ruchu
*/

// Typ dla punktu kluczowego
export type Keypoint = {
  id: string;
  x: number | null;
  y: number | null;
  color: string;
  image?: HTMLImageElement | SVGImageElement;
};

// Typ dla konfiguracji detekcji pozy
export type PoseDetectionConfig = {
  minConfidence: number;
  maxPoses: number;
  scoreThreshold: number;
  nmsRadius: number;
};

// Typ dla wyników detekcji pozy
export type PoseDetectionResult = {
  keypoints: Keypoint[];
  score: number;
};

// Typ dla funkcji callback detekcji pozy
export type PoseDetectionCallback = (keypoints: Keypoint[]) => void; 
 
 
 
 
 
 
 
 
 