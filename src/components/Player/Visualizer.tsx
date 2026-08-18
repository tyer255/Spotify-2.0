import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext';

interface VisualizerProps {
  height?: number;
  color?: string;
  className?: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  height = 40,
  color = '#1DB954',
  className = '',
}) => {
  const { isPlaying } = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Use refs for animation state to guarantee absolutely zero-lag, 
  // perfectly smooth 60fps rendering without relying on React state updates.
  const timeRef = useRef(0);
  const lastNowRef = useRef(performance.now());
  const currentHeightsRef = useRef<Float32Array>(new Float32Array(32).fill(0.05));

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    const BAR_COUNT = 32; // Clean, standard EQ look

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(100, rect.width);
      
      canvas.width = w * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${height}px`;
      
      ctx.scale(dpr, dpr);
    };

    resize();
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', resize);
    }

    const render = (now: number) => {
      const dt = Math.min((now - lastNowRef.current) / 1000, 0.1);
      lastNowRef.current = now;

      if (isPlaying) {
         // Advance time smoothly. Using an accumulator completely solves "lagging"
         // or "jumping" because it is perfectly continuous, unlike track position state.
         timeRef.current += dt * 1.5; 
      }

      const t = timeRef.current;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = height;

      ctx.clearRect(0, 0, w, h);

      const barWidth = Math.max(2, (w / BAR_COUNT) * 0.65);
      const gap = (w - (barWidth * BAR_COUNT)) / (BAR_COUNT - 1);

      // Simple, beautiful gradient for the bars
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#6EE7B7');
      grad.addColorStop(0.4, color);
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;

      for (let i = 0; i < BAR_COUNT; i++) {
         let target = 0.05;
         
         if (isPlaying) {
            const x = i / BAR_COUNT;
            
            // Generate extremely smooth, organic, fluid waves
            // This guarantees it is never "too fast" or erratic.
            const wave1 = Math.sin(t * 1.5 + x * 4.0);
            const wave2 = Math.sin(t * 2.3 - x * 3.5);
            const wave3 = Math.sin(t * 0.8 + x * 1.5);
            
            // A gentle, rhythmic swell to simulate musical phrasing
            const swell = Math.pow(Math.sin(t * 2.0), 4);
            
            let val = (wave1 + wave2 + wave3) / 3; 
            val = (val + 1) / 2; // Normalize to 0-1

            // Windowing to make the center naturally taller than the edges
            const windowEq = Math.sin(x * Math.PI);

            target = Math.min(0.95, Math.max(0.05, (val * 0.6 + swell * 0.4) * windowEq));
         }

         // Very smooth spring interpolation
         const current = currentHeightsRef.current[i];
         
         // Attack is moderately responsive, decay is very smooth and floaty
         const lerpSpeed = target > current ? 12.0 : 6.0;
         const next = current + (target - current) * Math.min(1.0, dt * lerpSpeed);
         currentHeightsRef.current[i] = next;

         const barHeight = Math.max(2, next * h);
         const posX = i * (barWidth + gap);
         const posY = h - barHeight;

         // Draw cleanly rounded bars
         ctx.beginPath();
         if (ctx.roundRect) {
           ctx.roundRect(posX, posY, barWidth, barHeight, barWidth / 2);
         } else {
           ctx.rect(posX, posY, barWidth, barHeight);
         }
         ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', resize);
      
      cancelAnimationFrame(animationFrameId);
    };
  }, [height, color, isPlaying]);

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <canvas ref={canvasRef} className="block w-full drop-shadow-md" />
    </div>
  );
};
