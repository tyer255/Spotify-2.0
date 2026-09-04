import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayer } from '../../context/PlayerContext';
import { CanvasService } from '../../services/CanvasService';
import { DynamicAmbientBackground } from './DynamicAmbientBackground';
import {
  Volume2,
  Volume1,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Sparkle,
  Sun,
  Moon,
  Video,
  Image as ImageIcon,
  Mic2,
  HelpCircle,
} from 'lucide-react';
import { ViewState } from '../../types';

interface AmbientModeProps {
  onNavigate?: (view: ViewState) => void;
}

export const AmbientMode: React.FC<AmbientModeProps> = () => {
  const {
    track,
    isPlaying,
    position,
    duration,
    volume,
    togglePlay,
    seek,
    nextTrack,
    previousTrack,
    setVolume,
    lyricsData,
    activeLyricIndex,
    isAmbientModeOpen,
    setIsAmbientModeOpen,
    fetchLyrics,
  } = usePlayer();

  // Gesture feedback HUD states
  const [hudMessage, setHudMessage] = useState<{ icon: React.ReactNode; text: string; sub?: string } | null>(null);
  const [doubleTapRipple, setDoubleTapRipple] = useState<{ x: number; y: number; id: number } | null>(null);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showGestureGuide, setShowGestureGuide] = useState<boolean>(false);
  const [isDimmed, setIsDimmed] = useState<boolean>(false);
  const [showCanvasVideo, setShowCanvasVideo] = useState<boolean>(true);
  const [canvasUrl, setCanvasUrl] = useState<string | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  // Pixel shift offset for AMOLED burn-in protection (subtle shift every 30s)
  const [pixelShift, setPixelShift] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const hudTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // Digital clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // AMOLED Pixel-shift burn-in protection
  useEffect(() => {
    if (!isAmbientModeOpen) return;
    const shiftInterval = setInterval(() => {
      const offsetX = (Math.random() - 0.5) * 6; // +/- 3px
      const offsetY = (Math.random() - 0.5) * 6;
      setPixelShift({ x: Math.round(offsetX), y: Math.round(offsetY) });
    }, 35000);
    return () => clearInterval(shiftInterval);
  }, [isAmbientModeOpen]);

  // Canvas URL fetch for Ambient Mode
  useEffect(() => {
    if (!track?.id || !isAmbientModeOpen) {
      setCanvasUrl(null);
      return;
    }
    let isMounted = true;
    CanvasService.getCanvasForTrack(track)
      .then((res) => {
        if (isMounted && res?.verified && res?.canvasUrl) {
          setCanvasUrl(res.canvasUrl);
        } else if (isMounted) {
          setCanvasUrl(null);
        }
      })
      .catch(() => {
        if (isMounted) setCanvasUrl(null);
      });
    return () => {
      isMounted = false;
    };
  }, [track?.id, isAmbientModeOpen]);

  // Ensure lyrics are loaded
  useEffect(() => {
    if (isAmbientModeOpen && track?.id && !lyricsData) {
      fetchLyrics(track.id);
    }
  }, [isAmbientModeOpen, track?.id, lyricsData, fetchLyrics]);

  // Auto-scroll synced lyrics
  useEffect(() => {
    if (activeLyricIndex >= 0 && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.querySelector(`[data-lyric-index="${activeLyricIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [activeLyricIndex]);

  // Auto-hide controls after inactivity
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      setShowGestureGuide(false);
    }, 4500);
  };

  const triggerHud = (icon: React.ReactNode, text: string, sub?: string) => {
    setHudMessage({ icon, text, sub });
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      setHudMessage(null);
    }, 1400);
  };

  // Keyboard navigation for Ambient Mode
  useEffect(() => {
    if (!isAmbientModeOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      resetControlsTimer();
      if (e.key === 'Escape') {
        setIsAmbientModeOpen(false);
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
        triggerHud(
          isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />,
          isPlaying ? 'Paused' : 'Playing'
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const newVol = Math.min(1, volume + 0.08);
        setVolume(newVol);
        triggerHud(<Volume2 className="w-8 h-8 text-emerald-400" />, `${Math.round(newVol * 100)}%`, 'Volume Up');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const newVol = Math.max(0, volume - 0.08);
        setVolume(newVol);
        triggerHud(
          newVol === 0 ? <VolumeX className="w-8 h-8 text-red-400" /> : <Volume1 className="w-8 h-8 text-emerald-400" />,
          `${Math.round(newVol * 100)}%`,
          'Volume Down'
        );
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextTrack();
        triggerHud(<SkipForward className="w-8 h-8 text-white" />, 'Next Track');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        previousTrack();
        triggerHud(<SkipBack className="w-8 h-8 text-white" />, 'Previous Track');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAmbientModeOpen, isPlaying, volume]);

  // Touch gesture handlers (Swipe Up/Down, Left/Right, Double Tap)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const minSwipeDist = 45;

    // Detect Swipes
    if (dt < 650 && (absX > minSwipeDist || absY > minSwipeDist)) {
      if (absY > absX * 1.2) {
        // Vertical Swipe: Volume Control
        if (dy < -minSwipeDist) {
          // Swipe Up -> Volume Up
          const newVol = Math.min(1, volume + 0.1);
          setVolume(newVol);
          triggerHud(<Volume2 className="w-8 h-8 text-emerald-400" />, `${Math.round(newVol * 100)}%`, 'Volume Up');
        } else if (dy > minSwipeDist) {
          // Swipe Down -> Volume Down
          const newVol = Math.max(0, volume - 0.1);
          setVolume(newVol);
          triggerHud(
            newVol === 0 ? <VolumeX className="w-8 h-8 text-red-400" /> : <Volume1 className="w-8 h-8 text-emerald-400" />,
            `${Math.round(newVol * 100)}%`,
            'Volume Down'
          );
        }
      } else if (absX > absY * 1.2) {
        // Horizontal Swipe: Track Navigation
        if (dx < -minSwipeDist) {
          // Swipe Left -> Next Track
          nextTrack();
          triggerHud(<SkipForward className="w-8 h-8 text-white" />, 'Next Track');
        } else if (dx > minSwipeDist) {
          // Swipe Right -> Previous Track
          previousTrack();
          triggerHud(<SkipBack className="w-8 h-8 text-white" />, 'Previous Track');
        }
      }
      return;
    }

    // Detect Double Tap vs Single Tap (Tap with minimal movement)
    if (absX < 15 && absY < 15) {
      const now = Date.now();
      if (now - lastTapRef.current < 320) {
        // Double Tap -> Play / Pause
        lastTapRef.current = 0;
        togglePlay();
        setDoubleTapRipple({ x: touch.clientX, y: touch.clientY, id: now });
        triggerHud(
          isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />,
          isPlaying ? 'Paused' : 'Playing'
        );
        setTimeout(() => setDoubleTapRipple(null), 700);
      } else {
        lastTapRef.current = now;
        // Single tap -> Toggle HUD Controls
        resetControlsTimer();
      }
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isAmbientModeOpen || !track) return null;

  const artworkUrl =
    track.images?.large ||
    track.images?.medium ||
    track.images?.small ||
    (track as any).artworkUrl ||
    (track as any).coverUrl ||
    (track as any).image ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80';
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        id="ambient-mode-overlay"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => resetControlsTimer()}
        className={`fixed inset-0 z-[100] text-white select-none overflow-hidden flex flex-col justify-between cursor-default ${
          isDimmed ? 'opacity-40' : 'opacity-100'
        } transition-opacity duration-500`}
        style={{
          transform: `translate(${pixelShift.x}px, ${pixelShift.y}px)`,
        }}
      >
        {/* DYNAMIC REACTIVE AMBIENT BACKGROUND */}
        <DynamicAmbientBackground artworkUrl={artworkUrl} isDimmed={isDimmed} />

        {/* Top Status & Always-On Display Header */}
        <header className="relative z-20 flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md select-none">
              <Sparkle className="w-3.5 h-3.5 text-white/60" strokeWidth={1.5} />
              <span className="text-[11px] font-medium tracking-wider uppercase text-white/70">Ambient Mode</span>
            </div>
            {currentTimeStr && (
              <span className="text-xs font-mono tracking-widest text-white/40">{currentTimeStr}</span>
            )}
          </div>

          {/* Quick Action Controls (Auto-fades out during idle) */}
          <div
            className={`flex items-center gap-2 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {canvasUrl && (
              <button
                id="ambient-toggle-canvas-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCanvasVideo(!showCanvasVideo);
                }}
                className={`p-2.5 rounded-full transition-all ${
                  showCanvasVideo ? 'bg-white/20 text-white border border-white/25' : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                title={showCanvasVideo ? 'Switch to Artwork' : 'Switch to Canvas Video'}
              >
                {showCanvasVideo ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
              </button>
            )}

            <button
              id="ambient-toggle-dim-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsDimmed(!isDimmed);
              }}
              className="p-2.5 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
              title={isDimmed ? 'Normal Brightness' : 'OLED Dim Mode'}
            >
              {isDimmed ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              id="ambient-help-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowGestureGuide(!showGestureGuide);
              }}
              className={`p-2.5 rounded-full transition-all ${
                showGestureGuide ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
              title="Touch Gestures Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              id="ambient-exit-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsAmbientModeOpen(false);
              }}
              className="p-2.5 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10 transition-all ml-1"
              title="Exit Ambient Mode (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Central Responsive Layout: Dual-Pane on Tablets/Foldables/Desktop, Center Focus on Mobile */}
        <main className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center px-6 md:px-12 py-4 gap-8 md:gap-14 max-w-6xl mx-auto w-full overflow-hidden">
          
          {/* Left / Center Card: Artwork or Spotify Canvas Video + Track Details */}
          <div className="flex flex-col items-center justify-center text-center max-w-sm w-full shrink-0">
            {/* The Visual Media Card */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-3xl overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.9)] border border-white/10 bg-neutral-900 group">
              {showCanvasVideo && canvasUrl ? (
                <video
                  src={canvasUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={artworkUrl}
                  alt={track.title}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Ambient Audio Pulse Ring when playing */}
              {isPlaying && (
                <div className="absolute inset-0 ring-2 ring-emerald-500/30 rounded-3xl animate-pulse pointer-events-none" />
              )}
            </div>

            {/* Track Info */}
            <div className="mt-5 w-full px-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                {track.title}
              </h2>
              <p className="text-sm sm:text-base text-white/70 font-medium truncate mt-0.5">
                {track.artist}
              </p>
              {track.album && (
                <p className="text-xs text-white/40 truncate mt-0.5 font-mono">
                  {track.album}
                </p>
              )}
            </div>

            {/* Minimal Progress Line */}
            <div className="w-full max-w-[260px] mt-4 flex flex-col gap-1.5">
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                  transition={{ ease: 'linear', duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-white/40">
                <span>{formatTime(position)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Right Pane: Live Synced Lyrics (Scrolls automatically) */}
          <div className="flex-1 w-full max-w-lg h-44 sm:h-56 md:h-80 flex flex-col justify-center relative overflow-hidden">
            {lyricsData && lyricsData.lines && lyricsData.lines.length > 0 ? (
              <div
                ref={lyricsContainerRef}
                className="w-full h-full overflow-y-auto no-scrollbar scroll-smooth flex flex-col gap-4 py-16 px-4 mask-radial-fade text-center md:text-left"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 25%, black 75%, transparent 100%)',
                }}
              >
                {lyricsData.lines.map((line, idx) => {
                  const isActive = idx === activeLyricIndex;
                  return (
                    <motion.p
                      key={idx}
                      data-lyric-index={idx}
                      onClick={() => seek(line.time)}
                      className={`text-lg sm:text-xl md:text-2xl font-bold cursor-pointer transition-all duration-300 ${
                        isActive
                          ? 'text-white scale-105 drop-shadow-[0_2px_12px_rgba(16,185,129,0.5)] font-black'
                          : 'text-white/30 hover:text-white/60 text-base sm:text-lg font-medium'
                      }`}
                      animate={{
                        opacity: isActive ? 1 : 0.35,
                        scale: isActive ? 1.05 : 0.97,
                      }}
                      transition={{ duration: 0.25 }}
                    >
                      {line.text || '♪ ♪ ♪'}
                    </motion.p>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-white/40 gap-2 h-full">
                <Mic2 className="w-8 h-8 opacity-40 animate-pulse" />
                <p className="text-sm font-medium">Enjoy the rhythm • Synced lyrics offline</p>
              </div>
            )}
          </div>
        </main>

        {/* Bottom Bar: Gesture Hint & Idle Controls */}
        <footer className="relative z-20 flex flex-col items-center pb-6 pt-2 px-6">
          {/* Subtle Gesture Bar / Pill */}
          <div
            className={`transition-opacity duration-300 flex items-center gap-4 ${
              showControls ? 'opacity-100' : 'opacity-40 hover:opacity-100'
            }`}
          >
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-medium text-white/70">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                Swipe ↕ Vol • ↔ Song • 2× Tap Play/Pause
              </span>
            </div>
          </div>
        </footer>

        {/* Double Tap Ripple Visual Feedback */}
        {doubleTapRipple && (
          <motion.div
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute z-40 pointer-events-none w-24 h-24 rounded-full border border-white/50 bg-white/10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: doubleTapRipple.x, top: doubleTapRipple.y }}
          />
        )}

        {/* On-Screen Center Gesture HUD Feedback (Volume, Next/Prev, Play/Pause) */}
        <AnimatePresence>
          {hudMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center"
            >
              <div className="px-6 py-4 rounded-3xl bg-neutral-900/90 border border-white/15 backdrop-blur-xl shadow-2xl flex flex-col items-center gap-2 min-w-[140px]">
                {hudMessage.icon}
                <span className="text-xl font-bold text-white tracking-wide">{hudMessage.text}</span>
                {hudMessage.sub && (
                  <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                    {hudMessage.sub}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gesture Guide Modal Dialog */}
        <AnimatePresence>
          {showGestureGuide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowGestureGuide(false);
              }}
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-900 border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-left"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkle className="w-4 h-4 text-white/70" strokeWidth={1.5} />
                    <h3 className="text-base font-semibold text-white">Ambient Gestures</h3>
                  </div>
                  <button
                    onClick={() => setShowGestureGuide(false)}
                    className="p-1 rounded-full text-white/50 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-white/10 text-white/80 flex items-center justify-center font-semibold text-sm shrink-0">
                      ↕
                    </div>
                    <div>
                      <p className="font-medium text-white">Swipe Up / Down</p>
                      <p className="text-xs text-white/50">Increase or decrease volume smoothly</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-white/10 text-white/80 flex items-center justify-center font-semibold text-sm shrink-0">
                      ↔
                    </div>
                    <div>
                      <p className="font-medium text-white">Swipe Left / Right</p>
                      <p className="text-xs text-white/50">Skip to next or previous song</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-white/10 text-white/80 flex items-center justify-center font-semibold text-sm shrink-0">
                      2×
                    </div>
                    <div>
                      <p className="font-medium text-white">Double Tap Screen</p>
                      <p className="text-xs text-white/50">Toggle Play / Pause instantly</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-white/10 text-white/80 flex items-center justify-center font-semibold text-sm shrink-0">
                      1×
                    </div>
                    <div>
                      <p className="font-medium text-white">Single Tap Anywhere</p>
                      <p className="text-xs text-white/50">Show or hide ambient controls & exit</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowGestureGuide(false)}
                  className="w-full mt-5 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors"
                >
                  Got It
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
