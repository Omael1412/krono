// src/components/Visualizer.tsx
import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  getFrequencyData: () => Uint8Array | null;
  isPlaying: boolean;
  color?: string;
}

export function Visualizer({ getFrequencyData, isPlaying, color = '#10b981' }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  // Guardamos el tamaño real en píxeles de dispositivo (no CSS px)
  const sizeRef = useRef({ width: 300, height: 60, dpr: 1 });

  // Mantiene la resolución interna del canvas sincronizada con su tamaño en pantalla
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { clientWidth, clientHeight } = canvas;
      if (clientWidth === 0 || clientHeight === 0) return;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      sizeRef.current = { width: canvas.width, height: canvas.height, dpr };
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { width, height, dpr } = sizeRef.current;
      const barWidth = 4 * dpr;
      const gap = 2 * dpr;
      const numBars = Math.max(1, Math.floor(width / (barWidth + gap)));

      const dataArray = getFrequencyData();
      ctx.clearRect(0, 0, width, height);

      const values = dataArray || new Uint8Array(numBars).map(() => Math.random() * 50 + 30);
      const step = Math.max(1, Math.floor(values.length / numBars));

      for (let i = 0; i < numBars; i++) {
        const value = (values[i * step] || 30) / 255;
        const barHeight = value * height * 0.8;
        const x = i * (barWidth + gap);
        const y = height - barHeight;

        const gradient = ctx.createLinearGradient(0, y, 0, height);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, `${color}44`);

        ctx.fillStyle = gradient;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.shadowBlur = 0;
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();
    if (!isPlaying && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [getFrequencyData, isPlaying, color]);

  // Sin width/height fijos: el tamaño real se controla vía JS + ResizeObserver
  return <canvas ref={canvasRef} className="w-full h-full block" />;
}