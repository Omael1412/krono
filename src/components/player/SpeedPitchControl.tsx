// src/components/player/SpeedPitchControl.tsx
import React, { useState, useRef, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cierra el panel si el usuario hace click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      {/* Botón trigger: solo el ícono */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        title="Cambiar velocidad"
        className={`flex items-center gap-1 transition-colors ${
          playbackRate !== 1
            ? 'text-[var(--theme-color)]'
            : 'text-neutral-500 hover:text-neutral-300'
        }`}
        style={{ '--theme-color': dominantColor } as React.CSSProperties}
      >
        <Gauge size={16} />
        {playbackRate !== 1 && (
          <span className="text-xs font-mono leading-none" style={{ color: dominantColor }}>
            {playbackRate.toFixed(playbackRate % 1 === 0 ? 0 : 2)}×
          </span>
        )}
      </button>

      {/* Panel desplegable */}
      {isOpen && (
        <div
          className="absolute bottom-full mb-3 right-0 bg-neutral-900 border border-neutral-700/60 rounded-xl shadow-2xl p-4 w-56 z-50 backdrop-blur-md"
          style={{ '--theme-color': dominantColor } as React.CSSProperties}
        >
          <div className="text-xs text-neutral-400 font-medium mb-3 flex items-center justify-between">
            <span>Velocidad de reproducción</span>
            <span className="font-mono text-[var(--theme-color)]">
              {playbackRate.toFixed(playbackRate % 1 === 0 ? 0 : 2)}×
            </span>
          </div>

          {/* Presets */}
          <div className="flex items-center gap-1 mb-3 flex-wrap">
            {SPEED_PRESETS.map((rate) => (
              <button
                key={rate}
                onClick={() => onSpeedChange(rate)}
                className={`text-xs px-2 py-1 rounded-lg transition-all border ${
                  Math.abs(playbackRate - rate) < 0.01
                    ? 'border-[var(--theme-color)] text-[var(--theme-color)] font-semibold bg-[var(--theme-color)]/10'
                    : 'border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500'
                }`}
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
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
            style={{
              accentColor: dominantColor,
              background: `linear-gradient(to right, ${dominantColor} 0%, ${dominantColor} ${
                ((playbackRate - 0.25) / (2 - 0.25)) * 100
              }%, #404040 ${
                ((playbackRate - 0.25) / (2 - 0.25)) * 100
              }%, #404040 100%)`,
            }}
          />

          <button
            onClick={() => onSpeedChange(1)}
            className="mt-3 text-xs text-neutral-500 hover:text-neutral-300 transition-colors w-full text-center"
          >
            Restablecer (1×)
          </button>
        </div>
      )}
    </div>
  );
}
