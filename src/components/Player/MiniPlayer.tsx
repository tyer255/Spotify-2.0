import React, { useState } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { useUser } from '../../context/UserContext';
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
} from 'lucide-react';
import { motion } from 'motion/react';

export const MiniPlayer: React.FC = () => {
  const {
    track,
    isPlaying,
    position,
    duration,
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
    isLyricsOpen,
    isQueueOpen,
    isLoading,
  } = usePlayer();

  const { isTrackLiked, toggleLikeTrack } = useUser();
  const isSeekingRef = React.useRef(false);
  const seekPosRef = React.useRef(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPos, setSeekPos] = useState(0);

  if (!track) return null;

  const isLiked = isTrackLiked(track.id);
  const currentPos = isSeeking ? seekPos : position;
  const progressPercent = duration > 0 ? (currentPos / duration) * 100 : 0;

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
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
    <>
      {/* 1. Mobile Floating MiniPlayer (< md screens) */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-2 sm:px-3 pb-1 pointer-events-none">
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
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
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
            {/* Device / Connect indicator (Spotify Connect) */}
            <div
              className="p-1.5 text-neutral-300 hover:text-white rounded-full cursor-pointer hover:bg-white/10 transition-colors"
              title="Spotify Connect"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-neutral-300">
                <path d="M6 3h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v10h12V5H6zm4 14h4v2h-4v-2z" />
              </svg>
            </div>

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
              title={isLiked ? "Saved to Your Library" : "Save to Your Library"}
              className="p-1.5 text-neutral-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              {isLiked ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2 text-neutral-300">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
              )}
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

      {/* 2. Desktop & Tablet Spotify Docked Bottom Player Bar (>= md screens) */}
      <div className="hidden md:flex items-center justify-between h-[90px] liquid-glass-bar px-6 select-none z-40 flex-shrink-0">
        {/* Left Column: Track Info, Like Button, Details */}
        <div className="flex items-center gap-4 w-1/4 min-w-[220px]">
          <div
            onClick={() => setIsFullscreenOpen(true)}
            className="relative aspect-square w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800 cursor-pointer shadow-lg group"
          >
            <img
              src={track.images?.small || track.images?.medium || track.images?.large || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'}
              alt={track.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="min-w-0 pr-2">
            <h4
              onClick={() => setIsFullscreenOpen(true)}
              className="text-base font-semibold text-white truncate hover:underline cursor-pointer"
            >
              {track.title}
            </h4>
            <p className="text-sm text-neutral-400 truncate mt-0.5 hover:text-white cursor-pointer">
              {track.artist}
            </p>
          </div>

          <button
            onClick={() => toggleLikeTrack(track)}
            className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/5 transition-colors flex-shrink-0 ml-2"
            title="Save to Liked Songs"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500 scale-105' : ''}`} />
          </button>
        </div>

        {/* Center Column: Full Playback Controls + Scrubbing Slider */}
        <div className="flex flex-col items-center justify-center w-2/4 max-w-2xl px-6">
          <div className="flex items-center gap-5 mb-2">
            {/* Shuffle */}
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition-colors ${
                shuffleEnabled ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Previous */}
            <button
              onClick={previousTrack}
              className="p-2 text-neutral-300 hover:text-white transition-colors"
              title="Previous"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            {/* Main Play/Pause Button */}
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={nextTrack}
              className="p-2 text-neutral-300 hover:text-white transition-colors"
              title="Next"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>

            {/* Repeat */}
            <button
              onClick={toggleRepeat}
              className={`p-2 rounded-full transition-colors ${
                repeatMode !== 'off' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Timeline seekbar with timestamps */}
          <div className="w-full flex items-center gap-3 text-xs font-medium text-neutral-400">
            <span className="w-10 text-right">{formatTime(currentPos)}</span>
            <div className="relative flex-1 flex items-center group py-2">
              <input
                id="miniplayer-seek-slider"
                type="range"
                min={0}
                max={duration > 0 ? duration : (track?.duration || 100)}
                step={0.1}
                value={currentPos}
                onPointerDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                onMouseDown={handleSeekStart}
                onChange={handleSeekChange}
                onInput={handleSeekChange}
                onPointerUp={handleSeekCommit}
                onMouseUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer group-hover:h-2 transition-all accent-emerald-500"
              />
            </div>
            <span className="w-10 text-left">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Column: Lyrics, Queue, Volume, Fullscreen */}
        <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px] text-neutral-400">
          {/* Lyrics toggle */}
          <button
            onClick={() => setIsLyricsOpen(!isLyricsOpen)}
            className={`p-2 rounded-full transition-colors ${
              isLyricsOpen ? 'text-emerald-400 bg-white/10' : 'hover:text-white hover:bg-white/5'
            }`}
            title="Lyrics"
          >
            <Mic2 className="w-5 h-5" />
          </button>

          {/* Queue toggle */}
          <button
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            className={`p-2 rounded-full transition-colors ${
              isQueueOpen ? 'text-emerald-400 bg-white/10' : 'hover:text-white hover:bg-white/5'
            }`}
            title="Queue"
          >
            <ListMusic className="w-5 h-5" />
          </button>

          {/* Volume slider */}
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={toggleMute}
              className="p-1 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-neutral-500" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:h-2 transition-all"
            />
          </div>

          {/* Fullscreen Player toggle */}
          <button
            onClick={() => setIsFullscreenOpen(true)}
            className="p-2 hover:text-white rounded-full hover:bg-white/5 transition-colors ml-1"
            title="Fullscreen Player"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
};
