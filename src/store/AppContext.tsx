// src/store/AppContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  User, Playlist, AppSettings, CoverShape, ButtonStyle, PlayerLayout,
} from '../types/player';
import {
  loadUser, saveUser, loadPlaylists, savePlaylists, loadSettings, saveSettings,
} from '../services/storage';

// ─── STATE ────────────────────────────────────────────────────────────────────

interface AppState {
  user: User;
  playlists: Playlist[];
  settings: AppSettings;
  dominantColor: string;
  isSettingsOpen: boolean;
  isLoading: boolean;
}

const DEFAULT_USER: User = { id: 'local-user', displayName: 'Oyente' };
const DEFAULT_SETTINGS: AppSettings = {
  coverShape: 'rounded',
  buttonStyle: 'minimal',
  playerLayout: 'bar',
};

const initialState: AppState = {
  user: DEFAULT_USER,
  playlists: [],
  settings: DEFAULT_SETTINGS,
  dominantColor: '#10b981',
  isSettingsOpen: false,
  isLoading: true,
};

// ─── ACTIONS ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'INIT'; payload: { user: User; playlists: Playlist[]; settings: AppSettings } }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_DOMINANT_COLOR'; payload: string }
  | { type: 'SET_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CLOSE_SETTINGS' }
  | { type: 'CREATE_PLAYLIST'; payload: { name: string } }
  | { type: 'DELETE_PLAYLIST'; payload: { id: string } }
  | { type: 'RENAME_PLAYLIST'; payload: { id: string; name: string } }
  | { type: 'ADD_TRACK_TO_PLAYLIST'; payload: { playlistId: string; trackId: string } }
  | { type: 'REMOVE_TRACK_FROM_PLAYLIST'; payload: { playlistId: string; trackId: string } };

// ─── REDUCER ──────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT':
      return { ...state, ...action.payload, isLoading: false };

    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'SET_DOMINANT_COLOR':
      return { ...state, dominantColor: action.payload };

    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'OPEN_SETTINGS':
      return { ...state, isSettingsOpen: true };

    case 'CLOSE_SETTINGS':
      return { ...state, isSettingsOpen: false };

    case 'CREATE_PLAYLIST': {
      const newPlaylist: Playlist = {
        id: crypto.randomUUID(),
        name: action.payload.name,
        trackIds: [],
        createdAt: Date.now(),
      };
      return { ...state, playlists: [...state.playlists, newPlaylist] };
    }

    case 'DELETE_PLAYLIST':
      return {
        ...state,
        playlists: state.playlists.filter((p) => p.id !== action.payload.id),
      };

    case 'RENAME_PLAYLIST':
      return {
        ...state,
        playlists: state.playlists.map((p) =>
          p.id === action.payload.id ? { ...p, name: action.payload.name } : p,
        ),
      };

    case 'ADD_TRACK_TO_PLAYLIST':
      return {
        ...state,
        playlists: state.playlists.map((p) => {
          if (p.id !== action.payload.playlistId) return p;
          if (p.trackIds.includes(action.payload.trackId)) return p;
          return { ...p, trackIds: [...p.trackIds, action.payload.trackId] };
        }),
      };

    case 'REMOVE_TRACK_FROM_PLAYLIST':
      return {
        ...state,
        playlists: state.playlists.map((p) =>
          p.id === action.payload.playlistId
            ? { ...p, trackIds: p.trackIds.filter((id) => id !== action.payload.trackId) }
            : p,
        ),
      };

    default:
      return state;
  }
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Acciones de alto nivel
  updateUser: (updates: Partial<User>) => void;
  setDominantColor: (color: string) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  createPlaylist: (name: string) => void;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Cargar datos persistidos al iniciar
  useEffect(() => {
    Promise.all([loadUser(), loadPlaylists(), loadSettings()])
      .then(([user, playlists, settings]) => {
        dispatch({
          type: 'INIT',
          payload: {
            user: user ?? DEFAULT_USER,
            playlists,
            settings,
          },
        });
      })
      .catch(() => {
        dispatch({
          type: 'INIT',
          payload: { user: DEFAULT_USER, playlists: [], settings: DEFAULT_SETTINGS },
        });
      });
  }, []);

  // Persistir playlists al cambiar
  useEffect(() => {
    if (!state.isLoading) {
      savePlaylists(state.playlists).catch(console.error);
    }
  }, [state.playlists, state.isLoading]);

  // Persistir settings al cambiar
  useEffect(() => {
    if (!state.isLoading) {
      saveSettings(state.settings).catch(console.error);
    }
  }, [state.settings, state.isLoading]);

  const updateUser = useCallback((updates: Partial<User>) => {
    const updated = { ...state.user, ...updates };
    dispatch({ type: 'SET_USER', payload: updated });
    saveUser(updated).catch(console.error);
  }, [state.user]);

  const setDominantColor = useCallback((color: string) => {
    dispatch({ type: 'SET_DOMINANT_COLOR', payload: color });
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    dispatch({ type: 'SET_SETTINGS', payload: updates });
  }, []);

  const createPlaylist = useCallback((name: string) => {
    dispatch({ type: 'CREATE_PLAYLIST', payload: { name } });
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    dispatch({ type: 'DELETE_PLAYLIST', payload: { id } });
  }, []);

  const renamePlaylist = useCallback((id: string, name: string) => {
    dispatch({ type: 'RENAME_PLAYLIST', payload: { id, name } });
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, trackId: string) => {
    dispatch({ type: 'ADD_TRACK_TO_PLAYLIST', payload: { playlistId, trackId } });
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    dispatch({ type: 'REMOVE_TRACK_FROM_PLAYLIST', payload: { playlistId, trackId } });
  }, []);

  const value: AppContextValue = {
    state,
    dispatch,
    updateUser,
    setDominantColor,
    updateSettings,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
