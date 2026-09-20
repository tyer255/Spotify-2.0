import React, { useEffect, useState } from 'react';
import { FastAverageColor } from 'fast-average-color';

export const DesktopEnhancer = () => {
  const [facColor, setFacColor] = useState<string>('transparent');

  useEffect(() => {
    // Only apply on tablet and desktop screens (md and above)
    if (typeof window === 'undefined' || window.innerWidth < 768) return;

    let fac: FastAverageColor | null = null;
    try {
      fac = new FastAverageColor();
    } catch (e) {
      console.warn('FastAverageColor initialization failed', e);
    }

    const facColorCache = new Map<string, string>();
    let idleExtractionId: any = null;

    const handleTrackChange = (e: any) => {
      const { url } = e.detail || {};

      if (!url) {
        setFacColor('transparent');
        return;
      }

      if (facColorCache.has(url)) {
        setFacColor(facColorCache.get(url)!);
        return;
      }

      if (!fac) {
        setFacColor('transparent');
        return;
      }

      // Cancel prior idle extraction if user switched tracks quickly
      if (idleExtractionId) {
        if ('cancelIdleCallback' in window) {
          (window as any).cancelIdleCallback(idleExtractionId);
        } else {
          clearTimeout(idleExtractionId);
        }
        idleExtractionId = null;
      }

      // Defer color extraction to idle time with low priority so track transition is 100% smooth
      const scheduleIdle = window.requestIdleCallback || ((cb: any) => setTimeout(cb, 200));
      idleExtractionId = scheduleIdle(async () => {
        idleExtractionId = null;
        try {
          const color = await fac.getColorAsync(url);
          facColorCache.set(url, color.hex);
          setFacColor(color.hex);
        } catch (err) {
          setFacColor('transparent');
        }
      });
    };

    window.addEventListener('spotiz-track-changed', handleTrackChange);
    return () => {
      window.removeEventListener('spotiz-track-changed', handleTrackChange);
      if (idleExtractionId) {
        if ('cancelIdleCallback' in window) {
          (window as any).cancelIdleCallback(idleExtractionId);
        } else {
          clearTimeout(idleExtractionId);
        }
      }
    };
  }, []);

  // Smooth mouse drag-to-scroll for horizontal containers (zero lag)
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let dragged = false;
    let activeSlider: HTMLElement | null = null;

    const onMouseDown = (e: MouseEvent) => {
      const slider = (e.target as HTMLElement).closest('.overflow-x-auto') as HTMLElement;
      if (!slider) return;
      
      isDown = true;
      dragged = false;
      activeSlider = slider;
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
      slider.style.scrollBehavior = 'auto'; 
      slider.style.cursor = 'grabbing';
    };

    const onMouseLeaveOrUp = () => {
      if (!isDown || !activeSlider) return;
      isDown = false;
      activeSlider.style.cursor = '';
      activeSlider.style.scrollBehavior = '';
      activeSlider.style.pointerEvents = '';
      
      if (dragged) {
        const preventClick = (ev: Event) => {
          ev.preventDefault();
          ev.stopPropagation();
          window.removeEventListener('click', preventClick, true);
        };
        window.addEventListener('click', preventClick, true);
        setTimeout(() => window.removeEventListener('click', preventClick, true), 80);
      }
      activeSlider = null;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown || !activeSlider) return;
      const x = e.pageX - activeSlider.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) {
        dragged = true;
        activeSlider.style.pointerEvents = 'none';
      }
      activeSlider.scrollLeft = scrollLeft - walk;
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseleave', onMouseLeaveOrUp);
    document.addEventListener('mouseup', onMouseLeaveOrUp);
    document.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseleave', onMouseLeaveOrUp);
      document.removeEventListener('mouseup', onMouseLeaveOrUp);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <>
      {/* High-Performance Ambient Glow (Hardware Accelerated Pure CSS, 0ms lag, zero CPU burn) */}
      <div 
        className="hidden md:block fixed inset-0 pointer-events-none overflow-hidden transition-all duration-700 ease-out" 
        style={{ 
          background: facColor !== 'transparent' 
            ? `radial-gradient(circle at 85% 25%, ${facColor}18 0%, transparent 55%), radial-gradient(circle at 15% 75%, ${facColor}12 0%, transparent 50%), #121212` 
            : '#121212',
          zIndex: -10,
          transform: 'translateZ(0)'
        }}
      >
        <div className="absolute inset-0 bg-[#0a0a0a]/50 pointer-events-none" />
      </div>
    </>
  );
};
