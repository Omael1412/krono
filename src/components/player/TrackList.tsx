// src/components/TrackList.tsx
import React from 'react';
import { Track } from '../../types/player';
import { TrackItem } from './TrackItem';

interface TrackListProps {
  tracks: Track[];
  currentTrackId?: string | null;
  onTrackSelect: (track: Track) => void;
}

export function TrackList({ tracks, currentTrackId, onTrackSelect }: TrackListProps) {
  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-500">
        <p className="text-lg font-medium">No tracks loaded</p>
        <p className="text-sm">Load a music folder or add files to get started</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <table className="w-full text-sm">
        <thead className="text-neutral-400 border-b border-neutral-800 sticky top-0 bg-black/80 backdrop-blur-sm">
          <tr>
            <th className="text-left py-2 px-3 w-12">#</th>
            <th className="text-left py-2 px-3">Title</th>
            <th className="text-left py-2 px-3 hidden sm:table-cell">Artist</th>
            <th className="text-left py-2 px-3 hidden md:table-cell">Album</th>
            <th className="text-right py-2 px-3 w-20">Duration</th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, index) => (
            <TrackItem
              key={track.id}
              track={track}
              index={index}
              isActive={track.id === currentTrackId}
              onPlay={() => onTrackSelect(track)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}