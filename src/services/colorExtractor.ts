// src/services/colorExtractor.ts
import ColorThief from 'color-thief-browser';

export interface ColorPalette {
  dominant: [number, number, number]; // RGB
  vibrant: [number, number, number];
  muted: [number, number, number];
}

const colorThief = new ColorThief();

export function extractPalette(imageUrl: string): Promise<ColorPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    img.onload = () => {
      try {
        const dominant = colorThief.getColor(img);
        const palette = colorThief.getPalette(img, 3);
        const vibrant = palette[0] || dominant;
        const muted = palette[1] || dominant;
        resolve({ dominant, vibrant, muted });
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for color extraction'));
  });
}