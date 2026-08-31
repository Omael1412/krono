// src/services/metadata.ts
import { parseBlob } from 'music-metadata-browser';
import { Track } from '../types/player';

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

  return {
    title: common.title || 'Unknown Title',
    artist: common.artist || 'Unknown Artist',
    album: common.album || 'Unknown Album',
    duration: format.duration || 0,
    coverUrl,
  };
}

export function revokeCoverUrl(track: Track): void {
  if (track.coverUrl) {
    URL.revokeObjectURL(track.coverUrl);
  }
}