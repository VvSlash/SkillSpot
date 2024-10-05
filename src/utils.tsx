// src/utils.tsx

export type Rectangle = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export type Sprite = {
  x: number;
  y: number;
  width: number;
  height: number;
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
  