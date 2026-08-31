// src/components/player/PlayerControls.tsx
import React, { useRef, useState, useCallback } from 'react';
import { Visualizer } from './Visualizer';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  Pencil,
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
  favoriteIds: Set<string>;
  onToggleFavorite: (trackId: string) => void;
}

const BUTTON_STYLE_CLASSES: Record<ButtonStyle, { primary: string; secondary: string; secondaryActive: string }> = {
  minimal: {
    primary: 'bg-white text-black hover:scale-105',
    secondary: 'text-neutral-400 hover:text-white',
    secondaryActive: 'text-[var(--theme-color)]',
  },
  neon: {
    primary: 'bg-black border-2 hover:scale-105 shadow-[0_0_15px_var(--theme-color)] hover:shadow-[0_0_25px_var(--theme-color)]',
    secondary: 'text-neutral-400 hover:text-[var(--theme-color)] hover:drop-shadow-[0_0_6px_var(--theme-color)]',
    secondaryActive: 'text-[var(--theme-color)] drop-shadow-[0_0_6px_var(--theme-color)]',
  },
  solid: {
    primary: 'text-white hover:brightness-110',
    secondary: 'text-neutral-300 hover:text-white',
    secondaryActive: 'text-[var(--theme-color)]',
  },
};

// ── Volumen extra (boost): 1.0 → 5.0 mapeado a ganancia web audio ────────────
// El componente lo controla internamente y llama onVolumeChange con valores > 1
// Solo cuando el volumen base llega a 1.0

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
  favoriteIds,
  onToggleFavorite,
}: PlayerControlsProps) {
  const progressRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHoveringCover, setIsHoveringCover] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  // Boost activo (muestra slider extra cuando volumen base = 1)
  const [boostVolume, setBoostVolume] = useState(1); // 1 = sin boost, hasta 5

  const styles = BUTTON_STYLE_CLASSES[buttonStyle];
  const themeColor = dominantColor || '#10b981';
  const isFavorite = currentTrack ? favoriteIds.has(currentTrack.id) : false;

  // ── Favorito con animación burst ────────────────────────────────────────────
  const handleHeartClick = useCallback(() => {
    if (!currentTrack) return;
    onToggleFavorite(currentTrack.id);
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 600);
  }, [currentTrack, onToggleFavorite]);

  // ── Helpers de formato ───────────────────────────────────────────────────────
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── Repeat icon ─────────────────────────────────────────────────────────────
  const repeatIcon = () => {
    if (repeatMode === 'off') return <Repeat size={18} />;
    if (repeatMode === 'one') return <Repeat1 size={18} className={styles.secondaryActive} />;
    return <Repeat size={18} className={styles.secondaryActive} />;
  };

  // ── Cover file picker ────────────────────────────────────────────────────────
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentTrack) {
      const url = URL.createObjectURL(file);
      onUpdateCover(currentTrack.id, url);
    }
    e.target.value = '';
  };
  const openFilePicker = () => fileInputRef.current?.click();

  // ── Shapes & layout ──────────────────────────────────────────────────────────
  const shapeClasses = { square: 'rounded-none', rounded: 'rounded-xl', circle: 'rounded-full' };
  const layoutClasses = playerLayout === 'fullscreen'
    ? 'fixed inset-0 z-50 flex flex-col justify-center items-center p-8 bg-neutral-900 transition-all duration-500'
    : 'fixed bottom-0 left-0 right-0 h-24 z-50 transition-all duration-500 bg-neutral-900/95 backdrop-blur-md border-t';

  // ── Barra de progreso con fill de color ──────────────────────────────────────
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressStyle: React.CSSProperties = {
    background: `linear-gradient(to right, ${themeColor} 0%, ${themeColor} ${progressPct}%, #404040 ${progressPct}%, #404040 100%)`,
    accentColor: themeColor,
  };

  // ── Barra de volumen con fill de color ───────────────────────────────────────
  const displayVolume = isMuted ? 0 : Math.min(volume, 1);
  const volumePct = displayVolume * 100;
  const volumeStyle: React.CSSProperties = {
    background: `linear-gradient(to right, ${themeColor} 0%, ${themeColor} ${volumePct}%, #404040 ${volumePct}%, #404040 100%)`,
    accentColor: themeColor,
  };

  // ── Boost slider (solo visible cuando volumen base = 1 y no muted) ───────────
  const showBoost = !isMuted && volume >= 1;
  const boostPct = ((boostVolume - 1) / 4) * 100; // 1→5 mapeado a 0→100%
  const boostStyle: React.CSSProperties = {
    background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${boostPct}%, #404040 ${boostPct}%, #404040 100%)`,
    accentColor: '#f59e0b',
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onVolumeChange(val);
    if (val < 1) setBoostVolume(1); // resetea boost si baja del 100%
  };

  const handleBoostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setBoostVolume(val);
    onVolumeChange(val); // pasa el boost al hook (debe soportar > 1 mediante GainNode)
  };

  return (
    <div
      className={layoutClasses}
      style={{
        borderTopColor: playerLayout === 'bar' ? (themeColor) : 'transparent',
        '--theme-color': themeColor,
      } as React.CSSProperties}
    >
      <div className={`mx-auto flex ${playerLayout === 'fullscreen' ? 'flex-col max-w-lg w-full gap-8' : 'items-center gap-4 px-4 h-full max-w-screen-2xl'}`}>

        {/* ── Track info ──────────────────────────────────────────────────── */}
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
            {currentTrack && (
              <div
                className={`absolute inset-0 bg-black/60 rounded flex items-center justify-center transition-opacity duration-200 ${isHoveringCover ? 'opacity-100' : 'opacity-0'}`}
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
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverFileChange} className="hidden" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate">{currentTrack?.title || 'No track'}</div>
            <div className="text-xs text-neutral-400 truncate">{currentTrack?.artist || 'Unknown'}</div>
          </div>

          {/* ── Botón Corazón con animación ──────────────────────────────── */}
          <button
            onClick={handleHeartClick}
            disabled={!currentTrack}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            className={`ml-auto hidden sm:flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 relative select-none
              ${currentTrack ? 'cursor-pointer' : 'opacity-30 cursor-default'}
              ${heartBurst ? 'scale-125' : 'scale-100'}
            `}
          >
            {/* Partículas burst */}
            {heartBurst && (
              <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <span
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-red-400 animate-ping"
                    style={{
                      transform: `rotate(${i * 60}deg) translateX(12px)`,
                      animationDuration: '0.5s',
                      animationIterationCount: '1',
                      opacity: 0.8,
                    }}
                  />
                ))}
              </span>
            )}
            <Heart
              size={18}
              className={`transition-all duration-300 ${
                isFavorite
                  ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]'
                  : 'text-neutral-400 hover:text-red-400'
              }`}
            />
          </button>
        </div>

        {/* ── Controls ────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleShuffle}
              className={`transition-colors ${isShuffle ? styles.secondaryActive : styles.secondary}`}
              aria-label="Shuffle"
            >
              <Shuffle size={18} />
            </button>
            <button onClick={onPrev} className={`transition-colors ${styles.secondary}`} aria-label="Previous">
              <SkipBack size={20} />
            </button>
            <button
              onClick={onTogglePlay}
              className={`rounded-full p-2 transition-all ${styles.primary}`}
              style={
                buttonStyle === 'solid'
                  ? { backgroundColor: themeColor }
                  : buttonStyle === 'neon'
                    ? { borderColor: themeColor }
                    : undefined
              }
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={onNext} className={`transition-colors ${styles.secondary}`} aria-label="Next">
              <SkipForward size={20} />
            </button>
            <button
              onClick={onToggleRepeat}
              className={`transition-colors ${repeatMode !== 'off' ? styles.secondaryActive : styles.secondary}`}
              aria-label="Repeat"
            >
              {repeatIcon()}
            </button>
          </div>

          {/* ── Barra de progreso con fill de color ───────────────────────── */}
          <div className="flex items-center gap-3 w-full max-w-lg relative">
            <span className="text-xs text-neutral-400 tabular-nums w-10 text-right">{formatTime(currentTime)}</span>
            <div className="relative w-full h-8 flex items-center">
              <input
                ref={progressRef}
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer z-10 relative"
                style={progressStyle}
                step="0.1"
              />
              <div className="absolute inset-0 pointer-events-none opacity-40">
                {getFrequencyData && (
                  <Visualizer getFrequencyData={getFrequencyData} isPlaying={isPlaying} color={themeColor} />
                )}
              </div>
            </div>
            <span className="text-xs text-neutral-400 tabular-nums w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* ── Volume & Speed ───────────────────────────────────────────────── */}
        <div className={`flex items-center justify-end gap-4 flex-shrink-0 ${playerLayout === 'fullscreen' ? 'w-full mt-4' : 'w-72'}`}>
          <SpeedPitchControl
            playbackRate={playbackRate}
            onSpeedChange={onSpeedChange}
            dominantColor={themeColor}
          />

          {/* ── Volumen ───────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <button onClick={onToggleMute} className={`transition-colors ${styles.secondary}`} title={isMuted ? 'Activar sonido' : 'Silenciar'}>
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            <div className="flex flex-col items-end gap-0.5">
              {/* Volumen base 0–100% */}
              <div className="flex items-center gap-1.5">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={displayVolume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1.5 rounded-lg appearance-none cursor-pointer"
                  style={volumeStyle}
                  title={`Volumen: ${Math.round(displayVolume * 100)}%`}
                />
                <span className="text-xs text-neutral-500 tabular-nums w-9 text-right">
                  {Math.round(displayVolume * 100)}%
                </span>
              </div>

              {/* Boost extra: aparece solo cuando el volumen base llega al 100% */}
              {showBoost && (
                <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <span className="text-xs text-amber-400 font-semibold whitespace-nowrap">⚡ Boost</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={boostVolume}
                    onChange={handleBoostChange}
                    className="w-20 h-1.5 rounded-lg appearance-none cursor-pointer"
                    style={boostStyle}
                    title={`Boost de volumen: ${boostVolume.toFixed(1)}×`}
                  />
                  <span className="text-xs text-amber-400 tabular-nums w-9 text-right font-mono">
                    {boostVolume.toFixed(1)}×
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}