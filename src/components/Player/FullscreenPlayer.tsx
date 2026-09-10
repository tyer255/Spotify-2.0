import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayer } from '../../context/PlayerContext';
import { usePlayerProgressStore } from '../../store/playerProgressStore';
import { useUser } from '../../context/UserContext';
import { useShare } from '../../context/ShareContext';
import { ViewState } from '../../types';
import {
  ChevronDown,
  MoreVertical,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Clock,
  Repeat,
  Repeat1,
  Share2,
  ListMusic,
  Plus,
  Check,
  CheckCircle,
  Heart,
  X,
  Laptop2,
  Video,
  Image as ImageIcon,
  Sparkle,
} from 'lucide-react';
import { ContextMenu } from '../Common/ContextMenu';
import { PlaylistArtwork } from '../Common/PlaylistArtwork';
import { CreatePlaylistModal } from '../Common/CreatePlaylistModal';
import { api } from '../../services/apiClient';
import { CanvasBackground } from './CanvasBackground';

interface FullscreenPlayerProps {
  onNavigate?: (view: ViewState) => void;
}

export const FullscreenPlayer: React.FC<FullscreenPlayerProps> = ({ onNavigate }) => {
  const {
    track,
    isPlaying,
    volume,
    isMuted,
    playbackRate,
    repeatMode,
    shuffleEnabled,
    isLoading,
    togglePlay,
    playTrack,
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
    setIsAmbientModeOpen,
    sleepTimerMinutes,
    setSleepTimer,
    lyricsData,
    fetchLyrics,
  } = usePlayer();
  const { position, duration, activeLyricIndex } = usePlayerProgressStore();

  const { isTrackLiked, toggleLikeTrack, playlists, addTrackToPlaylist, showToast } = useUser();
  const { openShare } = useShare();
  const [showMenu, setShowMenu] = useState(false);
  const [showSleepTimerModal, setShowSleepTimerModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [showArtworkInCanvas, setShowArtworkInCanvas] = useState(false);

  // Immediately clear Canvas visual status when track changes
  useEffect(() => {
    setIsCanvasReady(false);
    setShowArtworkInCanvas(false);
  }, [track?.id]);

  const [artistImage, setArtistImage] = useState<string | null>(null);
  const [exploreTracks, setExploreTracks] = useState<any[]>([]);

  useEffect(() => {
    if (!track?.artist) return;
    
    let isMounted = true;
    const fetchArtistInfo = async () => {
      try {
        let artistData = null;
        let exploreData: any[] = [];
        
        // 1. Try fetching exact artist profile if artistId is available
        if (track.artistId && track.artistId.trim() !== '') {
          const primaryArtistId = track.artistId.split(',')[0].trim();
          // use direct fetch to avoid global apiClient search aborts
          const res = await fetch(`/api/artist/${primaryArtistId}`).then(r => r.json()).catch(() => null);
          if (res?.success && res?.data) {
            artistData = res.data;
            exploreData = res.data.topTracks || [];
          }
        }
        
        // 2. Fallback: Search by artist name if ID fetch failed or missing
        if (!artistData) {
          const query = track.artist.split(',')[0].trim();
          // Use direct fetch so we don't conflict with apiClient's activeSearchController
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`).then(r => r.json()).catch(() => null);
          
          if (res?.success && res?.data) {
            if (res.data.artists?.length > 0) {
              artistData = res.data.artists[0];
              exploreData = res.data.artists[0].topTracks || res.data.songs || [];
            } else if (res.data.topResult && res.data.topResult.type === 'artist') {
              artistData = res.data.topResult;
              exploreData = res.data.topResult.topTracks || res.data.songs || [];
            } else {
              exploreData = res.data.songs || [];
            }
          }
        }

        if (!isMounted) return;
        
        if (artistData) {
          setArtistImage(artistData.image || artistData.thumbnail || null);
        } else {
          setArtistImage(null);
        }
        
        if (exploreData?.length > 0) {
          // Filter out the currently playing track and take the top 5
          setExploreTracks(exploreData.filter((s: any) => s.id !== track.id).slice(0, 5));
        } else {
          setExploreTracks([]);
        }
      } catch (err) {
        console.warn('Failed to fetch artist info', err);
        if (isMounted) {
          setArtistImage(null);
          setExploreTracks([]);
        }
      }
    };
    
    fetchArtistInfo();
    return () => { isMounted = false; };
  }, [track?.artist, track?.id]);

  
  const isSeekingRef = useRef(false);
  const seekPosRef = useRef(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPos, setSeekPos] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch lyrics when fullscreen player is open if not loaded yet
  useEffect(() => {
    if (isFullscreenOpen && track?.id && (!lyricsData || lyricsData.trackId !== track.id)) {
      fetchLyrics(track.id, track.title, track.artist, track.duration);
    }
  }, [isFullscreenOpen, track?.id, lyricsData?.trackId, fetchLyrics]);

  // Parse lyrics lines for preview card (uses high-precision synced lyrics from PlayerContext)
  const lyricsLines = useMemo(() => {
    if (lyricsData && lyricsData.lines && lyricsData.lines.length > 0) {
      if (lyricsData.synced && activeLyricIndex >= 0) {
        const start = Math.max(0, activeLyricIndex);
        return lyricsData.lines.slice(start, start + 3).map((l) => l.text);
      }
      return lyricsData.lines.slice(0, 3).map((l) => l.text);
    }
    if (track?.lyrics) {
      const lines = track.lyrics.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      return lines.slice(0, 3);
    }
    return ["Music playing...", "Enjoy the rhythm", "Feel the beat"];
  }, [lyricsData, activeLyricIndex, track?.lyrics]);

  // Current active lyric snippet directly under album artwork (synced to audio timeline)
  const activeLyricSnippet = useMemo(() => {
    if (lyricsData && lyricsData.lines && lyricsData.lines.length > 0) {
      if (lyricsData.synced && activeLyricIndex >= 0 && activeLyricIndex < lyricsData.lines.length) {
        return lyricsData.lines[activeLyricIndex].text;
      }
      if (!lyricsData.synced) {
        return lyricsData.lines[0]?.text || null;
      }
      return lyricsData.lines[0]?.text || null;
    }
    if (track?.lyrics) {
      const lines = track.lyrics.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      return lines[0] || null;
    }
    return null;
  }, [lyricsData, activeLyricIndex, track?.lyrics]);

  if (!isFullscreenOpen || !track) return null;

  const isLiked = isTrackLiked(track.id);

  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const safeDuration = duration > 0 && isFinite(duration) ? duration : (track?.duration && track.duration > 0 ? track.duration : 210);
  const currentDisplayTime = isSeeking ? seekPos : (typeof position === 'number' && !isNaN(position) ? position : 0);
  const progressPercent = safeDuration > 0 ? Math.min(100, Math.max(0, (currentDisplayTime / safeDuration) * 100)) : 0;

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 100);
  };

  const handleShare = async () => {
    openShare(track);
  };

  const dominantColor = track.color || '#1DB954';
  const artworkUrl = 
    track.images?.large || 
    track.images?.medium || 
    track.images?.small || 
    (track as any).artworkUrl || 
    (track as any).coverUrl || 
    (track as any).image || 
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&auto=format&fit=crop&q=80';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="fixed inset-0 z-50 flex flex-col text-white select-none overflow-hidden bg-[#080808] will-change-transform transform-gpu"
      >
        <div className="absolute inset-0 z-0 transition-opacity duration-300 opacity-100">
          <CanvasBackground track={track} dominantColor={dominantColor} onVideoReady={setIsCanvasReady} isArtworkVisible={showArtworkInCanvas} />
        </div>

        {/* Sticky Mini Player / Header (When scrolled down) */}
        <div 
          className={`absolute top-0 left-0 right-0 z-50 px-4 pt-safe pb-3 flex items-center justify-between transition-all duration-300 ${
            isScrolled ? 'bg-neutral-900/90 backdrop-blur-lg shadow-lg opacity-100 translate-y-0' : 'bg-transparent opacity-0 -translate-y-full pointer-events-none'
          }`}
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setIsFullscreenOpen(false)}
              className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full"
              aria-label="Close fullscreen player"
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
              onClick={() => {
                toggleLikeTrack(track);
                showToast(isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs');
              }}
              className="p-1.5 hover:scale-105 transition-transform cursor-pointer"
              aria-label={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
              title={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
            >
              <Heart className={`w-6 h-6 transition-all ${isLiked ? 'text-red-500 fill-red-500 scale-105' : 'text-neutral-300 hover:text-white'}`} />
            </button>
            <button onClick={togglePlay} className="p-1" aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause className="w-5 h-5 fill-white text-white" /> : <Play className="w-5 h-5 fill-white text-white" />}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto w-full relative z-10"
        >
          <div className="px-4 sm:px-6 pb-8 w-full max-w-md mx-auto flex flex-col justify-between min-h-full" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
            
            <div>
              {/* Top Navbar */}
              <div className={`flex items-center justify-between w-full mb-4 transition-opacity duration-300 ${isScrolled ? 'opacity-0' : 'opacity-100'}`}>
                <button
                  onClick={() => setIsFullscreenOpen(false)}
                  className="p-2 -ml-2 rounded-full hover:bg-black/20 text-white transition-colors"
                  aria-label="Minimize player"
                >
                  <ChevronDown className="w-7 h-7" />
                </button>

                <div className="text-center px-2">
                  <span className="text-[11px] sm:text-xs tracking-wider text-white/80 font-semibold block uppercase mb-0.5">
                    Playing from {track.album ? 'Album' : 'Playlist'}
                  </span>
                  <h4
                    onClick={() => {
                      if (onNavigate) {
                        setIsFullscreenOpen(false);
                        onNavigate({ type: 'album', albumId: track.albumId });
                      }
                    }}
                    className="text-xs sm:text-sm font-bold text-white truncate max-w-[220px] hover:underline cursor-pointer"
                  >
                    {track.album || 'Current Queue'}
                  </h4>
                </div>

                <div className="flex items-center gap-1 -mr-2">
                  <button
                    id="fullscreen-ambient-mode-btn"
                    onClick={() => {
                      setIsFullscreenOpen(false);
                      setIsAmbientModeOpen(true);
                    }}
                    className="p-2 rounded-full hover:bg-black/20 text-white/70 hover:text-white transition-colors"
                    title="Ambient Mode (Always-on / Standby)"
                    aria-label="Ambient Mode"
                  >
                    <Sparkle className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                  </button>
                  {isCanvasReady && (
                    <button
                      onClick={() => setShowArtworkInCanvas(!showArtworkInCanvas)}
                      className="p-2 rounded-full hover:bg-black/20 text-white transition-colors"
                      aria-label={showArtworkInCanvas ? "Show Canvas" : "Show Artwork"}
                    >
                      {showArtworkInCanvas ? <Video className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                    </button>
                  )}
                  <button
                    onClick={() => setShowMenu(true)}
                    className="p-2 rounded-full hover:bg-black/20 text-white transition-colors"
                    aria-label="More options"
                  >
                    <MoreVertical className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Large Artwork (Visible only when Canvas is not active or not yet ready) */}
              <AnimatePresence>
                {(!isCanvasReady || showArtworkInCanvas) && (
                  <motion.div 
                    id="fullscreen-artwork-container"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="w-full aspect-square rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)] transform-gpu mb-4"
                  >
                    <img
                      src={artworkUrl || undefined}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dynamic breathing spacer when Canvas Video is playing full-screen */}
              {(isCanvasReady && !showArtworkInCanvas) && (
                <div 
                  id="canvas-active-spacer"
                  className="w-full flex-1 min-h-[40vh] sm:min-h-[50vh] transition-all pointer-events-none"
                />
              )}

              {/* Active Lyric Line Snippet (Between artwork and title, as in Spotiz) */}
              {activeLyricSnippet && (
                <div 
                  onClick={() => setIsLyricsOpen(true)}
                  className="mb-4 cursor-pointer group"
                >
                  <p className="text-base sm:text-lg font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                    {activeLyricSnippet}
                  </p>
                </div>
              )}

              {/* Track Info Row: Title & Artist on Left, Single (+) / (✓) Button on Right */}
              <div className="flex items-center justify-between mb-4">
                <div className="min-w-0 flex-1 pr-4">
                  <h2 className="text-2xl sm:text-3xl font-extrabold truncate text-white mb-0.5 tracking-tight">
                    {track.title}
                  </h2>
                  <p className="text-base sm:text-lg text-white/70 font-medium truncate flex items-center gap-1">
                    {track.artist.split(/,\s*|\s*&\s*|\s*\|\s*/).map((artistName, i, arr) => (
                      <React.Fragment key={i}>
                        <span
                          onClick={() => {
                            if (onNavigate) {
                              setIsFullscreenOpen(false);
                              onNavigate({ 
                                type: 'artist', 
                                artistId: track.artistId,
                                expectedName: artistName
                              });
                            }
                          }}
                          className="hover:text-white hover:underline cursor-pointer"
                        >
                          {artistName}
                        </span>
                        {i < arr.length - 1 && <span className="text-neutral-500">, </span>}
                      </React.Fragment>
                    ))}
                  </p>
                </div>

                {/* Spotiz Heart Like Button */}
                <div className="flex items-center flex-shrink-0">
                  <button
                    onClick={() => {
                      toggleLikeTrack(track);
                      showToast(isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs');
                    }}
                    className="p-1.5 rounded-full hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                    aria-label={isLiked ? "Saved to Liked Songs" : "Save to Liked Songs"}
                    title={isLiked ? "Saved to Liked Songs (Click to remove)" : "Save to Liked Songs"}
                  >
                    <Heart className={`w-7 h-7 transition-all ${isLiked ? 'text-red-500 fill-red-500 scale-105' : 'text-neutral-300 hover:text-white'}`} />
                  </button>
                </div>
              </div>

              {/* Progress Bar & Timestamps (Played portion solid white, remaining portion visible white/gray line) */}
              <div className="space-y-1.5 mb-4">
                <div className="relative w-full flex items-center h-4 group cursor-pointer select-none">
                  {/* Background Track (Visible remaining / unplayed portion as a crisp white line with opacity) */}
                  <div className="absolute inset-x-0 h-1 bg-white/30 rounded-full group-hover:h-1.5 transition-all overflow-hidden">
                    {/* Played Progress Track (Solid White) */}
                    <div 
                      className="h-full bg-white rounded-full transition-[transform] duration-75 ease-out" 
                      style={{ transform: `scaleX(${Math.min(100, Math.max(0, progressPercent)) / 100})`, transformOrigin: 'left' }} 
                    />
                  </div>
                  
                  {/* Scrubber Thumb Knob */}
                  <div 
                    className="absolute w-3 h-3 bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.5)] -translate-x-1/2 pointer-events-none transition-transform group-hover:scale-125"
                    style={{ left: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                  />

                  {/* Transparent Input Range for touch & mouse scrubbing */}
                  <input
                    id="fullscreen-player-seek-slider"
                    type="range"
                    min={0}
                    max={safeDuration}
                    step={0.1}
                    value={Math.min(safeDuration, Math.max(0, typeof currentDisplayTime === 'number' && !Number.isNaN(currentDisplayTime) ? currentDisplayTime : 0))}
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
                    aria-label="Track progress"
                  />
                </div>

                {/* Timestamps */}
                <div className="flex items-center justify-between text-[11px] font-medium text-white/70">
                  <span>{formatTime(currentDisplayTime)}</span>
                  <span>{formatTime(safeDuration)}</span>
                </div>
              </div>

              {/* Main Playback Controls (Shuffle, Prev, Play/Pause, Next, Timer) */}
              <div className="flex items-center justify-between mb-8">
                {/* 1. Shuffle */}
                <button
                  onClick={toggleShuffle}
                  className={`relative p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors ${
                    shuffleEnabled ? 'text-emerald-500' : 'text-white/80 hover:text-white'
                  }`}
                  aria-label="Shuffle"
                >
                  <Shuffle className="w-6 h-6" />
                  {shuffleEnabled && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />
                  )}
                </button>

                {/* 2. Previous */}
                <button
                  onClick={previousTrack}
                  className="p-2 rounded-full text-white hover:bg-white/10 transition-all active:scale-90"
                  aria-label="Previous track"
                >
                  <SkipBack className="w-8 h-8 fill-current" />
                </button>

                {/* 3. Play / Pause */}
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

                {/* 4. Next */}
                <button
                  onClick={nextTrack}
                  className="p-2 rounded-full text-white hover:bg-white/10 transition-all active:scale-90"
                  aria-label="Next track"
                >
                  <SkipForward className="w-8 h-8 fill-current" />
                </button>

                {/* 5. Repeat */}
                <button
                  onClick={toggleRepeat}
                  className={`relative p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors ${
                    repeatMode !== 'off' ? 'text-emerald-500' : 'text-white/80 hover:text-white'
                  }`}
                  aria-label="Repeat"
                  title={repeatMode === 'one' ? 'Repeat One' : repeatMode === 'all' ? 'Repeat All' : 'Enable Repeat'}
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-6 h-6" /> : <Repeat className="w-6 h-6" />}
                  {repeatMode !== 'off' && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full" />
                  )}
                </button>
              </div>

              {/* Bottom Action Bar (Connect Device on Left, Share & Queue on Right) */}
              <div className="flex items-center justify-between mb-4 px-1">
                {/* Connect to Device (Spotiz Connect) */}
                <button
                  onClick={() => setShowDeviceModal(true)}
                  className="flex items-center gap-2 text-white/80 hover:text-white transition-colors p-1.5 -ml-1.5 rounded-lg hover:bg-white/5"
                  title="Connect to a device"
                  aria-label="Connect to a device"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                    <rect x="2" y="6" width="14" height="11" rx="2" />
                    <path d="M6 17v2m4-2v2m-6 2h8" />
                    <rect x="15" y="10" width="7" height="9" rx="1.5" />
                    <path d="M18.5 17h.01" />
                  </svg>
                  <span className="text-xs font-semibold text-emerald-400 hidden sm:inline">This Device</span>
                </button>

                {/* Right: Share & Queue */}
                <div className="flex items-center gap-4">
                  {/* Share button */}
                  <button
                    onClick={handleShare}
                    className="p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
                    aria-label="Share song"
                    title="Share"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>

                  {/* Queue button */}
                  <button
                    onClick={() => setIsQueueOpen(true)}
                    className="p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
                    aria-label="Queue"
                    title="Queue"
                  >
                    <ListMusic className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Lyrics Preview Card (Matching Spotiz Red screenshot) */}
              <div 
                onClick={() => setIsLyricsOpen(true)}
                className="rounded-2xl p-5 mb-4 cursor-pointer hover:brightness-110 active:scale-[0.99] transition-all relative overflow-hidden group shadow-lg"
                style={{ backgroundColor: `${dominantColor}45` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-white text-sm tracking-tight">Lyrics preview</h3>
                  <span className="text-xs font-bold text-white/80 group-hover:text-white group-hover:underline">
                    More
                  </span>
                </div>
                <div className="space-y-2 text-xl sm:text-2xl font-bold text-white leading-snug">
                  {lyricsLines.map((line: string, i: number) => (
                    <p 
                      key={i} 
                      className={i === 0 ? 'text-white' : i === 1 ? 'text-white/80' : 'text-white/40'}
                    >
                      {line}
                    </p>
                  ))}
                </div>
                <div className="mt-5">
                  <span className="inline-block px-4 py-1.5 bg-white text-black text-xs sm:text-sm font-bold rounded-full shadow-md">
                    Show lyrics
                  </span>
                </div>
              </div>

              {/* About the Artist Card */}
              <div 
                onClick={() => {
                  if (onNavigate) {
                    setIsFullscreenOpen(false);
                    onNavigate({ 
                      type: 'artist', 
                      artistId: track.artistId,
                      expectedName: track.artist ? track.artist.split(',')[0].trim() : undefined
                    });
                  }
                }}
                className="bg-neutral-900 rounded-2xl overflow-hidden relative group cursor-pointer mb-4"
              >
                <div className="absolute inset-0">
                  {artistImage ? (
                    <img 
                      src={artistImage} 
                      alt={track.artist} 
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center opacity-60">
                      <svg viewBox="0 0 24 24" className="w-24 h-24 text-white/20 fill-current"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
                </div>
                <div className="relative z-10 p-5">
                  <h3 className="font-bold text-white text-sm mb-4">About the artist</h3>
                  <div className="mt-32">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
                      {track.artist ? track.artist.split(',')[0].trim() : ''}
                      <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-none stroke-current stroke-[3]"><path d="M20 6L9 17l-5-5"/></svg>
                      </span>
                    </h2>
                    <p className="text-white/80 text-sm mb-4">24.9M monthly listeners</p>
                    <p className="text-white/60 text-sm line-clamp-3">
                      {track.artist ? track.artist.split(',')[0].trim() : ''} is an acclaimed artist. Explore more of their music and discover similar tracks in their discography.
                    </p>
                  </div>
                </div>
              </div>

              {/* Explore Artist */}
              {exploreTracks.length > 0 && (
              <div className="bg-neutral-900 rounded-2xl p-5 mb-4">
                <h3 className="font-bold text-white text-sm mb-4">Explore {track.artist ? track.artist.split(',')[0].trim() : ''}</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0" style={{ scrollbarWidth: 'none' }}>
                  {exploreTracks.map((item, idx) => {
                    const itemArtwork = item.images?.large || item.images?.medium || item.images?.small || item.thumbnail || undefined;
                    return (
                    <div 
                      key={idx} 
                      onClick={() => playTrack(item, [item, ...exploreTracks.filter(t => t.id !== item.id)])}
                      className="flex-shrink-0 w-36 h-48 rounded-xl overflow-hidden relative group cursor-pointer"
                    >
                      <img src={itemArtwork} className="w-full h-full object-cover" alt={item.title} />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80"></div>
                      <div className="absolute inset-0 p-3 flex items-end">
                        <span className="text-white font-bold text-sm leading-tight line-clamp-3">{item.title}</span>
                      </div>
                    </div>
                  )})}
                </div>
              </div>
              )}

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
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Device Connect Modal (Spotiz Connect) */}
        {showDeviceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-xs bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-white space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">Connect to a device</h4>
                <button onClick={() => setShowDeviceModal(false)} className="p-1 hover:bg-white/10 rounded-full">
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-emerald-400">Current Web Device</p>
                    <p className="text-xs text-neutral-400">Listening on this speaker</p>
                  </div>
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800/60 opacity-60">
                  <Laptop2 className="w-5 h-5 text-neutral-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-300">AirPlay / Bluetooth</p>
                    <p className="text-xs text-neutral-500">Available via OS output</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDeviceModal(false)}
                className="w-full py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Sleep Timer Modal */}
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
                      showToast(mins ? `Sleep timer set for ${mins} minutes` : 'Sleep timer turned off');
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

        {/* Context Menu for More Options */}
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
