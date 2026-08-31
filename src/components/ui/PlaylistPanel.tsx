// src/components/ui/PlaylistPanel.tsx
import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Check, ListMusic } from 'lucide-react';
import { usePlaylists } from '../../hooks/usePlaylists';
import { Track } from '../../types/player';

interface PlaylistPanelProps {
  currentTrack?: Track | null;
}

export function PlaylistPanel({ currentTrack }: PlaylistPanelProps) {
  const {
    playlists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    toggleTrackInPlaylist,
    isTrackInPlaylist,
  } = usePlaylists();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (newName.trim()) {
      createPlaylist(newName.trim());
      setNewName('');
      setIsCreating(false);
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renamePlaylist(id, editName.trim());
    }
    setEditingId(null);
  };

  const startEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
  };

  return (
    <div className="mt-2">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Playlists
        </span>
        <button
          onClick={() => setIsCreating(true)}
          className="text-neutral-400 hover:text-white transition-colors p-1 rounded"
          title="Nueva playlist"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Crear nueva */}
      {isCreating && (
        <div className="px-3 py-2 flex items-center gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') setIsCreating(false);
            }}
            placeholder="Nombre de playlist..."
            className="flex-1 bg-neutral-800 text-white text-sm rounded px-2 py-1 outline-none border border-neutral-600 focus:border-emerald-500"
          />
          <button
            onClick={handleCreate}
            className="text-emerald-400 hover:text-emerald-300 p-1"
          >
            <Check size={14} />
          </button>
        </div>
      )}

      {/* Lista de playlists */}
      <div className="space-y-0.5">
        {playlists.length === 0 && !isCreating && (
          <p className="px-3 py-2 text-xs text-neutral-600 italic">Sin playlists aún</p>
        )}
        {playlists.map((pl) => (
          <div
            key={pl.id}
            className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-800/60 transition-colors"
          >
            <ListMusic size={14} className="text-neutral-500 flex-shrink-0" />

            {editingId === pl.id ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleRename(pl.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(pl.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                className="flex-1 bg-neutral-700 text-white text-xs rounded px-1.5 py-0.5 outline-none border border-emerald-500"
              />
            ) : (
              <span className="flex-1 text-sm text-neutral-300 truncate min-w-0">
                {pl.name}
              </span>
            )}

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Añadir/quitar track actual */}
              {currentTrack && (
                <button
                  onClick={() => toggleTrackInPlaylist(pl.id, currentTrack.id)}
                  className={`p-0.5 rounded transition-colors text-xs ${
                    isTrackInPlaylist(pl.id, currentTrack.id)
                      ? 'text-emerald-400'
                      : 'text-neutral-500 hover:text-emerald-400'
                  }`}
                  title={
                    isTrackInPlaylist(pl.id, currentTrack.id)
                      ? 'Quitar de la playlist'
                      : 'Añadir canción actual'
                  }
                >
                  <Plus size={12} />
                </button>
              )}
              {/* Renombrar */}
              <button
                onClick={() => startEdit(pl.id, pl.name)}
                className="p-0.5 rounded text-neutral-500 hover:text-white transition-colors"
                title="Renombrar"
              >
                <Pencil size={11} />
              </button>
              {/* Eliminar */}
              <button
                onClick={() => deletePlaylist(pl.id)}
                className="p-0.5 rounded text-neutral-500 hover:text-red-400 transition-colors"
                title="Eliminar playlist"
              >
                <Trash2 size={11} />
              </button>
            </div>

            {/* Contador */}
            <span className="text-xs text-neutral-600 flex-shrink-0">
              {pl.trackIds.length}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
