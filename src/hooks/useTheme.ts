// src/hooks/useTheme.ts
// Extrae la paleta de colores de la carátula actual y la sincroniza con AppContext.
import { useEffect } from 'react';
import { Track } from '../types/player';
import { extractPalette } from '../services/colorExtractor';
import { useAppContext } from '../store/AppContext';

export function useTheme(currentTrack: Track | null) {
  const { setDominantColor, state } = useAppContext();

  useEffect(() => {
    if (!currentTrack?.coverUrl) {
      setDominantColor('#10b981');
      return;
    }

    let cancelled = false;
    extractPalette(currentTrack.coverUrl)
      .then((palette) => {
        if (cancelled) return;
        const [r, g, b] = palette.dominant;
        setDominantColor(`rgb(${r}, ${g}, ${b})`);
      })
      .catch(() => {
        if (!cancelled) setDominantColor('#10b981');
      });

    return () => {
      cancelled = true;
    };
  }, [currentTrack, setDominantColor]);

  return {
    dominantColor: state.dominantColor,
    settings: state.settings,
  };
}
