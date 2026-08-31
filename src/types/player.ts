// src/types/player.ts
export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  coverUrl?: string; // object URL
  fileBlob: Blob;
  filePath?: string;
  genre?: string;
  year?: number;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[]; // referencias por id para no duplicar Blobs
  coverUrl?: string;
  createdAt: number;
}

export interface User {
  id: string;
  displayName: string;
  avatarUrl?: string; // Base64
}

export type CoverShape = 'square' | 'rounded' | 'circle';
export type ButtonStyle = 'minimal' | 'neon' | 'solid';
export type PlayerLayout = 'bar' | 'fullscreen';

export interface AppSettings {
  coverShape: CoverShape;
  buttonStyle: ButtonStyle;
  playerLayout: PlayerLayout;
}