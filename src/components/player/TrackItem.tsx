// src/components/player/TrackItem.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Track, CoverShape } from '../../types/player';
import { Play, Pencil } from 'lucide-react';

// Valores que consideramos "vacíos" / desconocidos (vienen de parsers de metadata)
const UNKNOWN_VALUES = new Set([
  '', 'unknown artist', 'unknown album', 'unknown', 'undefined', 'null',
]);
function isMissing(value?: string): boolean {
  if (!value) return true;
  return UNKNOWN_VALUES.has(value.trim().toLowerCase());
}

interface EditableCellProps {
  value: string;
  missing: boolean;
  placeholder: string;
  onSave: (newValue: string) => void;
}

function EditableCell({ value, missing, placeholder, onSave }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // evita que dispare onPlay
    setDraft(missing ? '' : value);
    setEditing(true);
    // Foco en el siguiente tick para que el input ya esté montado
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setEditing(false);
  }, [draft, value, onSave]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
    e.stopPropagation();
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        onClick={(e) => e.stopPropagation()}
        className="bg-neutral-800 text-white text-sm rounded px-2 py-0.5 w-full outline-none ring-1 ring-emerald-500/60 min-w-0"
        style={{ maxWidth: 220 }}
      />
    );
  }

  return (
    <span
      onDoubleClick={startEdit}
      title={missing ? `Doble clic para agregar ${placeholder.toLowerCase()}` : `Doble clic para editar`}
      className={`group/cell flex items-center gap-1 cursor-default select-none ${
        missing ? 'text-neutral-600 italic' : 'text-neutral-400'
      } hover:text-neutral-200 transition-colors`}
    >
      {missing ? `Sin ${placeholder.toLowerCase()}` : value}
      <Pencil
        size={11}
        className="opacity-0 group-hover/cell:opacity-60 transition-opacity flex-shrink-0"
      />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

interface TrackItemProps {
  track: Track;
  index: number;
  isActive: boolean;
  coverShape?: CoverShape;
  onPlay: () => void;
  onUpdateMeta: (trackId: string, updates: Partial<Pick<Track, 'title' | 'artist' | 'album'>>) => void;
}

export function TrackItem({
  track,
  index,
  isActive,
  coverShape = 'rounded',
  onPlay,
  onUpdateMeta,
}: TrackItemProps) {
  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const shapeClasses: Record<string, string> = {
    square: 'rounded-none',
    rounded: 'rounded',
    circle: 'rounded-full',
  };

  const titleMissing = isMissing(track.title);
  const artistMissing = isMissing(track.artist);
  const albumMissing = isMissing(track.album);

  return (
    <tr
      className={`group border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors cursor-pointer ${
        isActive ? 'bg-emerald-500/10' : ''
      }`}
      onClick={onPlay}
    >
      {/* # */}
      <td className="py-2 px-3 w-12">
        <div className="flex items-center justify-center">
          {isActive ? (
            <span className="text-emerald-500">
              <Play size={16} fill="currentColor" />
            </span>
          ) : (
            <span className="text-neutral-500 group-hover:text-white transition-colors tabular-nums">
              {index + 1}
            </span>
          )}
        </div>
      </td>

      {/* Título */}
      <td className="py-2 px-3">
        <div className="flex items-center gap-3">
          {track.coverUrl ? (
            <img
              src={track.coverUrl}
              alt=""
              className={`w-10 h-10 object-cover flex-shrink-0 ${shapeClasses[coverShape]}`}
            />
          ) : (
            <div
              className={`w-10 h-10 bg-neutral-800 flex items-center justify-center text-neutral-600 flex-shrink-0 ${shapeClasses[coverShape]}`}
            >
              <span className="text-xs">🎵</span>
            </div>
          )}

          {titleMissing ? (
            <EditableCell
              value={track.title}
              missing
              placeholder="Título"
              onSave={(v) => onUpdateMeta(track.id, { title: v })}
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                // Abrir edición inline — delegamos al EditableCell embebido
              }}
              className={`font-medium group/title flex items-center gap-1 ${
                isActive ? 'text-emerald-400' : 'text-white'
              }`}
            >
              <EditableCell
                value={track.title}
                missing={false}
                placeholder="Título"
                onSave={(v) => onUpdateMeta(track.id, { title: v })}
              />
            </span>
          )}
        </div>
      </td>

      {/* Artista */}
      <td className="py-2 px-3 hidden sm:table-cell">
        <EditableCell
          value={track.artist}
          missing={artistMissing}
          placeholder="Artista"
          onSave={(v) => onUpdateMeta(track.id, { artist: v })}
        />
      </td>

      {/* Álbum */}
      <td className="py-2 px-3 hidden md:table-cell">
        <EditableCell
          value={track.album}
          missing={albumMissing}
          placeholder="Álbum"
          onSave={(v) => onUpdateMeta(track.id, { album: v })}
        />
      </td>

      {/* Duración */}
      <td className="py-2 px-3 text-right text-neutral-400 tabular-nums">
        {formatDuration(track.duration)}
      </td>
    </tr>
  );
}