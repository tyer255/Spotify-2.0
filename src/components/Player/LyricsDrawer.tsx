import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayer } from '../../context/PlayerContext';
import { X, Sparkles, Music, ChevronDown } from 'lucide-react';

const PALETTES = [
  { o1: 'radial-gradient(circle, #2a0a38 0%, transparent 70%)', o2: 'radial-gradient(circle, #0b1a30 0%, transparent 70%)' },
  { o1: 'radial-gradient(circle, #380a15 0%, transparent 70%)', o2: 'radial-gradient(circle, #2a1b0a 0%, transparent 70%)' },
  { o1: 'radial-gradient(circle, #08211f 0%, transparent 70%)', o2: 'radial-gradient(circle, #101928 0%, transparent 70%)' },
  { o1: 'radial-gradient(circle, #2e151e 0%, transparent 70%)', o2: 'radial-gradient(circle, #190a2a 0%, transparent 70%)' },
];

export const LyricsDrawer: React.FC = () => {
  const {
    track,
    lyricsData,
    activeLyricIndex,
    seek,
    isLyricsOpen,
    setIsLyricsOpen,
    position,
    duration,
    isPlaying,
    togglePlay,
    isLoading,
  } = usePlayer();

  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isSeekingRef = useRef(false);
  const seekPosRef = useRef(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPos, setSeekPos] = useState(0);

  // Dynamic ambient orb backgrounds
  const currentPaletteIndex = activeLyricIndex >= 0 ? activeLyricIndex % PALETTES.length : 0;
  const currentPalette = PALETTES[currentPaletteIndex];

  // Ultra-Accurate Center Scrolling Formula
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeEl = activeLineRef.current;
      const containerHalfHeight = container.clientHeight / 2;
      const elementHalfHeight = activeEl.clientHeight / 2;
      const scrollTarget = activeEl.offsetTop - containerHalfHeight + elementHalfHeight;

      container.scrollTo({
        top: scrollTarget,
        behavior: 'smooth',
      });
    }
  }, [activeLyricIndex]);

  if (!isLyricsOpen || !track) return null;

  const currentDisplayTime = isSeeking ? seekPos : position;
  const progressPercent = duration > 0 ? (currentDisplayTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekStart = (e: React.SyntheticEvent<HTMLInputElement>) => {
    isSeekingRef.current = true;
    setIsSeeking(true);
    const val = parseFloat((e.currentTarget as HTMLInputElement).value);
    if (!isNaN(val) && val >= 0) {
      seekPosRef.current = val;
      setSeekPos(val);
    } else {
      seekPosRef.current = position;
      setSeekPos(position);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>) => {
    isSeekingRef.current = true;
    setIsSeeking(true);
    const val = parseFloat((e.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 0) {
      seekPosRef.current = val;
      setSeekPos(val);
    }
  };

  const handleSeekCommit = (e?: React.SyntheticEvent<HTMLInputElement>) => {
    let targetTime = seekPosRef.current;
    if (e && (e.currentTarget as HTMLInputElement)?.value) {
      const val = parseFloat((e.currentTarget as HTMLInputElement).value);
      if (!isNaN(val) && val >= 0) {
        targetTime = val;
        seekPosRef.current = val;
        setSeekPos(val);
      }
    }
    seek(targetTime);
    setTimeout(() => {
      isSeekingRef.current = false;
      setIsSeeking(false);
    }, 450);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-between text-white overflow-hidden select-none bg-black"
      >
        {/* Noise overlay for cinematic texture */}
        <div className="noise-overlay" />

        {/* Ambient Animated Gradient Orbs */}
        <div className="ambient-bg">
          <div
            className="ambient-orb orb-1"
            style={{ background: currentPalette.o1 }}
          />
          <div
            className="ambient-orb orb-2"
            style={{ background: currentPalette.o2 }}
          />
        </div>

        {/* Top Floating Control Bar */}
        <div className="relative z-30 flex items-center justify-between w-full px-6 md:px-12 py-5 bg-gradient-to-b from-black/60 to-transparent flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLyricsOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95 shadow-md flex items-center justify-center"
              title="Close lyrics"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold">Lyrics</span>
                {lyricsData?.synced && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1 border border-emerald-500/30">
                    <Sparkles className="w-2.5 h-2.5" /> Synced
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-300 font-medium truncate max-w-[200px] sm:max-w-md">
                {track.title} • {track.artist}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLyricsOpen(false)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
            title="Close lyrics"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center Lyrics Flow Container with Aggressive Fade Mask */}
        <div
          ref={containerRef}
          id="lyrics-container"
          className="relative lyrics-mask z-10 flex-1 w-full max-w-4xl px-6 md:px-12 py-[45vh] overflow-y-auto flex flex-col space-y-4 md:space-y-6 scroll-smooth no-scrollbar"
        >
          {lyricsData && lyricsData.lines && lyricsData.lines.length > 0 ? (
            lyricsData.lines.map((line, index) => {
              const isActive = index === activeLyricIndex;
              let lineTime = Number(line.time);
              if (isNaN(lineTime) && line.startTimeMs) {
                lineTime = Number(line.startTimeMs) / 1000;
              } else if (lineTime > 10000) {
                lineTime = lineTime / 1000;
              }

              return (
                <div
                  key={index}
                  id={`lyric-${index}`}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seek(lineTime)}
                  className={`lyric-line text-2xl md:text-4xl lg:text-5xl font-bold ${
                    isActive ? 'active' : ''
                  }`}
                >
                  {line.text}
                </div>
              );
            })
          ) : (
            <div className="my-auto text-center w-full space-y-4 py-16">
              <Music className="w-14 h-14 text-neutral-400 mx-auto animate-pulse" />
              <p className="text-xl md:text-2xl font-bold text-neutral-200">
                {lyricsData?.plainLyrics || 'Fetching real lyrics...'}
              </p>
              <p className="text-sm text-neutral-400">
                Synchronized lyrics will stream as the music plays.
              </p>
            </div>
          )}
        </div>

        {/* Floating Glass Player Dock */}
        <div className="z-20 w-[94%] md:w-[75%] max-w-2xl mb-8 px-5 py-4 glass-dock flex flex-col items-center absolute bottom-0 shadow-2xl">
          {/* Track Info & Controls */}
          <div className="flex items-center justify-between w-full mb-4">
            <div className="flex items-center space-x-4 min-w-0 pr-2">
              {/* Album Art / Vinyl Spinning on Playback */}
              <div
                id="album-art"
                className={`relative w-14 h-14 rounded-full border border-gray-600 shadow-[0_5px_15px_rgba(0,0,0,0.5)] overflow-hidden record-spin flex-shrink-0 ${
                  isPlaying ? 'playing' : ''
                }`}
              >
                {track.images?.medium || track.images?.large || track.images?.small ? (
                  <img
                    src={track.images?.medium || track.images?.large || track.images?.small || ''}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-900 via-pink-700 to-orange-500" />
                )}
                {/* Center vinyl spindle rings */}
                <div className="absolute inset-[18px] bg-[#111] rounded-full border border-gray-800 shadow-inner flex items-center justify-center pointer-events-none">
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                </div>
              </div>

              {/* Title & Artist & EQ Visualizer */}
              <div className="text-left flex flex-col justify-center min-w-0">
                <div className="flex items-center space-x-2 min-w-0">
                  <h2 className="text-base md:text-lg font-bold text-white tracking-tight leading-none drop-shadow-md truncate max-w-[180px] sm:max-w-xs">
                    {track.title}
                  </h2>
                  {/* Live EQ */}
                  <div
                    id="eq-visualizer"
                    className={`flex items-end space-x-[2px] h-[14px] opacity-80 flex-shrink-0 ${
                      isPlaying ? 'eq-playing' : ''
                    }`}
                  >
                    <div className="eq-bar" />
                    <div className="eq-bar" />
                    <div className="eq-bar" />
                    <div className="eq-bar" />
                  </div>
                </div>
                <p className="text-[13px] text-gray-300 font-medium mt-1 opacity-80 truncate max-w-[200px] sm:max-w-xs">
                  {track.artist}
                </p>
              </div>
            </div>

            {/* Play/Pause Button */}
            <button
              id="play-btn"
              onClick={togglePlay}
              disabled={isLoading}
              className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex-shrink-0 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <svg
                  id="icon-pause"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-7 h-7"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75V5.25Z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  id="icon-play"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-7 h-7 ml-1"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Progress Bar & Timestamps */}
          <div className="w-full flex items-center space-x-3 px-1">
            <span
              id="current-time"
              className="text-[11px] text-gray-400 font-semibold w-8 text-right tabular-nums opacity-70"
            >
              {formatTime(currentDisplayTime)}
            </span>
            <div className="relative flex-1 flex items-center h-full py-2">
              <input
                type="range"
                id="progress-bar"
                min={0}
                max={duration > 0 ? duration : (track?.duration || 100)}
                step={0.1}
                value={currentDisplayTime}
                onPointerDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                onMouseDown={handleSeekStart}
                onChange={handleSeekChange}
                onInput={handleSeekChange}
                onPointerUp={handleSeekCommit}
                onMouseUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                className="w-full relative z-20 cursor-pointer"
              />
              {/* Glowing Progress fill */}
              <div
                id="progress-fill"
                className="absolute left-0 h-1 bg-white rounded-full z-10 pointer-events-none transition-all duration-75 shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
            <span
              id="total-time"
              className="text-[11px] text-gray-400 font-semibold w-8 text-left tabular-nums opacity-70"
            >
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

