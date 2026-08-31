// src/services/audioEngine.ts
// Motor de Audio puro: funciones de fade usando Web Audio API GainNode automation.
// Diseñado para ser reutilizado por useAudioPlayer.ts sin acoplamiento.

/**
 * Anima un GainNode hacia un valor objetivo en el tiempo dado (en ms).
 */
export function fadeGainTo(
  gainNode: GainNode,
  targetValue: number,
  durationMs: number,
): void {
  const ctx = gainNode.context;
  const now = ctx.currentTime;
  const durationSec = durationMs / 1000;

  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(gainNode.gain.value, now);
  gainNode.gain.linearRampToValueAtTime(targetValue, now + durationSec);
}

/**
 * Fade-out suave: lleva el GainNode a 0 y retorna una promesa que resuelve
 * al completarse la animación.
 */
export function fadeOut(
  gainNode: GainNode,
  durationMs = 300,
): Promise<void> {
  return new Promise((resolve) => {
    fadeGainTo(gainNode, 0, durationMs);
    setTimeout(resolve, durationMs);
  });
}

/**
 * Fade-in suave: lleva el GainNode de 0 al volumen objetivo.
 */
export function fadeIn(
  gainNode: GainNode,
  targetVolume: number,
  durationMs = 200,
): Promise<void> {
  return new Promise((resolve) => {
    const ctx = gainNode.context;
    const now = ctx.currentTime;
    const durationSec = durationMs / 1000;

    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(targetVolume, now + durationSec);
    setTimeout(resolve, durationMs);
  });
}
