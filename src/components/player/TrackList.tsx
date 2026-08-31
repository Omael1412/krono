// src/components/player/TrackList.tsx
import React, { useState, useMemo } from 'react';
import { Track, CoverShape } from '../../types/player';
import { TrackItem } from './TrackItem';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

type SortKey = 'index' | 'title' | 'artist' | 'album' | 'duration';
type SortDir = 'asc' | 'desc';

// Valores vacíos/desconocidos (sin info) para ordenar al final
const UNKNOWN_VALUES = new Set([
  '', 'unknown artist', 'unknown album', 'unknown', 'undefined', 'null',
]);
function isEmpty(v?: string) {
  return !v || UNKNOWN_VALUES.has(v.trim().toLowerCase());
}

interface TrackListProps {
  tracks: Track[];
  currentTrackId?: string | null;
  coverShape: CoverShape;
  onTrackSelect: (track: Track) => void;
  onUpdateMeta: (trackId: string, updates: Partial<Pick<Track, 'title' | 'artist' | 'album'>>) => void;
}

interface ColHeaderProps {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
  className?: string;
}

function ColHeader({ label, sortKey, currentKey, dir, onClick, className = '' }: ColHeaderProps) {
  const active = currentKey === sortKey;
  return (
    <th
      className={`py-2 px-3 text-left select-none cursor-pointer group/col ${className}`}
      onClick={() => onClick(sortKey)}
    >
      <span className="flex items-center gap-1 text-neutral-400 group-hover/col:text-white transition-colors">
        {label}
        {active ? (
          dir === 'asc'
            ? <ChevronUp size={13} className="text-emerald-400" />
            : <ChevronDown size={13} className="text-emerald-400" />
        ) : (
          <ChevronsUpDown size={13} className="opacity-30 group-hover/col:opacity-70 transition-opacity" />
        )}
      </span>
    </th>
  );
}

export function TrackList({
  tracks,
  currentTrackId,
  coverShape,
  onTrackSelect,
  onUpdateMeta,
}: TrackListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('index');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      // Para duración: descendente primero (más larga arriba)
      setSortDir(key === 'duration' ? 'desc' : 'asc');
    }
  };

  // Ordenamiento reactivo
  const sorted = useMemo(() => {
    if (sortKey === 'index') {
      const arr = [...tracks];
      return sortDir === 'asc' ? arr : arr.reverse();
    }

    return [...tracks].sort((a, b) => {
      let cmp = 0;

      if (sortKey === 'duration') {
        const da = a.duration || 0;
        const db = b.duration || 0;
        cmp = da - db;
      } else {
        const va = (a[sortKey] ?? '').trim();
        const vb = (b[sortKey] ?? '').trim();
        const aEmpty = isEmpty(va);
        const bEmpty = isEmpty(vb);
        // Vacíos siempre al final
        if (aEmpty && bEmpty) return 0;
        if (aEmpty) return 1;
        if (bEmpty) return -1;
        cmp = va.localeCompare(vb, undefined, { sensitivity: 'base' });
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [tracks, sortKey, sortDir]);

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500">
        <p className="text-lg font-medium">No hay canciones cargadas</p>
        <p className="text-sm">Carga una carpeta de música o agrega archivos para comenzar</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <table className="w-full text-sm">
        <thead className="text-neutral-400 border-b border-neutral-800 sticky top-0 bg-black/80 backdrop-blur-sm z-10">
          <tr>
            <ColHeader label="#"        sortKey="index"    currentKey={sortKey} dir={sortDir} onClick={handleSort} className="w-12" />
            <ColHeader label="Título"   sortKey="title"    currentKey={sortKey} dir={sortDir} onClick={handleSort} />
            <ColHeader label="Artista"  sortKey="artist"   currentKey={sortKey} dir={sortDir} onClick={handleSort} className="hidden sm:table-cell" />
            <ColHeader label="Álbum"    sortKey="album"    currentKey={sortKey} dir={sortDir} onClick={handleSort} className="hidden md:table-cell" />
            <ColHeader label="Duración" sortKey="duration" currentKey={sortKey} dir={sortDir} onClick={handleSort} className="text-right w-24" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((track, idx) => (
            <TrackItem
              key={track.id}
              track={track}
              index={idx}
              isActive={track.id === currentTrackId}
              coverShape={coverShape}
              onPlay={() => onTrackSelect(track)}
              onUpdateMeta={onUpdateMeta}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}