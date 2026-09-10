import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { usePlayerProgressStore } from '../../store/playerProgressStore';
import { useUser } from '../../context/UserContext';
import { CanvasService } from '../../services/CanvasService';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Mic2,
  ListMusic,
  Maximize2,
  Volume2,
  VolumeX,
  Laptop2,
  Check,
  Video,
  Sparkle,
} from 'lucide-react';
import { motion } from 'motion/react';

export const MiniPlayer: React.FC = () => {
  const {
    track,
    isPlaying,
    togglePlay,
    seek,
    nextTrack,
    previousTrack,
    shuffleEnabled,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    setIsFullscreenOpen,
    setIsLyricsOpen,
    setIsQueueOpen,
    setIsAmbientModeOpen,
    isLyricsOpen,
    isQueueOpen,
    isLoading,
  } = usePlayer();
  const { position, duration } = usePlayerProgressStore();

  const { isTrackLiked, toggleLikeTrack } = useUser();
  const isSeekingRef = React.useRef(false);
  const seekPosRef = React.useRef(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPos, setSeekPos] = useState(0);
  const [hasCanvas, setHasCanvas] = useState(false);

  useEffect(() => {
    if (!track?.id) {
      setHasCanvas(false);
      return;
    }
    let active = true;
    CanvasService.getCanvasForTrack(track)
      .then((res) => {
        if (active) {
          setHasCanvas(Boolean(res?.verified && res?.canvasUrl));
        }
      })
      .catch(() => {
        if (active) setHasCanvas(false);
      });
    return () => {
      active = false;
    };
  }, [track?.id]);

  if (!track || isLyricsOpen) return null;

  const isLiked = isTrackLiked(track.id);
  const safeDuration = duration > 0 && isFinite(duration) ? duration : (track?.duration && track.duration > 0 ? track.duration : 210);
  const currentPos = isSeeking ? seekPos : (typeof position === 'number' && !isNaN(position) ? position : 0);
  const progressPercent = safeDuration > 0 ? Math.min(100, Math.max(0, (currentPos / safeDuration) * 100)) : 0;

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekStart = () => {
    isSeekingRef.current = true;
    setIsSeeking(true);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      seekPosRef.current = val;
      setSeekPos(val);
    }
  };

  const handleSeekCommit = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const val = parseFloat((e.currentTarget as HTMLInputElement).value);
    const targetVal = !isNaN(val) && val >= 0 ? val : seekPosRef.current;
    seek(targetVal);
    isSeekingRef.current = false;
    setIsSeeking(false);
  };

  return (
    <>
      {/* 1. Mobile Floating MiniPlayer (< md screens) */}
      <div 
        className="md:hidden fixed left-0 right-0 z-40 px-2 sm:px-3 pb-1 pointer-events-none"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          onClick={() => setIsFullscreenOpen(true)}
          className="pointer-events-auto flex items-center justify-between p-2 rounded-2xl liquid-glass-capsule text-white cursor-pointer group transition-all relative overflow-hidden active:scale-[0.99]"
        >
          {/* Continuous top thin progress bar indicator with glass glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] transition-transform duration-200"
              style={{ transform: `scaleX(${progressPercent / 100})`, transformOrigin: 'left' }}
            />
          </div>

          {/* Left: Thumbnail & Metadata */}
          <div className="flex items-center gap-3 min-w-0 flex-1 pl-1">
            <div className="relative aspect-square w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800 shadow-lg border border-white/10">
              <img
                src={track.images?.small || track.images?.medium || track.images?.large || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'}
                alt={track.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
              )}
            </div>

            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h4 className="font-semibold text-xs truncate text-neutral-100 group-hover:text-emerald-400 transition-colors">
                  {track.title}
                </h4>

                {isPlaying && (
                  <div className="flex items-end space-x-[2px] h-3 opacity-90 flex-shrink-0 eq-playing">
                    <div className="eq-bar w-[2px] bg-emerald-400" />
                    <div className="eq-bar w-[2px] bg-emerald-400" />
                    <div className="eq-bar w-[2px] bg-emerald-400" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-neutral-300/80 truncate mt-0.5 font-medium">
                {track.artist}
              </p>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 flex-shrink-0 pr-1"
          >
            {/* Device / Connect indicator (Spotiz Connect) */}
            <div
              className="p-1.5 text-neutral-300 hover:text-white rounded-full cursor-pointer hover:bg-white/10 transition-colors"
              title="Spotiz Connect"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-neutral-300">
                <path d="M6 3h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v10h12V5H6zm4 14h4v2h-4v-2z" />
              </svg>
            </div>

            {/* Ambient Mode (Standby) toggle on mobile */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAmbientModeOpen(true);
              }}
              title="Ambient Mode (Always-on / Gestures)"
              className="p-1.5 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Sparkle className="w-5 h-5" strokeWidth={1.5} />
            </button>

            {/* Lyrics toggle button on mobile */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLyricsOpen(true);
              }}
              title="View Lyrics"
              className="p-1.5 text-neutral-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Mic2 className="w-5 h-5" />
            </button>

            {/* Add / Like toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLikeTrack(track);
              }}
              title={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
              aria-label={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
              className="p-1.5 text-neutral-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'text-red-500 fill-red-500 scale-105' : 'text-neutral-300'}`} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              disabled={isLoading}
              title={isPlaying ? 'Pause' : 'Play'}
              className="p-1.5 text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 fill-white text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]" />
              ) : (
                <Play className="w-6 h-6 fill-white text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]" />
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* 2. Desktop & Tablet Spotiz Docked Bottom Player Bar (>= md screens) - HIDDEN for 2026 Tablet UI Layout */}
      <footer className="hidden md:hidden items-center justify-between h-[84px] md:h-[88px] liquid-glass-bar px-4 sm:px-6 lg:px-8 select-none z-40 flex-shrink-0 w-full">
        {/* Left Section: Track Artwork, Title, Artist & Like Button */}
        <div className="flex items-center gap-3 w-[30%] min-w-0 max-w-[300px] flex-shrink">
          <div
            onClick={() => setIsFullscreenOpen(true)}
            className="relative aspect-square w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 cursor-pointer shadow-md group border border-white/10"
            title="Expand Fullscreen Player"
          >
            <img
              src={track.images?.small || track.images?.medium || track.images?.large || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'}
              alt={track.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
            {isPlaying && (
              <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
            )}
          </div>

          <div className="min-w-0 flex-1 pr-1 flex flex-col justify-center">
            <h4
              onClick={() => setIsFullscreenOpen(true)}
              className="text-xs sm:text-sm font-semibold text-white truncate hover:underline cursor-pointer transition-colors"
              title={track.title}
            >
              {track.title}
            </h4>
            <p
              className="text-[11px] sm:text-xs text-neutral-400 truncate hover:text-neutral-200 cursor-pointer transition-colors mt-0.5"
              title={track.artist}
            >
              {track.artist}
            </p>
          </div>

          <button
            onClick={() => toggleLikeTrack(track)}
            className="p-1.5 sm:p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/5 transition-colors flex-shrink-0 cursor-pointer"
            title={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
            aria-label={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isLiked ? 'text-red-500 fill-red-500 scale-105' : ''}`} />
          </button>
        </div>

        {/* Center Section: Playback Controls (Top) & Scrubbing Timeline (Bottom) */}
        <div className="flex flex-col items-center justify-center flex-1 max-w-xl lg:max-w-2xl px-2 sm:px-4 min-w-0">
          {/* Row 1: Playback Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 md:gap-5 mb-1 sm:mb-1.5 select-none">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer relative ${
                shuffleEnabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              title={`Shuffle: ${shuffleEnabled ? 'On' : 'Off'}`}
              aria-label="Toggle Shuffle"
            >
              <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {shuffleEnabled && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
              )}
            </button>

            {/* Previous */}
            <button
              onClick={previousTrack}
              className="p-1.5 sm:p-2 text-neutral-300 hover:text-white hover:bg-white/5 rounded-full transition-colors cursor-pointer"
              title="Previous track"
              aria-label="Previous Track"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            {/* Main Play/Pause Button */}
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white text-black flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex-shrink-0 mx-0.5"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-black" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextTrack}
              className="p-1.5 sm:p-2 text-neutral-300 hover:text-white hover:bg-white/5 rounded-full transition-colors cursor-pointer"
              title="Next track"
              aria-label="Next Track"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer relative ${
                repeatMode !== 'off' ? 'text-emerald-400 hover:text-emerald-300' : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
              title={`Repeat: ${repeatMode}`}
              aria-label="Toggle Repeat"
            >
              {repeatMode === 'one' ? <Repeat1 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              {repeatMode !== 'off' && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
              )}
            </button>
          </div>

          {/* Row 2: Timeline seekbar with timestamps */}
          <div className="w-full flex items-center gap-2 sm:gap-2.5 text-xs font-medium text-neutral-400 select-none">
            <span className="w-8 sm:w-9 text-right text-[11px] font-mono text-neutral-400 select-none tabular-nums flex-shrink-0">
              {formatTime(currentPos)}
            </span>
            <div className="relative flex-1 flex items-center h-4 group cursor-pointer select-none py-1">
              {/* Background Track Bar */}
              <div className="absolute inset-x-0 h-1 bg-white/20 rounded-full group-hover:h-1.5 transition-all overflow-hidden">
                <div 
                  className="h-full bg-white group-hover:bg-emerald-500 rounded-full transition-[transform] duration-75 ease-out"
                  style={{ transform: `scaleX(${Math.min(100, Math.max(0, progressPercent)) / 100})`, transformOrigin: 'left' }}
                />
              </div>

              {/* Scrubber thumb knob on hover */}
              <div 
                className="absolute w-3 h-3 bg-white rounded-full shadow-md -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />

              {/* Transparent range slider */}
              <input
                id="miniplayer-seek-slider"
                type="range"
                min={0}
                max={safeDuration}
                step={0.1}
                value={Math.min(safeDuration, Math.max(0, typeof currentPos === 'number' && !Number.isNaN(currentPos) ? currentPos : 0))}
                onPointerDown={handleSeekStart}
                onChange={handleSeekChange}
                onPointerUp={handleSeekCommit}
                onPointerCancel={handleSeekCommit}
                onPointerLeave={(e) => {
                  if (isSeeking) {
                    handleSeekCommit(e);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                aria-label="Seek track"
              />
            </div>
            <span className="w-8 sm:w-9 text-left text-[11px] font-mono text-neutral-400 select-none tabular-nums flex-shrink-0">
              {formatTime(safeDuration)}
            </span>
          </div>
        </div>

        {/* Right Section: Lyrics, Queue, Ambient, Volume, Fullscreen */}
        <div className="flex items-center justify-end gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5 w-[30%] min-w-0 max-w-[300px] text-neutral-400 select-none flex-shrink">
          {/* Lyrics toggle */}
          <button
            onClick={() => setIsLyricsOpen(!isLyricsOpen)}
            className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${
              isLyricsOpen ? 'text-emerald-400 bg-white/10' : 'hover:text-white hover:bg-white/5'
            }`}
            title="Lyrics"
            aria-label="Toggle Lyrics"
          >
            <Mic2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
          </button>

          {/* Queue toggle */}
          <button
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${
              isQueueOpen ? 'text-emerald-400 bg-white/10' : 'hover:text-white hover:bg-white/5'
            }`}
            title="Queue"
            aria-label="Toggle Queue"
          >
            <ListMusic className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
          </button>

          {/* Ambient Mode (Standby) toggle */}
          <button
            id="miniplayer-ambient-mode-btn"
            onClick={() => setIsAmbientModeOpen(true)}
            className="p-1.5 sm:p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer hidden xl:flex"
            title="Ambient Mode (Always-on / Gestures)"
            aria-label="Ambient Mode"
          >
            <Sparkle className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" strokeWidth={1.5} />
          </button>

          {/* Volume Group */}
          <div className="flex items-center gap-1 sm:gap-1.5 group/vol">
            <button
              onClick={toggleMute}
              className="p-1 sm:p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/5"
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-neutral-500" />
              ) : (
                <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
              )}
            </button>
            <div className="relative flex items-center">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : (typeof volume === 'number' && !Number.isNaN(volume) ? volume : 1)}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-14 sm:w-16 md:w-20 lg:w-24 h-1 group-hover/vol:h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 transition-all"
                aria-label="Volume Slider"
              />
            </div>
          </div>

          {/* Fullscreen Player toggle */}
          <button
            onClick={() => setIsFullscreenOpen(true)}
            className="p-1.5 sm:p-2 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer flex-shrink-0"
            title="Fullscreen Player"
            aria-label="Open Fullscreen Player"
          >
            <Maximize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
          </button>
        </div>
      </footer>
    </>
  );
};
