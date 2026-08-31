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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = 4;
    const gap = 2;
    const numBars = Math.floor(width / (barWidth + gap));

    const draw = () => {
      const dataArray = getFrequencyData();
      ctx.clearRect(0, 0, width, height);

      // Si no hay datos, dibujar barras de reposo (aleatorias bajas)
      const values = dataArray || new Uint8Array(numBars).map(() => Math.random() * 50 + 30);

      const step = Math.floor(values.length / numBars);
      for (let i = 0; i < numBars; i++) {
        const value = (values[i * step] || 30) / 255;
        const barHeight = value * height * 0.8;
        const x = i * (barWidth + gap);
        const y = height - barHeight;

        // Degradado vertical
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

    if (isPlaying) {
      draw();
    } else {
      // Dibujar frame de reposo cuando está pausado
      draw();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [getFrequencyData, isPlaying, color]);

  return <canvas ref={canvasRef} className="w-full h-full" width={300} height={60} />;
}