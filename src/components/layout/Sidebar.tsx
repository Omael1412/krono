// src/components/Sidebar.tsx
import React from 'react';
import { 
  Library, 
  ListMusic, 
  FolderOpen, 
  Music, 
  Home,
  PlusCircle
} from 'lucide-react';
import { scanFilesFromDirectoryPicker, scanFilesFromInput } from '../../services/fileScanner';
import { Track } from '../../types/player';
import { PlaylistPanel } from '../ui/PlaylistPanel';

interface SidebarProps {
  onTracksAdded: (tracks: Track[]) => void;
  currentTrack?: Track | null;
}

export function Sidebar({ onTracksAdded, currentTrack }: SidebarProps) {
  const handleLoadFolder = async () => {
    try {
      const tracks = await scanFilesFromDirectoryPicker();
      onTracksAdded(tracks);
    } catch (error) {
      console.error('Failed to load folder:', error);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      scanFilesFromInput(files).then(tracks => {
        onTracksAdded(tracks);
      }).catch(console.error);
    }
    e.target.value = ''; // reset
  };

  return (
    <aside className="w-64 bg-neutral-900/90 backdrop-blur-sm border-r border-neutral-800 h-full flex flex-col p-4 text-white">
      <div className="flex items-center gap-2 mb-8">
        <Music className="text-emerald-500" size={28} />
        <span className="text-xl font-bold tracking-tight">Music Player</span>
      </div>

      <nav className="space-y-1 flex-1">
        <SidebarNavItem icon={<Home size={20} />} label="Home" active />
        <SidebarNavItem icon={<Library size={20} />} label="Your Library" />
        <SidebarNavItem icon={<ListMusic size={20} />} label="Playlists" />
      </nav>

      <div className="border-t border-neutral-800 pt-4 mt-4">
        <button
          onClick={handleLoadFolder}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium text-neutral-300 hover:text-white"
        >
          <FolderOpen size={20} />
          Load Music Folder
        </button>
        <div className="mt-2">
          <label className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium text-neutral-300 hover:text-white cursor-pointer">
            <PlusCircle size={20} />
            Add Files
            <input
              type="file"
              accept=".mp3,.wav,.ogg,.flac,.m4a,.aac"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto mt-4">
        <PlaylistPanel currentTrack={currentTrack} />
      </div>
    </aside>
  );
}

function SidebarNavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
      active ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
    }`}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}