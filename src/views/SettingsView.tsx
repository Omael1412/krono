// src/views/SettingsView.tsx
import React from 'react';
import { Modal } from '../components/ui/Modal';
import { useAppContext } from '../store/AppContext';
import { CoverShape, ButtonStyle, PlayerLayout } from '../types/player';
import { Palette, Square, LayoutTemplate } from 'lucide-react';

interface SettingsViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsView({ isOpen, onClose }: SettingsViewProps) {
  const { state, updateSettings } = useAppContext();
  const { settings } = state;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configuración Visual" size="md">
      <div className="space-y-6">
        {/* Cover Shape */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-300">
            <Square size={16} /> Forma de Carátula
          </label>
          <div className="flex gap-2">
            {(['square', 'rounded', 'circle'] as CoverShape[]).map((shape) => (
              <button
                key={shape}
                onClick={() => updateSettings({ coverShape: shape })}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm capitalize transition-colors ${
                  settings.coverShape === shape
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-neutral-700 hover:border-neutral-500 text-neutral-400'
                }`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        {/* Button Style */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-300">
            <Palette size={16} /> Estilo de Botones
          </label>
          <div className="flex gap-2">
            {(['minimal', 'neon', 'solid'] as ButtonStyle[]).map((style) => (
              <button
                key={style}
                onClick={() => updateSettings({ buttonStyle: style })}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm capitalize transition-colors ${
                  settings.buttonStyle === style
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-neutral-700 hover:border-neutral-500 text-neutral-400'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Player Layout */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-300">
            <LayoutTemplate size={16} /> Diseño del Reproductor
          </label>
          <div className="flex gap-2">
            {(['bar', 'fullscreen'] as PlayerLayout[]).map((layout) => (
              <button
                key={layout}
                onClick={() => updateSettings({ playerLayout: layout })}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm capitalize transition-colors ${
                  settings.playerLayout === layout
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-neutral-700 hover:border-neutral-500 text-neutral-400'
                }`}
              >
                {layout}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
