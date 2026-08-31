// src/components/PlayerControls.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Visualizer } from './Visualizer';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Repeat, 
  Volume2, 
  VolumeX,
  Heart,
  ListMusic,
  Pencil
} from 'lucide-react';
import { Track, CoverShape, PlayerLayout, ButtonStyle } from '../../types/player';
import { SpeedPitchControl } from './SpeedPitchControl';

interface PlayerControlsProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  getFrequencyData?: () => Uint8Array | null;
  dominantColor?: string;
  onUpdateCover: (trackId: string, coverUrl: string | undefined) => void;
  playbackRate: number;
  onSpeedChange: (rate: number) => void;
  coverShape: CoverShape;
  playerLayout: PlayerLayout;
  buttonStyle: ButtonStyle;
}

export function PlayerControls({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  getFrequencyData,
  dominantColor,
  onUpdateCover,
  playbackRate,
  onSpeedChange,
  coverShape,
  playerLayout,
  buttonStyle,
}: PlayerControlsProps) {
  const progressRef = useRef<HTMLInputElement>(null);
  const volumeRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringCover, setIsHoveringCover] = useState(false);

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onVolumeChange(val);
  };

  const repeatIcon = () => {
    if (repeatMode === 'off') return <Repeat size={18} />;
    if (repeatMode === 'all') return <Repeat size={18} className="text-[var(--theme-color)]" />;
    return <Repeat size={18} className="text-[var(--theme-color)]" />; // one
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentTrack) {
      const url = URL.createObjectURL(file);
      onUpdateCover(currentTrack.id, url);
    }
    e.target.value = '';
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const shapeClasses = {
    square: 'rounded-none',
    rounded: 'rounded-xl',
    circle: 'rounded-full',
  };

  const layoutClasses = playerLayout === 'fullscreen' 
    ? 'fixed inset-0 z-50 flex flex-col justify-center items-center p-8 bg-neutral-900 transition-all duration-500'
    : 'fixed bottom-0 left-0 right-0 h-24 z-50 transition-all duration-500 bg-neutral-900/95 backdrop-blur-md border-t';

  return (
    <div 
      className={layoutClasses}
      style={{ 
        borderTopColor: playerLayout === 'bar' ? (dominantColor || '#262626') : 'transparent',
        '--theme-color': dominantColor || '#10b981' 
      } as React.CSSProperties}
    >
      <div className={`mx-auto flex ${playerLayout === 'fullscreen' ? 'flex-col max-w-lg w-full gap-8' : 'items-center gap-4 px-4 h-full max-w-screen-2xl'}`}>
        {/* Track info */}
        <div className={`flex ${playerLayout === 'fullscreen' ? 'flex-col w-full text-center items-center' : 'items-center gap-3 w-64 min-w-0 flex-shrink-0'}`}>
          <div 
            className={`relative flex-shrink-0 group ${playerLayout === 'fullscreen' ? 'w-64 h-64 mb-4' : 'w-14 h-14'}`}
            onMouseEnter={() => setIsHoveringCover(true)}
            onMouseLeave={() => setIsHoveringCover(false)}
          >
            {currentTrack?.coverUrl ? (
              <img src={currentTrack.coverUrl} alt="" className={`w-full h-full object-cover shadow-2xl ${shapeClasses[coverShape]}`} />
            ) : (
              <div className={`w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-600 ${shapeClasses[coverShape]}`}>
                <span className="text-xl">🎵</span>
              </div>
            )}
            {/* Overlay con botón de edición */}
            {currentTrack && (
              <div 
                className={`absolute inset-0 bg-black/60 rounded flex items-center justify-center transition-opacity duration-200 ${
                  isHoveringCover ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <button 
                  onClick={openFilePicker}
                  className="text-white p-1.5 rounded-full bg-neutral-700/80 hover:bg-neutral-600 transition-colors"
                  title="Cambiar carátula"
                >
                  <Pencil size={16} />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverFileChange}
              className="hidden"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate">{currentTrack?.title || 'No track'}</div>
            <div className="text-xs text-neutral-400 truncate">{currentTrack?.artist || 'Unknown'}</div>
          </div>
          <button className="text-neutral-400 hover:text-[var(--theme-color)] transition-colors ml-auto hidden sm:block">
            <Heart size={18} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={onToggleShuffle} 
              className={`text-neutral-400 hover:text-white transition-colors ${isShuffle ? 'text-[var(--theme-color)]' : ''}`}
              aria-label="Shuffle"
            >
              <Shuffle size={18} />
            </button>
            <button onClick={onPrev} className="text-neutral-400 hover:text-white transition-colors" aria-label="Previous">
              <SkipBack size={20} />
            </button>
            <button 
              onClick={onTogglePlay} 
              className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={onNext} className="text-neutral-400 hover:text-white transition-colors" aria-label="Next">
              <SkipForward size={20} />
            </button>
            <button 
              onClick={onToggleRepeat} 
              className={`text-neutral-400 hover:text-white transition-colors ${repeatMode !== 'off' ? 'text-[var(--theme-color)]' : ''}`}
              aria-label="Repeat"
            >
              {repeatIcon()}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full max-w-lg relative">
            <span className="text-xs text-neutral-400 tabular-nums w-10 text-right">{formatTime(currentTime)}</span>
            <div className="relative w-full h-8 flex items-center">
              <input
                ref={progressRef}
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleProgressChange}
                className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[var(--theme-color)] z-10 relative"
                step="0.1"
              />
              <div className="absolute inset-0 pointer-events-none opacity-40">
                {getFrequencyData && (
                  <Visualizer getFrequencyData={getFrequencyData} isPlaying={isPlaying} color={dominantColor || "#10b981"} />
                )}
              </div>
            </div>
            <span className="text-xs text-neutral-400 tabular-nums w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Speed */}
        <div className={`flex items-center justify-end gap-6 flex-shrink-0 ${playerLayout === 'fullscreen' ? 'w-full mt-4' : 'w-72'}`}>
          <SpeedPitchControl 
            playbackRate={playbackRate} 
            onSpeedChange={onSpeedChange} 
            dominantColor={dominantColor} 
          />
          <div className="flex items-center gap-2">
            <button onClick={onToggleMute} className="text-neutral-400 hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              ref={volumeRef}
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[var(--theme-color)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}