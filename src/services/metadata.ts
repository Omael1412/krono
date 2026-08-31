// src/services/metadata.ts
import { parseBlob } from 'music-metadata-browser';
import { Track } from '../types/player';

/**
 * Obtiene la duración real de un blob de audio creando un elemento <audio>
 * temporal y esperando el evento `loadedmetadata`. Funciona como fallback
 * cuando el parser de etiquetas no devuelve la duración.
 */
function getDurationFromBlob(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    const cleanup = () => {
      URL.revokeObjectURL(url);
      audio.src = '';
    };
    audio.addEventListener('loadedmetadata', () => {
      const dur = isFinite(audio.duration) ? audio.duration : 0;
      cleanup();
      resolve(dur);
    });
    audio.addEventListener('error', () => {
      cleanup();
      resolve(0);
    });
    // Tiempo límite de 5 s para no bloquear
    setTimeout(() => {
      cleanup();
      resolve(0);
    }, 5000);
  });
}

export async function extractMetadata(file: File | Blob): Promise<Omit<Track, 'id' | 'fileBlob'>> {
  const metadata = await parseBlob(file);
  const common = metadata.common;
  const format = metadata.format;

  let coverUrl: string | undefined;
  if (common.picture && common.picture.length > 0) {
    const picture = common.picture[0];
    const blob = new Blob([picture.data as unknown as BlobPart], { type: picture.format });
    coverUrl = URL.createObjectURL(blob);
  }

  // Si el parser no devuelve duración, la obtenemos del audio nativo
  let duration = format.duration && isFinite(format.duration) ? format.duration : 0;
  if (duration === 0) {
    duration = await getDurationFromBlob(file);
  }

  return {
    title: common.title || 'Unknown Title',
    artist: common.artist || 'Unknown Artist',
    album: common.album || 'Unknown Album',
    duration,
    coverUrl,
  };
}

export function revokeCoverUrl(track: Track): void {
  if (track.coverUrl) {
    URL.revokeObjectURL(track.coverUrl);
  }
}