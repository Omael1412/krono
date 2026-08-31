// src/services/storage.ts
// Persistencia en IndexedDB para datos de usuario y playlists.
import { Playlist, User, AppSettings } from '../types/player';

const DB_NAME = 'krono-db';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('user')) {
        db.createObjectStore('user', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── USER ────────────────────────────────────────────────────────────────────

export async function saveUser(user: User): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('user', 'readwrite');
    tx.objectStore('user').put(user);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadUser(): Promise<User | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('user', 'readonly');
    const req = tx.objectStore('user').get('local-user');
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

// ─── PLAYLISTS ────────────────────────────────────────────────────────────────

export async function savePlaylists(playlists: Playlist[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    store.clear();
    playlists.forEach((p) => store.put(p));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadPlaylists(): Promise<Playlist[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readonly');
    const req = tx.objectStore('playlists').getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

// ─── APP SETTINGS ─────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  coverShape: 'rounded',
  buttonStyle: 'minimal',
  playerLayout: 'bar',
};

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    tx.objectStore('settings').put({ key: 'app', ...settings });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadSettings(): Promise<AppSettings> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readonly');
    const req = tx.objectStore('settings').get('app');
    req.onsuccess = () => resolve(req.result ? { ...req.result } : DEFAULT_SETTINGS);
    req.onerror = () => reject(req.error);
  });
}
