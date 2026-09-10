import React, { useState, useEffect, useMemo } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { usePlayerProgressStore } from '../../store/playerProgressStore';
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
  VolumeX, MonitorSpeaker, Share2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { extractColorsFromImage } from '../../utils/colorExtractor';

export const TabletRightPlayer: React.FC = () => {
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
    isLoading,
    lyricsData,
    fetchLyrics,
  } = usePlayer();
  
  const { position, duration } = usePlayerProgressStore();
  useEffect(() => {
    if (track?.id && (!lyricsData || lyricsData.trackId !== track.id)) {
      fetchLyrics(track.id, track.title, track.artist, track.duration);
    }
  }, [track?.id, lyricsData?.trackId, fetchLyrics]);

  const { isTrackLiked, toggleLikeTrack } = useUser();

  const isSeekingRef = React.useRef(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPos, setSeekPos] = useState(0);
  const [dominantColor, setDominantColor] = useState<string>('#121212');

  useEffect(() => {
    if (track?.images?.large || track?.images?.medium) {
      extractColorsFromImage(track.images.large || track.images.medium || '').then(colors => {
        if (colors) {
          setDominantColor(colors.primary || '#121212');
        }
      });
    }
  }, [track?.id]);

  const isUnsynced = lyricsData?.lines?.length && lyricsData.lines[0].time === -1;
  const activeLyricIndex = (lyricsData?.lines && !isUnsynced) 
    ? lyricsData.lines.findIndex((line, idx, arr) => {
        const nextLine = arr[idx + 1];
        // Ensure that position allows us to reach line 0 even before its formal start time if we are close to it
        if (idx === 0 && position < line.time) return true;
        return position >= line.time && (!nextLine || position < nextLine.time);
      })
    : -1;
  const displayIndex = activeLyricIndex >= 0 ? activeLyricIndex : 0;

  const fallbackLyricsLines = useMemo(() => {
    if (track?.lyrics) {
      return track.lyrics.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    }
    if (lyricsData?.plainLyrics) {
      return lyricsData.plainLyrics.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    }
    return [];
  }, [track?.lyrics, lyricsData?.plainLyrics]);

  if (!track) return null;

  const hasSyncedLines = lyricsData?.lines && lyricsData.lines.length > 0;
  const displayLinesToRender = hasSyncedLines 
    ? lyricsData.lines.slice(Math.max(0, displayIndex), Math.max(0, displayIndex) + 4) 
    : fallbackLyricsLines.slice(0, 4).map(text => ({ text, time: 0 }));



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
    setSeekPos(val);
  };

  const handleSeekEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (isSeekingRef.current) {
      seek(seekPos);
      isSeekingRef.current = false;
      // Slight delay to allow audio to update before resetting visual seek state
      setTimeout(() => {
        setIsSeeking(false);
      }, 100);
    }
  };

  return (
    <aside 
      className="hidden md:flex flex-col md:w-[50vw] lg:w-[450px] h-full flex-shrink-0 z-30 p-4 pt-6 overflow-y-auto pb-24 scrollbar-hide transition-colors duration-1000 ease-in-out relative"
      style={{
        background: dominantColor !== '#121212' ? `linear-gradient(to bottom, ${dominantColor} 0%, #121212 60%)` : '#121212'
      }}
    >
      <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsFullscreenOpen(true)}
            className="text-neutral-400 hover:text-white transition-colors"
            title="Fullscreen Player"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                <path d="M5.5 5.5v13h13v-13h-13zM4 4h16v16H4V4z"></path>
                <path d="M9 13.5l4-3v6l-4-3z"></path>
              </svg>
            </div>
          </button>
          
          <button 
            className="text-neutral-400 hover:text-white transition-colors"
            title="Close"
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
                <path d="M4.93 7.93a1 1 0 0 1 1.41 0L12 13.59l5.66-5.66a1 1 0 1 1 1.41 1.41l-6.36 6.37a1 1 0 0 1-1.42 0L4.93 9.34a1 1 0 0 1 0-1.41z"></path>
              </svg>
            </div>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center text-center flex-1 mx-2">
          <h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">{track.album ? 'Playing from Album' : 'Now Playing'}</h2>
          <h3 className="text-sm font-bold text-white truncate hover:underline cursor-pointer">{track.album || track.artist}</h3>
        </div>

        <button 
          className="text-neutral-400 hover:text-white transition-colors"
          title="More options"
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
              <path d="M4.5 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm7.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm7.5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"></path>
            </svg>
          </div>
        </button>
      </div>

      <div className="flex flex-col h-full gap-4">
        {/* Artwork */}
        <div className="w-full aspect-[4/5] lg:aspect-square rounded-xl overflow-hidden shadow-2xl relative group bg-neutral-800 border border-white/10">
          <img
            src={track.images?.large || track.images?.medium || track.images?.small || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80'}
            alt={track.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {isPlaying && (
            <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md flex items-end space-x-[2px] h-5 opacity-90">
              <div className="eq-bar w-[2px] bg-emerald-400 h-2" />
              <div className="eq-bar w-[2px] bg-emerald-400 h-3" />
              <div className="eq-bar w-[2px] bg-emerald-400 h-1.5" />
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-white truncate hover:underline cursor-pointer tracking-tight">
              {track.title}
            </h1>
            <p className="text-base lg:text-lg text-white/70 truncate hover:underline cursor-pointer mt-0.5 font-medium">
              {track.artist}
            </p>
          </div>
          <button
            onClick={() => toggleLikeTrack(track)}
            className="p-2 flex-shrink-0"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500 text-black">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                <path d="M10.814.5a1.658 1.658 0 0 1 2.372 0l2.512 2.572 3.595-.043a1.658 1.658 0 0 1 1.678 1.678l-.043 3.595 2.572 2.512c.667.65.667 1.722 0 2.372l-2.572 2.512.043 3.595a1.658 1.658 0 0 1-1.678 1.678l-3.595-.043-2.512 2.572a1.658 1.658 0 0 1-2.372 0l-2.512-2.572-3.595.043a1.658 1.658 0 0 1-1.678-1.678l.043-3.595L.5 13.186a1.658 1.658 0 0 1 0-2.372l2.572-2.512-.043-3.595a1.658 1.658 0 0 1 1.678-1.678l3.595.043L10.814.5zm6.584 9.12a1 1 0 0 0-1.414-1.413l-6.011 6.01-1.894-1.893a1 1 0 0 0-1.414 1.414l2.6 2.6a1 1 0 0 0 1.415 0l6.718-6.718z"></path>
              </svg>
            </div>
          </button>
        </div>

        {/* Seek Bar */}
        <div className="w-full space-y-1.5 group mt-2">
          <div className="relative h-1.5 flex items-center w-full">
            <input
              type="range"
              min={0}
              max={safeDuration || 100}
              value={currentPos}
              onMouseDown={handleSeekStart}
              onTouchStart={handleSeekStart}
              onChange={handleSeekChange}
              onMouseUp={handleSeekEnd}
              onTouchEnd={handleSeekEnd}
              className="absolute z-20 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="absolute z-0 w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white group-hover:bg-emerald-400 transition-colors"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div
              className="absolute z-10 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform pointer-events-none"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-medium text-neutral-400 tabular-nums">
            <span>{formatTime(currentPos)}</span>
            <span>{formatTime(safeDuration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between w-full px-1">
          <button
            onClick={toggleShuffle}
            className={`p-2 transition-colors ${shuffleEnabled ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'}`}
          >
            <Shuffle className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-6">
            <button
              onClick={previousTrack}
              className="p-2 text-neutral-300 hover:text-white transition-colors"
            >
              <SkipBack className="w-8 h-8 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current translate-x-[2px]" />
              )}
            </button>
            <button
              onClick={nextTrack}
              className="p-2 text-neutral-300 hover:text-white transition-colors"
            >
              <SkipForward className="w-8 h-8 fill-current" />
            </button>
          </div>
          <button
            onClick={toggleRepeat}
            className={`p-2 transition-colors ${repeatMode !== 'off' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Device, Share, Queue */}
        <div className="flex items-center justify-between w-full px-1 mt-1">
          <button className="text-neutral-400 hover:text-white transition-colors">
            <MonitorSpeaker className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-6">
            <button className="text-neutral-400 hover:text-white transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="text-neutral-400 hover:text-white transition-colors">
              <ListMusic className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-2 w-full">
          <div className="rounded-2xl p-6 flex flex-col h-auto min-h-[300px] cursor-pointer transition-colors border border-white/5 relative overflow-hidden"
            style={{ backgroundColor: dominantColor !== '#121212' ? dominantColor : '#7e123c' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-lg">Lyrics preview</h3>
              <button className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                <Maximize2 className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <div className="space-y-4 flex-1 min-h-[140px] flex flex-col justify-center">
              {displayLinesToRender.length > 0 ? (
                <div className="flex flex-col h-full space-y-4">
                  {displayLinesToRender.map((line, i) => {
                    const isActive = i === 0 && (hasSyncedLines ? !isUnsynced : true);
                    return (
                      <p 
                        key={`lyric-${displayIndex + i}`} 
                        className={`text-2xl lg:text-3xl font-extrabold leading-tight transition-all duration-300 ${isActive ? 'text-white scale-105 origin-left mb-4' : 'text-white/50 mb-3'}`}
                      >
                        {line.text || '♪'}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col flex-1 space-y-4 justify-start mt-2">
                  <p className="text-3xl font-extrabold text-white leading-tight mb-4">{track.title}</p>
                  <p className="text-3xl font-extrabold text-white/50 leading-tight mb-4">Enjoy the music!</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-start">
              <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform">
                Show lyrics
              </button>
            </div>
          </div>
          
          <div className="bg-[#2b2b2b] rounded-xl flex flex-col h-auto cursor-pointer hover:bg-[#333333] transition-colors border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 z-20">
                <button className="px-3 py-1 rounded-full bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-sm border border-white/10">
                  <span className="text-white text-[11px] font-bold">Follow</span>
                </button>
             </div>
             
             <div className="w-full aspect-[16/9] bg-neutral-800 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-[#2b2b2b] via-transparent to-black/20 z-10"></div>
               <h3 className="absolute top-4 left-4 font-bold text-white z-10 text-sm">About the artist</h3>
               <img src={track.images?.large || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Artist" />
             </div>
             
             <div className="p-4 pt-1 z-20">
               <p className="font-bold text-white text-lg">{track.artist}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
    </aside>
  );
};
