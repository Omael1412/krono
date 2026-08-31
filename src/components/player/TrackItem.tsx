// src/components/TrackItem.tsx
import React from 'react';
import { Track } from '../../types/player';
import { Play, Pause } from 'lucide-react';

interface TrackItemProps {
  track: Track;
  index: number;
  isActive: boolean;
  onPlay: () => void;
}

export function TrackItem({ track, index, isActive, onPlay }: TrackItemProps) {
  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <tr 
      className={`group border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors cursor-pointer ${
        isActive ? 'bg-emerald-500/10' : ''
      }`}
      onClick={onPlay}
    >
      <td className="py-2 px-3 w-12">
        <div className="flex items-center justify-center">
          {isActive ? (
            <span className="text-emerald-500">
              <Play size={16} fill="currentColor" />
            </span>
          ) : (
            <span className="text-neutral-500 group-hover:text-white transition-colors">
              {index + 1}
            </span>
          )}
        </div>
      </td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-3">
          {track.coverUrl ? (
            <img src={track.coverUrl} alt="" className="w-10 h-10 rounded object-cover" />
          ) : (
            <div className="w-10 h-10 rounded bg-neutral-800 flex items-center justify-center text-neutral-600">
              <span className="text-xs">🎵</span>
            </div>
          )}
          <span className={`font-medium ${isActive ? 'text-emerald-400' : 'text-white'}`}>
            {track.title}
          </span>
        </div>
      </td>
      <td className="py-2 px-3 hidden sm:table-cell text-neutral-400">{track.artist}</td>
      <td className="py-2 px-3 hidden md:table-cell text-neutral-400">{track.album}</td>
      <td className="py-2 px-3 text-right text-neutral-400 tabular-nums">
        {formatDuration(track.duration)}
      </td>
    </tr>
  );
}