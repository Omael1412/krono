// src/components/player/SpeedPitchControl.tsx
import React from 'react';
import { Gauge } from 'lucide-react';

interface SpeedPitchControlProps {
  playbackRate: number;
  onSpeedChange: (rate: number) => void;
  dominantColor?: string;
}

const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function SpeedPitchControl({
  playbackRate,
  onSpeedChange,
  dominantColor = '#10b981',
}: SpeedPitchControlProps) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <Gauge size={14} className="text-neutral-500" />

      {/* Presets rápidos */}
      <div className="hidden lg:flex items-center gap-0.5">
        {SPEED_PRESETS.map((rate) => (
          <button
            key={rate}
            onClick={() => onSpeedChange(rate)}
            className={`text-xs px-1.5 py-0.5 rounded transition-all ${
              Math.abs(playbackRate - rate) < 0.01
                ? 'text-white font-semibold'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
            style={
              Math.abs(playbackRate - rate) < 0.01
                ? { color: dominantColor }
                : undefined
            }
            title={`Velocidad ${rate}x`}
          >
            {rate === 1 ? '1×' : `${rate}×`}
          </button>
        ))}
      </div>

      {/* Slider fino */}
      <input
        type="range"
        min="0.25"
        max="2"
        step="0.05"
        value={playbackRate}
        onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
        className="w-16 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: dominantColor }}
        title={`${playbackRate.toFixed(2)}×`}
      />

      {/* Indicador */}
      <span
        className="text-xs font-mono w-8 text-right"
        style={{ color: dominantColor }}
      >
        {playbackRate.toFixed(playbackRate === 1 ? 0 : 2)}×
      </span>
    </div>
  );
}
