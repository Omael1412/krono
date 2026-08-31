// src/services/fileScanner.ts
import { Track } from '../types/player';
import { extractMetadata } from './metadata';

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];

function isAudioFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return AUDIO_EXTENSIONS.some(ext => name.endsWith(ext));
}

export async function scanFilesFromInput(fileList: FileList): Promise<Track[]> {
  const files = Array.from(fileList).filter(isAudioFile);
  const tracks: Track[] = [];

  for (const file of files) {
    try {
      const meta = await extractMetadata(file);
      const track: Track = {
        id: crypto.randomUUID(),
        ...meta,
        fileBlob: file,
        duration: meta.duration,
        coverUrl: meta.coverUrl,
      };
      tracks.push(track);
    } catch (error) {
      // fallback: use file name
      const track: Track = {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^.]+$/, ''),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        duration: 0,
        fileBlob: file,
      };
      tracks.push(track);
    }
  }
  return tracks;
}

export async function scanFilesFromDirectoryPicker(): Promise<Track[]> {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('Directory picker not supported in this browser');
  }
  const dirHandle = await window.showDirectoryPicker();
  const files: File[] = [];

  async function walkDir(dirHandle: FileSystemDirectoryHandle) {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        if (isAudioFile(file)) {
          files.push(file);
        }
      } else if (entry.kind === 'directory') {
        await walkDir(entry);
      }
    }
  }

  await walkDir(dirHandle);
  return scanFilesFromInput(files as unknown as FileList); // reuse
}