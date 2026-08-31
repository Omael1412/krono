// src/hooks/usePlaylists.ts
// Facade conveniente sobre las acciones de playlists del AppContext.
import { useAppContext } from '../store/AppContext';
import { Playlist } from '../types/player';

export function usePlaylists() {
  const {
    state,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  } = useAppContext();

  /** Retorna un playlist por su ID */
  const getPlaylist = (id: string): Playlist | undefined =>
    state.playlists.find((p) => p.id === id);

  /** Retorna las IDs de tracks de un playlist */
  const getPlaylistTrackIds = (id: string): string[] =>
    getPlaylist(id)?.trackIds ?? [];

  /** Verifica si un track está en un playlist */
  const isTrackInPlaylist = (playlistId: string, trackId: string): boolean =>
    getPlaylistTrackIds(playlistId).includes(trackId);

  /** Alterna la pertenencia de un track a un playlist */
  const toggleTrackInPlaylist = (playlistId: string, trackId: string): void => {
    if (isTrackInPlaylist(playlistId, trackId)) {
      removeTrackFromPlaylist(playlistId, trackId);
    } else {
      addTrackToPlaylist(playlistId, trackId);
    }
  };

  return {
    playlists: state.playlists,
    getPlaylist,
    getPlaylistTrackIds,
    isTrackInPlaylist,
    toggleTrackInPlaylist,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  };
}
