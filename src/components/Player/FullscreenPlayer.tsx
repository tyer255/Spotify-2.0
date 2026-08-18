import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayer } from '../../context/PlayerContext';
import { useUser } from '../../context/UserContext';
import { ViewState } from '../../types';
import {
  ChevronDown,
  Heart,
  MoreVertical,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Repeat1,
  ListMusic,
  Mic2,
  Clock,
  Gauge,
  PlusCircle,
  CheckCircle,
  X,
  Plus
} from 'lucide-react';
import { ContextMenu } from '../Common/ContextMenu';
import { PlaylistArtwork } from '../Common/PlaylistArtwork';
import { CreatePlaylistModal } from '../Common/CreatePlaylistModal';

interface FullscreenPlayerProps {
  onNavigate?: (view: ViewState) => void;
}

export const FullscreenPlayer: React.FC<FullscreenPlayerProps> = ({ onNavigate }) => {
  const {
    track,
    isPlaying,
    position,
    duration,
    volume,
    isMuted,
    playbackRate,
    repeatMode,
    shuffleEnabled,
    isLoading,
    togglePlay,
    seek,
    nextTrack,
    previousTrack,
    toggleShuffle,
    toggleRepeat,
    setVolume,
    toggleMute,
    setPlaybackRate,
    isFullscreenOpen,
    setIsFullscreenOpen,
    setIsLyricsOpen,
    setIsQueueOpen,
    sleepTimerMinutes,
    setSleepTimer,
  } = usePlayer();

  const { isTrackLiked, toggleLikeTrack, playlists, addTrackToPlaylist, showToast } = useUser();
  const [showMenu, setShowMenu] = useState(false);
  const [showSleepTimerModal, setShowSleepTimerModal] = useState(false);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const isSeekingRef = useRef(false);
  const seekPosRef = useRef(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPos, setSeekPos] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!isFullscreenOpen || !track) return null;

  const isLiked = isTrackLiked(track.id);

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentDisplayTime = isSeeking ? seekPos : position;
  const progressPercent = duration > 0 ? (currentDisplayTime / duration) * 100 : 0;

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 100);
  };

  const dominantColor = track.color || '#1DB954';
  const artworkUrl = track.images?.large || track.images?.medium || track.images?.small || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

  // Mock lyrics if none exist
  const lyricsLines = track.lyrics 
    ? track.lyrics.split('\n').filter((l: string) => l.trim().length > 0).slice(0, 4) 
    : ["Music playing...", "Enjoy the rhythm", "Feel the beat", "..."];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="fixed inset-0 z-50 flex flex-col text-white select-none overflow-hidden bg-[#080808]"
      >
        {/* Sticky Mini Player / Header */}
        <div 
          className={`absolute top-0 left-0 right-0 z-50 px-4 pt-safe pb-3 flex items-center justify-between transition-all duration-300 ${
            isScrolled ? 'bg-neutral-900 shadow-lg opacity-100 translate-y-0' : 'bg-transparent opacity-0 -translate-y-full pointer-events-none'
          }`}
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setIsFullscreenOpen(false)}
              className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <div 
              className="truncate cursor-pointer flex-1"
              onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <h3 className="text-sm font-bold text-white truncate">{track.title}</h3>
              <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => toggleLikeTrack(track)}
              className="p-1 hover:scale-105 transition-transform"
            >
              {isLiked ? (
                <Heart className="w-5 h-5 text-emerald-500 fill-emerald-500" />
              ) : (
                <Heart className="w-5 h-5 text-white" />
              )}
            </button>
            <button onClick={togglePlay} className="p-1">
              {isPlaying ? <Pause className="w-5 h-5 fill-white text-white" /> : <Play className="w-5 h-5 fill-white text-white" />}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto w-full relative"
          style={{
            background: `linear-gradient(to bottom, ${dominantColor}60 0%, #121212 400px, #080808 100%)`,
          }}
        >
          <div className="px-5 sm:px-8 pb-12 w-full max-w-xl mx-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
            
            {/* Top Navbar */}
            <div className={`flex items-center justify-between w-full mb-6 transition-opacity duration-300 ${isScrolled ? 'opacity-0' : 'opacity-100'}`}>
              <button
                onClick={() => setIsFullscreenOpen(false)}
                className="p-2 -ml-2 rounded-full hover:bg-black/20 text-white transition-colors"
                aria-label="Minimize player"
              >
                <ChevronDown className="w-6 h-6" />
              </button>

              <div className="text-center">
                <span className="text-xs tracking-wider text-white/80 font-semibold block mb-0.5">
                  PLAYING FROM {track.album ? 'ALBUM' : 'PLAYLIST'}
                </span>
                <h4
                  onClick={() => {
                    if (onNavigate) {
                      setIsFullscreenOpen(false);
                      onNavigate({ type: 'album', albumId: track.albumId });
                    }
                  }}
                  className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] hover:underline cursor-pointer"
                >
                  {track.album || 'Current Queue'}
                </h4>
              </div>

              <button
                onClick={() => setShowMenu(true)}
                className="p-2 -mr-2 rounded-full hover:bg-black/20 text-white transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Large Artwork */}
            <div className="w-full aspect-square mb-8 rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
              <img
                src={artworkUrl}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Artist & Like & Add */}
            <div className="flex items-center justify-between mb-6">
              <div className="min-w-0 flex-1 pr-2">
                <h2 className="text-2xl sm:text-3xl font-bold truncate text-white mb-1">
                  {track.title}
                </h2>
                <p
                  onClick={() => {
                    if (onNavigate) {
                      setIsFullscreenOpen(false);
                      onNavigate({ type: 'artist', artistId: track.artistId });
                    }
                  }}
                  className="text-base sm:text-lg text-white/70 truncate hover:text-white hover:underline cursor-pointer"
                >
                  {track.artist}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setShowPlaylistModal(true)}
                  className="p-2 rounded-full hover:scale-105 transition-transform"
                  aria-label="Add to playlist"
                >
                  <PlusCircle className="w-7 h-7 text-white" />
                </button>
                <button
                  onClick={() => toggleLikeTrack(track)}
                  className="p-2 -mr-2 rounded-full hover:scale-105 transition-transform"
                  aria-label={isLiked ? "Remove from liked" : "Add to liked"}
                >
                  {isLiked ? (
                    <Heart className="w-7 h-7 text-emerald-500 fill-emerald-500" />
                  ) : (
                    <Heart className="w-7 h-7 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Seekbar & Timestamps */}
            <div className="space-y-1.5 mb-6">
              <div className="relative flex items-center group">
                <input
                  id="fullscreen-player-seek-slider"
                  type="range"
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
                  className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer group-hover:h-1.5 transition-all"
                  style={{ accentColor: '#ffffff' }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium text-white/70">
                <span>{formatTime(currentDisplayTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Playback Controls */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={toggleShuffle}
                className={`p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors ${
                  shuffleEnabled ? 'text-emerald-500' : 'text-white'
                }`}
                aria-label="Shuffle"
              >
                <Shuffle className="w-6 h-6" />
              </button>

              <button
                onClick={previousTrack}
                className="p-2 rounded-full text-white hover:bg-white/10 transition-all active:scale-90"
                aria-label="Previous track"
              >
                <SkipBack className="w-8 h-8 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                disabled={isLoading}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-8 h-8 fill-black" />
                ) : (
                  <Play className="w-8 h-8 fill-black ml-1" />
                )}
              </button>

              <button
                onClick={nextTrack}
                className="p-2 rounded-full text-white hover:bg-white/10 transition-all active:scale-90"
                aria-label="Next track"
              >
                <SkipForward className="w-8 h-8 fill-current" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors ${
                  repeatMode !== 'off' ? 'text-emerald-500' : 'text-white'
                }`}
                aria-label={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-6 h-6" /> : <Repeat className="w-6 h-6" />}
              </button>
            </div>

            {/* Secondary Controls (Lyrics, Queue, Timer, Speed) */}
            <div className="flex items-center justify-between mb-8 text-white/70">
              <button onClick={() => setIsLyricsOpen(true)} className="flex flex-col items-center gap-1.5 p-2 hover:text-white transition-colors" aria-label="Lyrics">
                <Mic2 className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Lyrics</span>
              </button>
              <button onClick={() => setIsQueueOpen(true)} className="flex flex-col items-center gap-1.5 p-2 hover:text-white transition-colors" aria-label="Queue">
                <ListMusic className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Queue</span>
              </button>
              <button onClick={() => setShowSleepTimerModal(true)} className={`flex flex-col items-center gap-1.5 p-2 transition-colors ${sleepTimerMinutes ? 'text-emerald-500' : 'hover:text-white'}`} aria-label="Sleep timer">
                <Clock className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {sleepTimerMinutes ? `${sleepTimerMinutes}m` : 'Timer'}
                </span>
              </button>
              <button onClick={() => setShowSpeedModal(true)} className="flex flex-col items-center gap-1.5 p-2 hover:text-white transition-colors" aria-label="Playback speed">
                <Gauge className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{playbackRate}x</span>
              </button>
            </div>

            {/* Lyrics Preview Card */}
            <div 
              onClick={() => setIsLyricsOpen(true)}
              className="bg-[#1e1e1e] rounded-2xl p-5 mb-6 cursor-pointer hover:bg-[#252525] transition-colors relative overflow-hidden group"
              style={{ backgroundColor: `${dominantColor}40` }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm">Lyrics preview</h3>
              </div>
              <div className="space-y-2.5 text-xl sm:text-2xl font-bold text-white leading-snug">
                {lyricsLines.map((line: string, i: number) => (
                  <p key={i} className={i === lyricsLines.length - 1 ? 'text-white/40 truncate' : 'truncate'}>
                    {line}
                  </p>
                ))}
              </div>
              <div className="mt-6">
                <span className="inline-block px-4 py-1.5 bg-white text-black text-sm font-bold rounded-full">
                  Show lyrics
                </span>
              </div>
            </div>

            {/* About the Artist Card */}
            <div 
              onClick={() => {
                if (onNavigate) {
                  setIsFullscreenOpen(false);
                  onNavigate({ type: 'artist', artistId: track.artistId });
                }
              }}
              className="bg-neutral-900 rounded-2xl overflow-hidden relative group cursor-pointer mb-6"
            >
              <div className="absolute inset-0">
                <img 
                  src={artworkUrl} 
                  alt={track.artist} 
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
              </div>
              <div className="relative z-10 p-5">
                <h3 className="font-bold text-white text-sm mb-4">About the artist</h3>
                <div className="mt-32">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
                    {track.artist}
                    <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-none stroke-current stroke-[3]"><path d="M20 6L9 17l-5-5"/></svg>
                    </span>
                  </h2>
                  <p className="text-white/80 text-sm mb-4">24.9M monthly listeners</p>
                  <p className="text-white/60 text-sm line-clamp-3">
                    {track.artist} is an acclaimed artist. Explore more of their music and discover similar tracks in their discography.
                  </p>
                </div>
              </div>
            </div>

            {/* Explore Artist */}
            <div className="bg-neutral-900 rounded-2xl p-5 mb-6">
              <h3 className="font-bold text-white text-sm mb-4">Explore {track.artist}</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0" style={{ scrollbarWidth: 'none' }}>
                {[
                  { title: `Songs by ${track.artist}` },
                  { title: `Similar to ${track.artist}` },
                  { title: `Similar to ${track.title}` }
                ].map((item, idx) => (
                  <div key={idx} className="flex-shrink-0 w-36 h-48 rounded-xl overflow-hidden relative group cursor-pointer">
                    <img src={artworkUrl} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80"></div>
                    <div className="absolute inset-0 p-3 flex items-end">
                      <span className="text-white font-bold text-sm leading-tight">{item.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Credits Card */}
            <div className="bg-neutral-900 rounded-2xl p-5 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm">Credits</h3>
                <button className="text-xs font-bold text-white/80 hover:text-white hover:underline">Show all</button>
              </div>
              
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{track.artist}</p>
                    <p className="text-sm text-white/60">Main Artist • Composer</p>
                  </div>
                  <button className="px-4 py-1.5 rounded-full border border-white/30 text-white text-xs font-bold hover:border-white transition-colors">
                    Follow
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">Studio Producer</p>
                    <p className="text-sm text-white/60">Producer</p>
                  </div>
                  <button className="px-4 py-1.5 rounded-full border border-white/30 text-white text-xs font-bold hover:border-white transition-colors">
                    Follow
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modals remain the same */}
        {showSleepTimerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-xs bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white space-y-3">
              <h4 className="font-bold text-sm">Set Sleep Timer</h4>
              <div className="space-y-1">
                {[null, 5, 15, 30, 45, 60].map((mins) => (
                  <button
                    key={String(mins)}
                    onClick={() => {
                      setSleepTimer(mins);
                      setShowSleepTimerModal(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                      sleepTimerMinutes === mins
                        ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                        : 'hover:bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    {mins === null ? 'Turn Off Timer' : `${mins} minutes`}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowSleepTimerModal(false)}
                className="w-full py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {showSpeedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-xs bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white space-y-3">
              <h4 className="font-bold text-sm">Playback Speed</h4>
              <div className="space-y-1">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      setShowSpeedModal(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                      playbackRate === rate
                        ? 'bg-emerald-500/20 text-emerald-400 font-semibold'
                        : 'hover:bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    {rate}x {rate === 1.0 && '(Normal)'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowSpeedModal(false)}
                className="w-full py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <ContextMenu
          track={track}
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          onNavigate={onNavigate}
        />

        {/* Playlist Picker Modal */}
        {showPlaylistModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm pb-safe">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-2xl p-5 text-white flex flex-col max-h-[70vh]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Add to Playlist</h3>
                <button onClick={() => setShowPlaylistModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => {
                  setShowPlaylistModal(false);
                  setShowCreatePlaylistModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>New Playlist</span>
              </button>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                {playlists.map((pl) => {
                  const alreadyInPlaylist = pl.tracks.some((t) => t.id === track.id);
                  return (
                    <button
                      key={pl.id}
                      onClick={async () => {
                        await addTrackToPlaylist(pl.id, track);
                        setShowPlaylistModal(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/10 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-neutral-800 flex-shrink-0">
                          <PlaylistArtwork playlist={pl} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{pl.title}</p>
                          <p className="text-xs text-neutral-400 truncate">{pl.tracks.length} tracks</p>
                        </div>
                      </div>
                      {alreadyInPlaylist && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                    </button>
                  );
                })}
                {playlists.length === 0 && (
                  <div className="text-center py-8 text-neutral-400">
                    <ListMusic className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No playlists yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        <CreatePlaylistModal 
          isOpen={showCreatePlaylistModal} 
          onClose={() => setShowCreatePlaylistModal(false)} 
        />
      </motion.div>
    </AnimatePresence>
  );
};

