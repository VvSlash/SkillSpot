/*
  Plik: /src/components/CanvasRenderer.tsx
  Opis:
  Plik zawiera definicję klasy CanvasRenderer, która jest odpowiedzialna za renderowanie obrazu wideo oraz rysowanie sprite'ów na płótnie (canvas). 
  Klasa ta umożliwia dodawanie, przesuwanie i usuwanie sprite'ów oraz sprawdzanie kolizji między nimi.
*/

import { rectanglesIntersect, spriteToRect, Sprite as UtilSprite } from '../utils';

// Typ definiujący właściwości sprite'a
export type Sprite = UtilSprite & {
  image?: CanvasImageSource;
  id?: string;
  color?: string; // Opcjonalna właściwość koloru
};

// Klasa CanvasRenderer
export class CanvasRenderer {
  private videoElement: HTMLVideoElement; // Element wideo, z którego pobierany jest obraz
  private canvasElement: HTMLCanvasElement; // Element płótna (canvas), na którym rysowane są sprite'y
  private context: CanvasRenderingContext2D; // Kontekst 2D płótna
  private spritesMap: Map<string, Sprite> = new Map(); // Mapa sprite'ów przechowująca wszystkie sprite'y z przypisanym identyfikatorem
  private rafId: number | null = null; // Identyfikator requestAnimationFrame

  constructor(stream: MediaStream, video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this.canvasElement = canvas;
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.videoElement = video;
    this.videoElement.srcObject = stream;
    this.spritesMap = new Map<string, Sprite>();

    const settings = stream.getVideoTracks()[0].getSettings();
    this.setResolution(settings.width || 1920, settings.height || 1080);
    this.videoElement.play();
  }

  // Renderowanie obrazu wideo oraz sprite'ów na płótnie
  renderCanvas() {
    // Odwrócenie obrazu w poziomie (mirror effect)
    this.context.setTransform(-1, 0, 0, 1, this.canvasElement.width, 0);
    this.context.drawImage(this.videoElement, 0, 0, this.videoElement.width, this.videoElement.height);
    this.drawSprites();
    this.rafId = requestAnimationFrame(this.renderCanvas.bind(this)); // Ciągłe renderowanie płótna
  }

  // Ustawienie rozdzielczości wideo i płótna
  setResolution(width: number, height: number) {
    if (this.videoElement && this.canvasElement) {
      this.videoElement.width = width;
      this.videoElement.height = height;
      this.canvasElement.width = width;
      this.canvasElement.height = height;
    }
  }

  // Pobranie aktualnej rozdzielczości płótna
  getResolution(): [number, number] {
    return [this.canvasElement.width, this.canvasElement.height];
  }

  // Rysowanie wszystkich sprite'ów na płótnie
  drawSprites() {
    for (const [, sprite] of this.spritesMap) {
      if (sprite.image) {
        // Rysowanie obrazu sprite'a, jeśli jest dostępny
        this.context.drawImage(sprite.image, sprite.x, sprite.y, sprite.width, sprite.height);
      } else {
        // Rysowanie prostokąta wypełnionego kolorem, jeśli obraz nie jest dostępny
        this.context.fillStyle = sprite.color || 'black'; // Domyślny kolor to czarny
        this.context.fillRect(sprite.x, sprite.y, sprite.width, sprite.height);
      }
    }
  }

  // Dodanie sprite'a do renderera
  addSprite(sprite: Sprite, id?: string): string {
    id = id || new Date().toISOString(); // Jeśli nie podano ID, generowane jest unikalne ID
    this.spritesMap.set(id, { ...sprite, id });
    return id;
  }

  // Przesunięcie sprite'a na nową pozycję
  moveSprite(id: string, x: number, y: number) {
    const sprite = this.spritesMap.get(id);
    if (sprite) {
      sprite.x = x;
      sprite.y = y;
    }
  }

  // Usunięcie sprite'a z renderera
  deleteSprite(id: string) {
    this.spritesMap.delete(id);
  }

  // Sprawdzenie, które sprite'y nachodzą na dany sprite (kolizje)
  getOverlappingSprites(id: string): string[] {
    const overlapping: string[] = [];
    const referenceSprite = this.spritesMap.get(id);

    if (!referenceSprite) {
      throw new Error("Sprite doesn't exist");
    }

    const referenceRect = spriteToRect(referenceSprite);

    for (const [otherId, sprite] of this.spritesMap) {
      if (otherId === id) continue; // Pomijanie porównania sprite'a z samym sobą

      const spriteRect = spriteToRect(sprite);
      if (rectanglesIntersect(referenceRect, spriteRect)) {
        overlapping.push(otherId);
      }
    }

    return overlapping;
  }

  // Sprawdzenie, czy sprite o danym ID istnieje
  hasSprite(id: string): boolean {
    return this.spritesMap.has(id);
  }

  // Zatrzymanie renderowania płótna
  stopRendering() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

/*
  Podsumowanie:
  - Klasa CanvasRenderer jest odpowiedzialna za renderowanie obrazu z kamery na płótnie oraz rysowanie sprite'ów.
  - Umożliwia dodawanie, przesuwanie, usuwanie sprite'ów oraz sprawdzanie kolizji między nimi.
  - Metoda renderCanvas() ciągle renderuje obraz z kamery oraz sprite'y, tworząc płynny efekt wizualny.
  - Klasa obsługuje zarządzanie rozdzielczością płótna, co jest istotne dla dopasowania obrazu do różnych ekranów.
  - Dodano metodę stopRendering(), aby umożliwić zatrzymanie ciągłego renderowania płótna, co pomaga w lepszym zarządzaniu zasobami.
*/