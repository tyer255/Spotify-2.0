import ReactPlayer from 'react-player';
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Track, RepeatMode, PlaybackState, LyricsData } from '../types';
import { api } from '../services/apiClient';
import { useUser } from './UserContext';
import { offlineStorage } from '../services/offlineStorage';
import { getAutoplayRecommendation } from '../utils/autoplayService';

import { usePlayerProgressStore } from '../store/playerProgressStore';

const ReactPlayerComponent = ReactPlayer as unknown as React.ComponentType<any>;

interface PlayerContextType extends PlaybackState {
  youtubeUrl: string | null;
  audioQuality: 'normal' | 'high' | 'very_high';
  setAudioQuality: (quality: 'normal' | 'high' | 'very_high') => void;
  crossfadeSeconds: number;
  setCrossfadeSeconds: (sec: number) => void;
  gapless: boolean;
  setGapless: (gapless: boolean) => void;
  normalizeVolume: boolean;
  setNormalizeVolume: (normalize: boolean) => void;
  canvasEnabled: boolean;
  setCanvasEnabled: (enabled: boolean) => void;
  dataSaver: boolean;
  setDataSaver: (enabled: boolean) => void;
  audioElement: HTMLAudioElement | null;
  analyserNode: AnalyserNode | null;
  sleepTimerMinutes: number | null;
  lyricsData: LyricsData | null;

  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  toggleShuffle: () => void;
  setShuffleEnabled: (enabled: boolean) => void;
  toggleRepeat: () => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  playQueueItem: (index: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  fetchLyrics: (trackId: string, title?: string, artist?: string, durationSec?: number) => Promise<void>;
  isFullscreenOpen: boolean;
  setIsFullscreenOpen: (open: boolean) => void;
  isLyricsOpen: boolean;
  setIsLyricsOpen: (open: boolean) => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
  isAmbientModeOpen: boolean;
  setIsAmbientModeOpen: (open: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, likedTrackIds, followedArtistIds, followedArtistsMap, addTrackToHistory, recordInteraction, isTrackHidden } = useUser();
  const [track, setTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [shuffleEnabled, setShuffleEnabled] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.85);

  const [audioQuality, setAudioQualityState] = useState<'normal' | 'high' | 'very_high'>(() => (localStorage.getItem('spotify_audio_quality') as any) || 'very_high');
  const [crossfadeSeconds, setCrossfadeSecondsState] = useState(() => parseInt(localStorage.getItem('spotify_crossfade') || '3', 10));
  const [gapless, setGaplessState] = useState(() => localStorage.getItem('spotify_gapless') !== 'false');
  const [normalizeVolume, setNormalizeVolumeState] = useState(() => localStorage.getItem('spotify_normalize_volume') !== 'false');
  const [canvasEnabled, setCanvasEnabledState] = useState(() => localStorage.getItem('spotify_canvas_enabled') !== 'false');
  const [dataSaver, setDataSaverState] = useState(() => localStorage.getItem('spotify_data_saver') === 'true');

  const setAudioQuality = (val: 'normal' | 'high' | 'very_high') => {
    setAudioQualityState(val);
    localStorage.setItem('spotify_audio_quality', val);
  };
  const setCrossfadeSeconds = (val: number) => {
    setCrossfadeSecondsState(val);
    localStorage.setItem('spotify_crossfade', val.toString());
  };
  const setGapless = (val: boolean) => {
    setGaplessState(val);
    localStorage.setItem('spotify_gapless', val.toString());
  };
  const setNormalizeVolume = (val: boolean) => {
    setNormalizeVolumeState(val);
    localStorage.setItem('spotify_normalize_volume', val.toString());
  };
  const setCanvasEnabled = (val: boolean) => {
    setCanvasEnabledState(val);
    localStorage.setItem('spotify_canvas_enabled', val.toString());
  };
  const setDataSaver = (val: boolean) => {
    setDataSaverState(val);
    localStorage.setItem('spotify_data_saver', val.toString());
  };
  
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRateState] = useState<number>(1.0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [history, setHistory] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const reactPlayerRef = useRef<any>(null);
  const youtubeUrlRef = useRef<string | null>(null);

  // Safe helper to extract internal YouTube player instance across ReactPlayer versions and DOM bindings
  const getSafeInternalPlayer = useCallback((refCurrent: any): any => {
    if (!refCurrent) return null;
    try {
      if (refCurrent.api) return refCurrent.api;
      if (typeof refCurrent.getInternalPlayer === 'function') {
        const p = refCurrent.getInternalPlayer();
        if (p) return p;
      }
      if (refCurrent.player) {
        if (refCurrent.player.api) return refCurrent.player.api;
        if (typeof refCurrent.player.getInternalPlayer === 'function') {
          const p = refCurrent.player.getInternalPlayer();
          if (p) return p;
        }
        if (refCurrent.player.player) {
          if (refCurrent.player.player.api) return refCurrent.player.player.api;
          if (typeof refCurrent.player.player.getInternalPlayer === 'function') {
            const p = refCurrent.player.player.getInternalPlayer();
            if (p) return p;
          }
        }
        if (typeof refCurrent.player.playVideo === 'function' || typeof refCurrent.player.play === 'function') {
          return refCurrent.player;
        }
      }
      if (typeof refCurrent.playVideo === 'function' || typeof refCurrent.play === 'function') {
        return refCurrent;
      }
    } catch (e) {
      return null;
    }
    return null;
  }, []);

  // Modals & Panels UI state
  const [isFullscreenOpen, setIsFullscreenOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isAmbientModeOpen, setIsAmbientModeOpen] = useState<boolean>(false);

  // Lyrics & Visualizer
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const lyricsDataRef = useRef<LyricsData | null>(null);
  useEffect(() => {
    lyricsDataRef.current = lyricsData;
  }, [lyricsData]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const sleepTimerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentTrackRef = useRef<Track | null>(null);
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  const shuffleEnabledRef = useRef<boolean>(shuffleEnabled);
  const queueRef = useRef<Track[]>(queue);
  const queueIndexRef = useRef<number>(queueIndex);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    shuffleEnabledRef.current = shuffleEnabled;
  }, [shuffleEnabled]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);

  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const playbackRateRef = useRef(playbackRate);
  playbackRateRef.current = playbackRate;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const playRequestIdRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);
  const activeBlobUrlRef = useRef<string | null>(null);

  // Fallback streaming management
  const fallbackStreamUrlsRef = useRef<string[]>([]);
  const fallbackIndexRef = useRef<number>(0);
  const playbackProgressConfirmedRef = useRef<boolean>(false);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mid-track progress tracking and stall auto-recovery
  const lastActiveProgressTimestampRef = useRef<number>(Date.now());
  const lastActiveProgressPositionRef = useRef<number>(0);

  // Dedicated seek protection locks
  const isSeekingActiveRef = useRef<boolean>(false);
  const nextTrackRef = useRef<() => void>(() => {});
  const seekTargetRef = useRef<number | null>(null);
  const lastSeekTimestampRef = useRef<number>(0);

  const handleTrackEndRef = useRef<() => void>(() => {});

  // Watchdog helper to clear active timer
  const clearWatchdog = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  }, []);

  // Universal Stream Failover & Fallback Switcher
  const handleStreamFallback = useCallback((reason: string) => {
    console.warn(`[PlaybackFallback] Triggered: ${reason}. Current fallback index: ${fallbackIndexRef.current}`);
    const fallbacks = fallbackStreamUrlsRef.current;
    
    // If the failure came from YouTube, we should skip all other YouTube fallbacks and jump straight to a direct audio stream.
    // If the failure came from direct audio, allow YouTube or other direct streams.
    const isYoutubeFailure = Boolean(youtubeUrlRef.current) && (reason.includes('YouTube') || reason.includes('ReactPlayer') || reason.includes('embed error'));
    
    lastActiveProgressTimestampRef.current = Date.now();
    lastActiveProgressPositionRef.current = 0;

    let nextIdx = fallbackIndexRef.current + 1;
    while (nextIdx < fallbacks.length) {
      const candidateUrl = fallbacks[nextIdx];
      
      if (candidateUrl) {
        const isYoutube = candidateUrl.startsWith('youtube:') || candidateUrl.includes('youtube.com/watch') || candidateUrl.includes('youtu.be/');
        
        if (isYoutubeFailure && isYoutube) {
          nextIdx++;
          continue;
        }

        fallbackIndexRef.current = nextIdx;
        
        if (isYoutube) {
          console.log(`[PlaybackFallback] Switching to alternate YouTube fallback (${nextIdx}/${fallbacks.length}): ${candidateUrl}`);
          const yUrl = candidateUrl.startsWith('youtube:') ? 'https://www.youtube.com/watch?v=' + candidateUrl.split(':')[1] : candidateUrl;
          setYoutubeUrl(yUrl);
          youtubeUrlRef.current = yUrl;
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
          }
          setIsPlaying(true);
          setIsLoading(true);
          if (currentTrackRef.current) {
            startPlaybackWatchdog(currentTrackRef.current.id, 1);
          }
          return true;
        } else {
          console.log(`[PlaybackFallback] Switching to direct audio stream fallback (${nextIdx}/${fallbacks.length}): ${candidateUrl}`);
          setYoutubeUrl(null);
          youtubeUrlRef.current = null;
          if (audioRef.current) {
            audioRef.current.preload = 'auto';
            audioRef.current.src = candidateUrl;
            audioRef.current.playbackRate = playbackRateRef.current || 1.0;
            audioRef.current.volume = isMuted ? 0 : volume;
            audioRef.current.load();
            setIsPlaying(true);
            setIsLoading(true);
            const p = audioRef.current.play();
            if (p !== undefined) {
              p.then(() => setIsLoading(false)).catch((err) => {
                console.warn('[PlaybackFallback] Play error on fallback:', err);
                if (err.name === 'NotAllowedError') {
                  const unlock = () => {
                    if (audioRef.current && currentTrackRef.current) {
                      audioRef.current.play().catch(() => {});
                    }
                    window.removeEventListener('pointerdown', unlock);
                    window.removeEventListener('keydown', unlock);
                  };
                  window.addEventListener('pointerdown', unlock, { once: true });
                  window.addEventListener('keydown', unlock, { once: true });
                }
              });
            }
          }
          if (currentTrackRef.current) {
            startPlaybackWatchdog(currentTrackRef.current.id, 1);
          }
          return true;
        }
      }
      nextIdx++;
    }

    // If no direct fallbacks left, try proxying the first non-YouTube fallback
    const firstNonYoutube = fallbacks.find(f => f && !f.startsWith('youtube:') && !f.includes('youtube.com/watch') && !f.includes('youtu.be/') && !f.includes('/api/playback/stream'));
    if (firstNonYoutube) {
      const proxied = `/api/playback/stream?url=${encodeURIComponent(firstNonYoutube)}`;
      console.log(`[PlaybackFallback] Attempting audio proxy failover: ${proxied}`);
      setYoutubeUrl(null);
      youtubeUrlRef.current = null;
      if (audioRef.current) {
        audioRef.current.preload = 'auto';
        audioRef.current.src = proxied;
        audioRef.current.load();
        setIsPlaying(true);
        setIsLoading(true);
        const p = audioRef.current.play();
        if (p !== undefined) {
          p.then(() => setIsLoading(false)).catch((err) => {
            console.warn('[PlaybackFallback] Play error on proxy fallback:', err);
            if (err.name === 'NotAllowedError') {
              const unlock = () => {
                if (audioRef.current && currentTrackRef.current) {
                  audioRef.current.play().catch(() => {});
                }
                window.removeEventListener('pointerdown', unlock);
                window.removeEventListener('keydown', unlock);
              };
              window.addEventListener('pointerdown', unlock, { once: true });
              window.addEventListener('keydown', unlock, { once: true });
            }
          });
        }
      }
      if (currentTrackRef.current) {
        startPlaybackWatchdog(currentTrackRef.current.id, 1);
      }
      return true;
    }

    return false;
  }, [isMuted, volume]);

  // Universal 0:00 Playback Watchdog (Real-time progression monitor & auto-recovery engine)
  const startPlaybackWatchdog = useCallback((targetTrackId: string, stage = 1) => {
    clearWatchdog();
    playbackProgressConfirmedRef.current = false;

    // Increased delays to allow CDN streams and YouTube more time to buffer on slower mobile networks
    const delay = stage === 1 ? 12000 : (stage === 2 ? 8000 : 5000);

    watchdogTimerRef.current = setTimeout(async () => {
      if (currentTrackRef.current?.id !== targetTrackId || !isPlayingRef.current) {
        return;
      }

      // Check current position across both YouTube and HTML5 Audio
      const audio = audioRef.current;
      const isYt = Boolean(youtubeUrlRef.current);
      let curPos = 0;
      if (isYt) {
        if (reactPlayerRef.current && typeof reactPlayerRef.current.getCurrentTime === 'function') {
          try {
            const ytTime = reactPlayerRef.current.getCurrentTime();
            if (typeof ytTime === 'number' && !isNaN(ytTime)) {
              curPos = Math.max(curPos, ytTime);
            }
          } catch (e) {}
        }
        curPos = Math.max(curPos, positionRef.current || 0);
      } else {
        curPos = audio?.currentTime || positionRef.current || 0;
      }

      if (curPos > 0.05) {
        playbackProgressConfirmedRef.current = true;
        clearWatchdog();
        console.log(`[PlayerContext:Watchdog] ✅ Track "${targetTrackId}" confirmed active playback progression at ${curPos.toFixed(2)}s.`);
        return;
      }

      console.warn(`[PlayerContext:Watchdog] ⚠️ 0:00 PLAYBACK STALL DETECTED for track "${targetTrackId}" (isYouTube=${isYt}, Stage=${stage}, readyState=${audio?.readyState}, networkState=${audio?.networkState}, paused=${audio?.paused}). Initiating stage ${stage} recovery...`);

      if (isYt) {
        // Stage 1: Attempt to kickstart internal YouTube player
        if (stage === 1) {
          const player = getSafeInternalPlayer(reactPlayerRef.current);
          if (player) {
            try {
              console.log('[PlayerContext:Watchdog] Re-invoking YouTube playVideo()...');
              if (typeof player.playVideo === 'function') player.playVideo();
              if (typeof player.seekTo === 'function') player.seekTo(0.1, true);
              if (typeof player.unMute === 'function' && !isMuted) player.unMute();
            } catch (e) {}
          }
          startPlaybackWatchdog(targetTrackId, 2);
          return;
        }

        // Stage 2: YouTube failed to progress, switch to alternate verified stream for this track
        console.log('[PlayerContext:Watchdog] YouTube playback failed to progress beyond 0:00. Switching to alternate fallback stream...');
        const recovered = handleStreamFallback('YouTube 0:00 stall');
        if (!recovered) {
          const cur = currentTrackRef.current;
          if (cur) {
            try {
              const freshRes = await api.resolvePlayback(cur.id, cur.title, cur.artist, cur.duration, {
                forceFresh: true,
                discardUrl: youtubeUrlRef.current || undefined,
              });
              if (freshRes && freshRes.success && freshRes.data?.stream?.url) {
                const freshUrl = freshRes.data.stream.url;
                if (freshUrl.startsWith('youtube:') || freshUrl.includes('youtube.com/watch') || freshUrl.includes('youtu.be/')) {
                  const yUrl = freshUrl.startsWith('youtube:') ? 'https://www.youtube.com/watch?v=' + freshUrl.split(':')[1] : freshUrl;
                  if (audioRef.current) {
                    try {
                      audioRef.current.pause();
                      audioRef.current.removeAttribute('src');
                      audioRef.current.load();
                    } catch (e) {}
                  }
                  setYoutubeUrl(yUrl);
                  youtubeUrlRef.current = yUrl;
                  fallbackStreamUrlsRef.current = freshRes.data.stream.fallbackUrls || [yUrl];
                  fallbackIndexRef.current = 0;
                  setIsPlaying(true);
                  setIsLoading(true);
                  startPlaybackWatchdog(cur.id, 1);
                  return;
                } else {
                  const ytPlayer = getSafeInternalPlayer(reactPlayerRef.current);
                  if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
                    try { ytPlayer.pauseVideo(); } catch (e) {}
                  }
                  setYoutubeUrl(null);
                  youtubeUrlRef.current = null;
                  if (audioRef.current) {
                    audioRef.current.preload = 'auto';
                    audioRef.current.src = freshUrl;
                    audioRef.current.load();
                    audioRef.current.play().catch(() => {});
                  }
                  setIsPlaying(true);
                  setIsLoading(true);
                  startPlaybackWatchdog(cur.id, 1);
                  return;
                }
              }
            } catch (resErr) {
              console.warn('[PlayerContext:Watchdog] Dynamic re-resolution error:', resErr);
            }
          }
          console.warn(`[PlayerContext:Watchdog] All stream recovery attempts completed for track "${targetTrackId}".`);
          setIsLoading(false);
          setIsPlaying(false);
        }
        return;
      }

      if (audio) {
        if (stage === 1) {
          // Stage 1: Restart stream buffer & re-issue play command
          console.log(`[PlayerContext:Watchdog] Stage 1 Recovery: Reloading stream buffer and restarting audio element for "${targetTrackId}"...`);
          try {
            audio.preload = 'auto';
            audio.load();
            const restartPromise = audio.play();
            if (restartPromise !== undefined) {
              restartPromise.catch((err) => {
                console.warn('[PlayerContext:Watchdog] Stage 1 restart play error:', err);
              });
            }
          } catch (restartErr) {
            console.warn('[PlayerContext:Watchdog] Stage 1 restart exception:', restartErr);
          }
          startPlaybackWatchdog(targetTrackId, 2);
        } else if (stage === 2) {
          // Stage 2: Failover to streaming backend proxy (bypasses CORS/SSL/range headers issues)
          if (audio.src && !audio.src.includes('/api/playback/stream') && !audio.src.startsWith('youtube:') && !audio.src.startsWith('data:')) {
            const proxiedUrl = `/api/playback/stream?url=${encodeURIComponent(audio.src)}`;
            console.log(`[PlayerContext:Watchdog] Stage 2 Recovery: Failover to streaming proxy ${proxiedUrl}`);
            audio.preload = 'auto';
            audio.src = proxiedUrl;
            audio.load();
            const p = audio.play();
            if (p !== undefined) p.catch(() => {});
            startPlaybackWatchdog(targetTrackId, 3);
          } else {
            // Already proxied or data url, proceed directly to stage 3
            startPlaybackWatchdog(targetTrackId, 3);
          }
        } else if (stage === 3) {
          // Stage 3: Cycle to next available fallback stream URL
          console.log(`[PlayerContext:Watchdog] Stage 3 Recovery: Switching to next fallback stream URL...`);
          const recovered = handleStreamFallback('Audio 0:00 persistent stall');
          if (!recovered) {
            // Stage 4: Attempt dynamic re-resolution discarding stalled URL
            const cur = currentTrackRef.current;
            if (cur) {
              console.log(`[PlayerContext:Watchdog] Stage 4 Recovery: Requesting fresh re-resolution for "${cur.title} - ${cur.artist}"...`);
              try {
                const freshRes = await api.resolvePlayback(cur.id, cur.title, cur.artist, cur.duration, {
                  forceFresh: true,
                  discardUrl: audio.src,
                });
                if (freshRes && freshRes.success && freshRes.data?.stream?.url) {
                  const freshUrl = freshRes.data.stream.url;
                  console.log(`[PlayerContext:Watchdog] Freshly re-resolved stream for "${cur.title}": ${freshUrl}`);
                  fallbackStreamUrlsRef.current = freshRes.data.stream.fallbackUrls || [freshUrl];
                  fallbackIndexRef.current = 0;
                  audio.preload = 'auto';
                  audio.src = freshUrl;
                  audio.load();
                  audio.play().catch(() => {});
                  startPlaybackWatchdog(cur.id, 1);
                  return;
                }
              } catch (resErr) {
                console.warn('[PlayerContext:Watchdog] Dynamic re-resolution error:', resErr);
              }
            }
            console.warn(`[PlayerContext:Watchdog] All recovery attempts exhausted for track "${targetTrackId}".`);
            setIsLoading(false);
            setIsPlaying(false);
          }
        }
      }
    }, delay);
  }, [clearWatchdog, handleStreamFallback]);

  // Helper for lyrics sync at any given position
  const syncLyricsPosition = useCallback((time: number) => {
    const lyrics = lyricsDataRef.current;
    if (lyrics && lyrics.synced && lyrics.lines && lyrics.lines.length > 0) {
      const targetTime = time + 0.12;
      let found = -1;
      for (let i = 0; i < lyrics.lines.length; i++) {
        const line = lyrics.lines[i];
        let lineTime = Number(line.time);
        if (isNaN(lineTime) && line.startTimeMs) {
          lineTime = Number(line.startTimeMs) / 1000;
        } else if (lineTime > 10000) {
          lineTime = lineTime / 1000;
        }
        if (targetTime >= lineTime) {
          found = i;
        } else {
          break;
        }
      }
      const currentActive = usePlayerProgressStore.getState().activeLyricIndex;
      if (currentActive !== found) {
        usePlayerProgressStore.getState().setActiveLyricIndex(found);
      }
    } else {
      usePlayerProgressStore.getState().setActiveLyricIndex(-1);
    }
  }, []);

  // MediaSession Action Handlers Ref (prevents stale closure issues when in background)
  const mediaHandlersRef = useRef<{
    play: () => void;
    pause: () => void;
    next: () => void;
    prev: () => void;
    seek: (sec: number) => void;
  }>({
    play: () => {},
    pause: () => {},
    next: () => {},
    prev: () => {},
    seek: () => {},
  });

  // Synchronize media session position state helper
  const syncMediaSessionPosition = useCallback(() => {
    if (
      'mediaSession' in navigator &&
      'setPositionState' in navigator.mediaSession &&
      durationRef.current > 0 &&
      !isNaN(durationRef.current) &&
      isFinite(durationRef.current)
    ) {
      try {
        const cur = youtubeUrlRef.current
          ? (positionRef.current || 0)
          : (audioRef.current?.currentTime || positionRef.current || 0);
        const clamped = Math.min(Math.max(cur, 0), durationRef.current);
        navigator.mediaSession.setPositionState({
          duration: Math.max(durationRef.current, 1),
          playbackRate: playbackRateRef.current || 1.0,
          position: clamped,
        });
      } catch (err) {
        // Ignored if browser rejects transient out-of-range value
      }
    }
  }, []);

  // Initialize HTML5 Audio instance with full background support
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (youtubeUrlRef.current) return;
      if (audio) {
        if (Date.now() - lastSeekTimestampRef.current < 200) {
          return;
        }
        // Guard against transient 0 resets immediately after seeking to a timestamp > 5s
        if (seekTargetRef.current !== null && seekTargetRef.current > 5 && audio.currentTime < 1) {
          return;
        }
        if (audio.currentTime > 0.05 && !playbackProgressConfirmedRef.current) {
          playbackProgressConfirmedRef.current = true;
          clearWatchdog();
        }
        usePlayerProgressStore.getState().setPosition(audio.currentTime);
        positionRef.current = audio.currentTime;
        if (audio.buffered.length > 0) {
          usePlayerProgressStore.getState().setBufferedPosition(audio.buffered.end(audio.buffered.length - 1));
        }
        syncLyricsPosition(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (youtubeUrlRef.current) return;
      if (audio) {
        const actualDur = audio.duration;
        const trackDur = currentTrackRef.current?.duration;
        console.log(`[PlayerContext:Preload] Metadata loaded for "${currentTrackRef.current?.title || 'Unknown'}": audio.duration=${actualDur}s, track.duration=${trackDur}s, readyState=${audio.readyState}`);
        if (actualDur >= 29 && actualDur <= 31 && trackDur && trackDur > 40) {
          usePlayerProgressStore.getState().setDuration(trackDur);
          durationRef.current = trackDur;
        } else if (actualDur && !isNaN(actualDur) && isFinite(actualDur) && actualDur > 5) {
          usePlayerProgressStore.getState().setDuration(actualDur);
          durationRef.current = actualDur;
        } else if (trackDur && trackDur > 5) {
          usePlayerProgressStore.getState().setDuration(trackDur);
          durationRef.current = trackDur;
        } else if (currentTrackRef.current?.duration && currentTrackRef.current.duration > 5) {
          usePlayerProgressStore.getState().setDuration(currentTrackRef.current.duration);
          durationRef.current = currentTrackRef.current.duration;
        } else if (audio.duration && !isNaN(audio.duration)) {
          usePlayerProgressStore.getState().setDuration(audio.duration);
          durationRef.current = audio.duration;
        }
        setIsLoading(false);
        syncMediaSessionPosition();
      }
    };

    const handleLoadedData = () => {
      if (youtubeUrlRef.current) return;
      if (audio) {
        console.log(`[PlayerContext:Preload] First audio frame loaded for "${currentTrackRef.current?.title || 'Unknown'}" (readyState=${audio.readyState}, networkState=${audio.networkState}).`);
      }
    };

    const handlePlay = () => {
      if (youtubeUrlRef.current) return;
      console.log(`[PlayerContext:State] Play event triggered for "${currentTrackRef.current?.title || 'Unknown'}".`);
      setIsPlaying(true);
      setIsLoading(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      syncMediaSessionPosition();
    };

    const handlePause = () => {
      if (isTransitioningRef.current) return;
      if (youtubeUrlRef.current) return;
      console.log(`[PlayerContext:State] Pause event triggered for "${currentTrackRef.current?.title || 'Unknown'}".`);
      setIsPlaying(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
      syncMediaSessionPosition();
    };

    let stallRecoveryTimer: any = null;
    const clearStallTimer = () => {
      if (stallRecoveryTimer) {
        clearTimeout(stallRecoveryTimer);
        stallRecoveryTimer = null;
      }
    };

    const handleWaiting = () => {
      if (youtubeUrlRef.current) return;
      console.warn(`[PlayerContext:Buffering] Audio waiting on data for "${currentTrackRef.current?.title || 'Unknown'}" (readyState=${audio?.readyState}, networkState=${audio?.networkState}).`);
      setIsLoading(true);
      clearStallTimer();
      stallRecoveryTimer = setTimeout(() => {
        if (isPlayingRef.current && audio && audio.paused && !isTransitioningRef.current) {
          console.warn('[PlayerContext:Buffering] Persistent buffering detected (>5s), kickstarting audio.play()...');
          audio.play().catch(() => {});
        }
      }, 5000);
    };

    const handleStalled = () => {
      if (youtubeUrlRef.current) return;
      console.warn(`[PlayerContext:Stalled] Audio stream stalled for "${currentTrackRef.current?.title || 'Unknown'}" (readyState=${audio?.readyState}, networkState=${audio?.networkState}).`);
      clearStallTimer();
      stallRecoveryTimer = setTimeout(() => {
        if (isPlayingRef.current && audio && !isTransitioningRef.current) {
          console.warn('[PlayerContext:Stalled] Audio stream stalled for >4s. Triggering fallback recovery...');
          handleStreamFallback('Audio stream stalled');
        }
      }, 4000);
    };

    const handlePlaying = () => {
      clearStallTimer();
      if (youtubeUrlRef.current) return;
      isTransitioningRef.current = false;
      setIsLoading(false);
      setIsPlaying(true);
      if (audio && audio.currentTime > 0.05) {
        playbackProgressConfirmedRef.current = true;
        clearWatchdog();
        lastActiveProgressTimestampRef.current = Date.now();
        lastActiveProgressPositionRef.current = audio.currentTime;
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      syncMediaSessionPosition();
    };

    const handleCanPlay = () => {
      clearStallTimer();
      if (youtubeUrlRef.current) return;
      console.log(`[PlayerContext:Preload] canplay event fired for "${currentTrackRef.current?.title || 'Unknown'}" (readyState=${audio?.readyState}).`);
      setIsLoading(false);
      if (isPlayingRef.current && audio && audio.paused && !isTransitioningRef.current) {
        audio.play().catch(() => {});
      }
    };

    const handleEnded = () => {
      clearStallTimer();
      // Toggle-logic check that explicitly listens for the 'ended' event
      if (youtubeUrlRef.current || audio?.src.startsWith('data:') || isTransitioningRef.current) {
        return; // Ignore if playing youtube, priming snippet ending, or track transition
      }
      // Detect premature end (e.g. truncated preview or cut CDN stream)
      if (durationRef.current > 45 && audio && audio.currentTime < durationRef.current - 20) {
        console.warn(`[PlayerContext] Audio ended prematurely at ${audio.currentTime.toFixed(1)}s (expected ${durationRef.current}s). Recovering with fallback stream...`);
        const recovered = handleStreamFallback('Audio ended prematurely');
        if (recovered) return;
      }
      if (repeatModeRef.current === 'one') {
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
        usePlayerProgressStore.getState().setPosition(0);
        positionRef.current = 0;
        syncLyricsPosition(0);
        return;
      }
      handleTrackEndRef.current();
    };

    const handleSeeked = () => {
      if (youtubeUrlRef.current) return;
      isSeekingActiveRef.current = false;
      setIsLoading(false);
      if (audio) {
        usePlayerProgressStore.getState().setPosition(audio.currentTime);
        syncMediaSessionPosition();
      }
    };

    const handleError = async (e: any) => {
      if (youtubeUrlRef.current) return;
      console.warn('[PlayerContext] Audio playback error encountered:', e);
      const fallbacks = fallbackStreamUrlsRef.current;
      const nextIndex = fallbackIndexRef.current + 1;
      if (fallbacks && nextIndex < fallbacks.length && audio) {
        fallbackIndexRef.current = nextIndex;
        const nextUrl = fallbacks[nextIndex];
        console.log(`[PlayerContext] Auto-recovering from error with fallback stream ${nextIndex}: ${nextUrl}`);
        if (nextUrl.startsWith('youtube:')) {
          clearWatchdog();
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
          const yUrl = 'https://www.youtube.com/watch?v=' + nextUrl.split(':')[1];
          setYoutubeUrl(yUrl);
          youtubeUrlRef.current = yUrl;
          setIsPlaying(true);
          setIsLoading(true);
          if (currentTrackRef.current) {
            startPlaybackWatchdog(currentTrackRef.current.id, 1);
          }
        } else {
          setYoutubeUrl(null);
          youtubeUrlRef.current = null;
          const ytPlayer = getSafeInternalPlayer(reactPlayerRef.current);
          if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
            try { ytPlayer.pauseVideo(); } catch (e) {}
          }
          audio.src = nextUrl;
          audio.load();
          audio.play().catch(() => {});
          if (currentTrackRef.current) {
            startPlaybackWatchdog(currentTrackRef.current.id, 2);
          }
        }
        return;
      }

      // If all local fallback stream URLs are exhausted, attempt dynamic re-resolution discarding the dead source
      const cur = currentTrackRef.current;
      if (cur && audio) {
        try {
          console.log(`[PlayerContext] Discarding dead source and requesting fresh re-resolution for "${cur.title} - ${cur.artist}"...`);
          const freshRes = await api.resolvePlayback(cur.id, cur.title, cur.artist, cur.duration, {
            forceFresh: true,
            discardUrl: audio.src,
          });
          if (freshRes && freshRes.success && freshRes.data?.stream?.url) {
            const freshUrl = freshRes.data.stream.url;
            console.log(`[PlayerContext] Successfully re-resolved stream for "${cur.title}": ${freshUrl}`);
            fallbackStreamUrlsRef.current = freshRes.data.stream.fallbackUrls || [freshUrl];
            fallbackIndexRef.current = 0;
            if (freshUrl.startsWith('youtube:')) {
              clearWatchdog();
              audio.pause();
              audio.removeAttribute('src');
              audio.load();
              const yUrl = 'https://www.youtube.com/watch?v=' + freshUrl.split(':')[1];
              setYoutubeUrl(yUrl);
              youtubeUrlRef.current = yUrl;
              setIsPlaying(true);
              setIsLoading(true);
              startPlaybackWatchdog(cur.id, 1);
              return;
            } else {
              setYoutubeUrl(null);
              youtubeUrlRef.current = null;
              const ytPlayer = getSafeInternalPlayer(reactPlayerRef.current);
              if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
                try { ytPlayer.pauseVideo(); } catch (e) {}
              }
              audio.src = freshUrl;
              audio.load();
              audio.play().catch(() => {});
              startPlaybackWatchdog(cur.id, 2);
              return;
            }
          }
        } catch (resErr) {
          console.warn('[PlayerContext] Dynamic re-resolution error:', resErr);
        }
      }

      setIsLoading(false);
      setError('Playback unavailable for this track.');
      setIsPlaying(false);
    };

    // Foreground / Background Visibility Synchronization
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!youtubeUrlRef.current && audio) {
          usePlayerProgressStore.getState().setPosition(audio.currentTime);
          setIsPlaying(!audio.paused);
          if (audioContextRef.current && audioContextRef.current.state === 'suspended' && !audio.paused) {
            audioContextRef.current.resume().catch(() => {});
          }
          syncMediaSessionPosition();
        } else if (youtubeUrlRef.current) {
          // If returning to foreground while YouTube is active, ensure it stays playing
          if (isPlayingRef.current && reactPlayerRef.current) {
            try {
              const player = getSafeInternalPlayer(reactPlayerRef.current);
              if (player && typeof player.playVideo === 'function') {
                player.playVideo();
              }
            } catch (e) {}
          }
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('durationchange', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('seeked', handleSeeked);
    audio.addEventListener('error', handleError);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('durationchange', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('seeked', handleSeeked);
      audio.removeEventListener('error', handleError);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncMediaSessionPosition, syncLyricsPosition]);

  // Web Audio API initialization on first user interaction
  const initWebAudio = () => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
        }
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    } catch (err) {
      console.warn('Web Audio API initialized in fallback mode:', err);
    }
  };

  // High-precision position ticker and lyrics synchronization
  useEffect(() => {
    let animFrameId: number;
    let fallbackIntervalId: any;

    const tick = () => {
      const audio = audioRef.current;
      const isSeekingRecently = Date.now() - lastSeekTimestampRef.current < 250;
      const isYt = Boolean(youtubeUrlRef.current);

      if (isYt && isPlaying) {
        try {
          if (!isSeekingRecently) {
            let curTime: number | null = null;
            let curDur: number | null = null;
            const el = reactPlayerRef.current;
            if (el) {
              // 1. Direct HTML5 element property (ReactPlayer v3 / youtube-video-element)
              if (typeof el.currentTime === 'number' && !isNaN(el.currentTime) && el.currentTime >= 0) {
                curTime = el.currentTime;
              }
              if (typeof el.duration === 'number' && !isNaN(el.duration) && isFinite(el.duration) && el.duration > 0) {
                curDur = el.duration;
              }
              // 2. ReactPlayer v2 method
              if (curTime === null && typeof el.getCurrentTime === 'function') {
                const t = el.getCurrentTime();
                if (typeof t === 'number' && !isNaN(t) && t >= 0) curTime = t;
              }
              // 3. Internal YouTube player (getSafeInternalPlayer() or .api)
              const internal = getSafeInternalPlayer(el);
              if (internal) {
                if (curTime === null && typeof internal.getCurrentTime === 'function') {
                  const t = internal.getCurrentTime();
                  if (typeof t === 'number' && !isNaN(t) && t >= 0) curTime = t;
                }
                if (curDur === null && typeof internal.getDuration === 'function') {
                  const d = internal.getDuration();
                  if (typeof d === 'number' && !isNaN(d) && isFinite(d) && d > 0) curDur = d;
                }
              }
            }

            if (curTime !== null) {
              if (seekTargetRef.current !== null && seekTargetRef.current > 5 && curTime < 1) {
                usePlayerProgressStore.getState().setPosition(seekTargetRef.current);
                positionRef.current = seekTargetRef.current;
                syncLyricsPosition(seekTargetRef.current);
              } else {
                usePlayerProgressStore.getState().setPosition(curTime);
                positionRef.current = curTime;
                syncLyricsPosition(curTime);
                if (Math.abs(curTime - lastActiveProgressPositionRef.current) > 0.05) {
                  lastActiveProgressPositionRef.current = curTime;
                  lastActiveProgressTimestampRef.current = Date.now();
                }
              }
            }

            if (curDur !== null && curDur > 5 && (durationRef.current <= 0 || Math.abs(durationRef.current - curDur) > 3)) {
              usePlayerProgressStore.getState().setDuration(curDur);
              durationRef.current = curDur;
              syncMediaSessionPosition();
            }
          } else if (seekTargetRef.current !== null) {
            usePlayerProgressStore.getState().setPosition(seekTargetRef.current);
            positionRef.current = seekTargetRef.current;
            syncLyricsPosition(seekTargetRef.current);
          }
        } catch {}
      } else if (audio && !audio.paused && !audio.ended && !isYt) {
        if (!isSeekingRecently) {
          const curTime = audio.currentTime;
          if (seekTargetRef.current !== null && seekTargetRef.current > 5 && curTime < 1) {
            usePlayerProgressStore.getState().setPosition(seekTargetRef.current);
            positionRef.current = seekTargetRef.current;
            syncLyricsPosition(seekTargetRef.current);
          } else {
            usePlayerProgressStore.getState().setPosition(curTime);
            positionRef.current = curTime;
            syncLyricsPosition(curTime);
            if (Math.abs(curTime - lastActiveProgressPositionRef.current) > 0.05) {
              lastActiveProgressPositionRef.current = curTime;
              lastActiveProgressTimestampRef.current = Date.now();
            }
          }
        } else if (seekTargetRef.current !== null) {
          usePlayerProgressStore.getState().setPosition(seekTargetRef.current);
          positionRef.current = seekTargetRef.current;
          syncLyricsPosition(seekTargetRef.current);
        }
      }

      // Continuous mid-track stall detector (active if playing, not seeking, and past initial 0:00 start)
      const timeSinceLastProgress = Date.now() - lastActiveProgressTimestampRef.current;
      if (
        isPlayingRef.current &&
        !isSeekingRecently &&
        !isTransitioningRef.current &&
        document.visibilityState === 'visible' &&
        playbackProgressConfirmedRef.current &&
        (positionRef.current || 0) > 0.5
      ) {
        if (timeSinceLastProgress > 6500 && timeSinceLastProgress < 10000) {
          if (isYt) {
            const ytPlayer = getSafeInternalPlayer(reactPlayerRef.current);
            if (ytPlayer && typeof ytPlayer.playVideo === 'function') {
              try { ytPlayer.playVideo(); } catch (e) {}
            }
          } else if (audio && audio.paused) {
            try { audio.play().catch(() => {}); } catch (e) {}
          }
        } else if (timeSinceLastProgress >= 10000) {
          console.warn(`[PlayerContext] Mid-track stall confirmed (>10s without progress at ${positionRef.current?.toFixed(1)}s). Triggering fallback recovery...`);
          lastActiveProgressTimestampRef.current = Date.now();
          handleStreamFallback('Mid-track stall (>10s)');
        }
      }

      if (isPlaying) {
        animFrameId = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      animFrameId = requestAnimationFrame(tick);
      fallbackIntervalId = setInterval(tick, 100);
    }

    return () => {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
      if (fallbackIntervalId) {
        clearInterval(fallbackIntervalId);
      }
    };
  }, [isPlaying, youtubeUrl, syncLyricsPosition]);

  // Keep MediaSession Action Handlers and Metadata permanently synchronized
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => mediaHandlersRef.current.play()],
      ['pause', () => mediaHandlersRef.current.pause()],
      ['previoustrack', () => mediaHandlersRef.current.prev()],
      ['nexttrack', () => mediaHandlersRef.current.next()],
      ['stop', () => mediaHandlersRef.current.pause()],
      [
        'seekto',
        (details) => {
          if (details.seekTime !== undefined && details.seekTime !== null) {
            mediaHandlersRef.current.seek(details.seekTime);
          }
        },
      ],
      [
        'seekbackward',
        (details) => {
          const skipTime = details.seekOffset || 10;
          const cur = audioRef.current ? audioRef.current.currentTime : positionRef.current;
          mediaHandlersRef.current.seek(Math.max(cur - skipTime, 0));
        },
      ],
      [
        'seekforward',
        (details) => {
          const skipTime = details.seekOffset || 10;
          const cur = audioRef.current ? audioRef.current.currentTime : positionRef.current;
          mediaHandlersRef.current.seek(Math.min(cur + skipTime, durationRef.current || cur + skipTime));
        },
      ],
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        // Safe fallback for unsupported action types on specific devices
      }
    }
  }, []);

  // Helper: Synchronize MediaSession metadata with the current canonical track
  const updateMediaSessionMetadata = useCallback((targetTrack: Track | null, playing: boolean) => {
    if (!('mediaSession' in navigator)) return;

    if (!targetTrack) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    try {
      const toAbsoluteUrl = (url: string) => {
        try {
          return new URL(url, window.location.href).href;
        } catch {
          return url;
        }
      };

      const getMimeType = (url: string) => {
        const clean = url.split('?')[0].toLowerCase();
        if (clean.endsWith('.png')) return 'image/png';
        if (clean.endsWith('.webp')) return 'image/webp';
        return 'image/jpeg';
      };

      const artworkList: { src: string; sizes: string; type: string }[] = [];
      const smallImg = targetTrack.images?.small;
      const medImg = targetTrack.images?.medium;
      const largeImg = targetTrack.images?.large || medImg || smallImg;

      if (smallImg) {
        const absSmall = toAbsoluteUrl(smallImg);
        const mimeSmall = getMimeType(smallImg);
        artworkList.push(
          { src: absSmall, sizes: '96x96', type: mimeSmall },
          { src: absSmall, sizes: '128x128', type: mimeSmall }
        );
      }
      if (medImg) {
        const absMed = toAbsoluteUrl(medImg);
        const mimeMed = getMimeType(medImg);
        artworkList.push(
          { src: absMed, sizes: '192x192', type: mimeMed },
          { src: absMed, sizes: '256x256', type: mimeMed }
        );
      }
      if (largeImg) {
        const absLarge = toAbsoluteUrl(largeImg);
        const mimeLarge = getMimeType(largeImg);
        artworkList.push(
          { src: absLarge, sizes: '384x384', type: mimeLarge },
          { src: absLarge, sizes: '512x512', type: mimeLarge }
        );
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: targetTrack.title,
        artist: targetTrack.artist,
        album: targetTrack.album || targetTrack.artist || 'Spotiz',
        artwork: artworkList,
      });

      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
      syncMediaSessionPosition();

      // Section 19: Structured Media Session Debug Log
      console.log(`[MEDIA SESSION DEBUG]
selectedTrackId: ${targetTrack.id}
expectedISRC: ${targetTrack.isrc || 'N/A'}
title: ${targetTrack.title}
artists: ${targetTrack.artist}
album: ${targetTrack.album || 'N/A'}
artworkUrl: ${largeImg || 'N/A'}
artworkUrlValid: ${Boolean(largeImg && (largeImg.startsWith('http') || largeImg.startsWith('blob:')))}
artworkContentType: ${largeImg ? getMimeType(largeImg) : 'N/A'}
artworkResolution: 512x512
mediaSessionSupported: true
metadataSet: true
playbackState: ${playing ? 'playing' : 'paused'}
duration: ${durationRef.current || targetTrack.duration || 0}
currentTime: ${positionRef.current || 0}
provider: ${targetTrack.provider || 'catalog'}
requestId: ${playRequestIdRef.current}`);
    } catch (e) {
      console.warn('MediaSession metadata error:', e);
    }
  }, [syncMediaSessionPosition]);

  // Update MediaSession metadata when track or play state changes
  useEffect(() => {
    updateMediaSessionMetadata(track, isPlaying);
  }, [track, isPlaying, updateMediaSessionMetadata]);

  // Fetch lyrics helper
  const fetchLyrics = async (trackId: string, title?: string, artist?: string, durationSec?: number) => {
    try {
      const currentTrack = currentTrackRef.current;
      const effectiveTitle = title || currentTrack?.title;
      const effectiveArtist = artist || currentTrack?.artist;
      
      // If fetching lyrics for the currently playing track, prefer the precisely resolved stream duration
      // over the rough catalog duration (durationSec), to ensure lyrics perfectly match the actual audio stream (e.g. YouTube video intro length).
      const effectiveDuration = (currentTrack && currentTrack.id === trackId && durationRef.current > 0) 
        ? durationRef.current 
        : (durationSec || currentTrack?.duration);

      const res = await api.getLyrics(trackId, effectiveTitle, effectiveArtist, effectiveDuration);
      if (res.success && res.data) {
        if (!currentTrackRef.current || currentTrackRef.current.id === trackId) {
          setLyricsData(res.data);
          lyricsDataRef.current = res.data;
          syncLyricsPosition(positionRef.current || 0);
        }
      }
    } catch (e) {
      console.warn('Failed to load lyrics:', e);
    }
  };

  // Play a specific track
  const playTrack = async (newTrack: Track, newQueue?: Track[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    initWebAudio();
    
    setIsLoading(true); // Ensure UI immediately shows loading state on click
    setIsPlaying(false); // Pause current playback state visually during fetch
    
    const thisRequestId = ++playRequestIdRef.current;
    isTransitioningRef.current = true;

    setError(null);
    currentTrackRef.current = newTrack;
    setTrack(newTrack);
    usePlayerProgressStore.getState().setDuration(newTrack.duration || 210);
    usePlayerProgressStore.getState().setPosition(0);
    positionRef.current = 0;
    seekTargetRef.current = null;
    lastSeekTimestampRef.current = 0;

    // Immediately synchronize MediaSession metadata for the newly selected track
    updateMediaSessionMetadata(newTrack, true);

    // Reset previous lyrics immediately to prevent showing old song lyrics on track transition
    setLyricsData(null);
    lyricsDataRef.current = null;
    usePlayerProgressStore.getState().setActiveLyricIndex(-1);

    if (newQueue && newQueue.length > 0) {
      const visibleQueue = newQueue.filter(t => !isTrackHidden(t.id) || t.id === newTrack.id);
      queueRef.current = visibleQueue;
      setQueue(visibleQueue);
      const foundIdx = visibleQueue.findIndex((t) => t.id === newTrack.id);
      const targetIdx = foundIdx >= 0 ? foundIdx : 0;
      queueIndexRef.current = targetIdx;
      setQueueIndex(targetIdx);
    } else {
      // If queue is empty or doesn't contain the track, ensure queue has track
      setQueue((prevQueue) => {
        let nextQ = prevQueue.filter(t => !isTrackHidden(t.id) || t.id === newTrack.id);
        if (!nextQ.some((t) => t.id === newTrack.id)) {
          nextQ = [newTrack, ...nextQ];
        }
        queueRef.current = nextQ;
        return nextQ;
      });
      const currentIdx = queueRef.current.findIndex((t) => t.id === newTrack.id);
      const targetIdx = currentIdx >= 0 ? currentIdx : 0;
      queueIndexRef.current = targetIdx;
      setQueueIndex(targetIdx);
    }

    // Add to history
    setHistory((prev) => [newTrack, ...prev.filter((t) => t.id !== newTrack.id)].slice(0, 30));
    addTrackToHistory(newTrack);
    recordInteraction('play', newTrack.id, newTrack.artist, undefined, newTrack);
    // api.logHistory removed

    // Clean up previous blob URL if any
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }

    // Explicitly stop and silence any prior playback from both channels to prevent overlap
    if (audio) {
      try {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      } catch (e) {}
    }
    const prevYt = getSafeInternalPlayer(reactPlayerRef.current);
    if (prevYt && typeof prevYt.pauseVideo === 'function') {
      try { prevYt.pauseVideo(); } catch (e) {}
    }
    setYoutubeUrl(null);
    youtubeUrlRef.current = null;

    // Step 0: Check if the track is stored offline in IndexedDB
    try {
      const offlineBlob = await offlineStorage.getOfflineAudioBlob(newTrack.id);
      if (offlineBlob && offlineBlob.size > 0) {
        if (playRequestIdRef.current !== thisRequestId) return;
        const localBlobUrl = URL.createObjectURL(offlineBlob);
        activeBlobUrlRef.current = localBlobUrl;

        setYoutubeUrl(null); youtubeUrlRef.current = null;
        audio.src = localBlobUrl;
        audio.playbackRate = playbackRateRef.current || 1.0;
        audio.volume = isMuted ? 0 : volume;
        setIsPlaying(true);
        setIsLoading(false);
        setError(null);
        isTransitioningRef.current = false;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err: any) => {
            if (err.name === 'NotAllowedError') {
              console.warn('Autoplay waiting for user gesture (offline):', err);
              const unlock = () => {
                if (audioRef.current && currentTrackRef.current?.id === newTrack.id) {
                  audioRef.current.play().catch(() => {});
                }
                window.removeEventListener('pointerdown', unlock);
                window.removeEventListener('keydown', unlock);
              };
              window.addEventListener('pointerdown', unlock, { once: true });
              window.addEventListener('keydown', unlock, { once: true });
            }
          });
        }
        return;
      }
    } catch (offlineErr) {
      console.warn('[Playback] Error reading offline storage:', offlineErr);
    }

    // If device is offline and track is not downloaded
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError('Track is not available offline. Please connect to the internet or play downloaded tracks.');
      setIsPlaying(false);
      setIsLoading(false);
      isTransitioningRef.current = false;
      return;
    }

    // Check if the track already has a verified, full-length audio stream (not a 30s preview snippet)
    const isFullAudioStream = (url?: string): boolean => {
      if (!url || typeof url !== 'string' || url.trim() === '') return false;
      if (url.includes('audio-ssl.itunes.apple.com') || url.includes('mzstatic.com') || url.includes('itunes.apple.com')) return false;
      if (url.includes('cdns-preview') || url.includes('p.scdn.co') || url.includes('preview_url') || url.includes('/preview') || url.includes('jiotunepreview') || url.includes('jiotune')) return false;
      return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:');
    };

    const immediateUrl = isFullAudioStream(newTrack.streamUrl) ? newTrack.streamUrl : '';
    if (immediateUrl) {
      audio.src = immediateUrl;
      audio.playbackRate = playbackRateRef.current || 1.0;
      audio.volume = isMuted ? 0 : volume;
      setIsPlaying(true);
      setIsLoading(false);
      audio.play().catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('Immediate playback notice:', err);
        }
      });
    } else {
      // Synchronously prime audio element during click gesture so browser grants autoplay permission
      try {
        if (!audio.src || audio.src === window.location.href) {
          audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
          audio.load();
          const p = audio.play();
          if (p !== undefined) p.catch(() => {});
        }
      } catch (e) {}
      setIsPlaying(true);
      setIsLoading(true);
    }

    // Resolve playback URL via backend with high fidelity
    try {
      const resolveRes = (await Promise.race([
        api.resolvePlayback(
          newTrack.id,
          newTrack.title,
          newTrack.artist,
          newTrack.duration
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Playback resolution timeout')), 8000))
      ])) as any;

      if (playRequestIdRef.current !== thisRequestId) {
        return; // Superseded by a newer track selection
      }

      let playableUrl = '';
      if (immediateUrl && !immediateUrl.startsWith('youtube:')) {
        // We already have a verified direct audio stream playing natively!
        // Prefer direct audio stream over YouTube for seamless background & locked-screen playback
        if (resolveRes?.success && resolveRes.data?.stream?.url && !resolveRes.data.stream.url.startsWith('youtube:')) {
          playableUrl = resolveRes.data.stream.url;
        } else {
          playableUrl = immediateUrl;
        }
      } else {
        playableUrl = resolveRes?.success && resolveRes.data?.stream?.url
          ? resolveRes.data.stream.url
          : immediateUrl || '';

        // --- MOBILE AUTOPLAY & BACKGROUND PLAY FIX ---
        // If the primary resolved URL is a YouTube iframe but we have direct MP4/AAC audio streams
        // available in the fallbacks, strictly prefer the direct audio stream for seamless
        // background playback and to avoid mobile browser iframe autoplay restrictions.
        if (playableUrl && playableUrl.startsWith('youtube:') && resolveRes?.data?.stream?.fallbackUrls) {
          const directFallback = resolveRes.data.stream.fallbackUrls.find(
            (u: string) => u && u.startsWith('http') && !u.includes('youtube.com') && !u.includes('youtu.be')
          );
          if (directFallback) {
             playableUrl = directFallback;
             console.log(`[PlayerContext] Bypassing YouTube stream to use direct audio fallback: ${playableUrl}`);
          }
        }
      }

      let fallbackUrls = resolveRes?.success && resolveRes.data?.stream?.fallbackUrls && resolveRes.data.stream.fallbackUrls.length > 0
        ? resolveRes.data.stream.fallbackUrls
        : (playableUrl ? [playableUrl] : []);

      // If we bypassed YouTube to use a direct fallback, let's also sort the fallback array
      // so that all direct audio links are attempted BEFORE YouTube embeds.
      if (fallbackUrls.length > 1) {
        fallbackUrls = [
          ...fallbackUrls.filter((u: string) => u && u.startsWith('http') && !u.includes('youtube.com') && !u.includes('youtu.be')),
          ...fallbackUrls.filter((u: string) => !u || !u.startsWith('http') || u.includes('youtube.com') || u.includes('youtu.be'))
        ];
        
        // Ensure playableUrl matches the new highest priority fallback if it was bypassed
        if (playableUrl && !playableUrl.startsWith('youtube:') && fallbackUrls[0] !== playableUrl) {
           const idx = fallbackUrls.indexOf(playableUrl);
           if (idx > -1) {
             fallbackUrls.splice(idx, 1);
             fallbackUrls.unshift(playableUrl);
           }
        }
      }

      fallbackStreamUrlsRef.current = fallbackUrls;
      fallbackIndexRef.current = 0;

      if (resolveRes?.success && resolveRes.data?.duration) {
        const d = resolveRes.data.duration;
        usePlayerProgressStore.getState().setDuration(d);
        durationRef.current = d;
      }

      if (!playableUrl) {
        if (!immediateUrl) {
          setError('Playback unavailable for this track.');
          setIsPlaying(false);
          setIsLoading(false);
          isTransitioningRef.current = false;
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
          }
        }
        fetchLyrics(newTrack.id, newTrack.title, newTrack.artist, newTrack.duration);
        return;
      }

      if (playableUrl.startsWith('youtube:')) {
        const yUrl = 'https://www.youtube.com/watch?v=' + playableUrl.split(':')[1];
        usePlayerProgressStore.getState().setPosition(0);
        positionRef.current = 0;
        setYoutubeUrl(yUrl);
        youtubeUrlRef.current = yUrl;
        isTransitioningRef.current = false;
        
        // Ensure HTML5 audio is paused so it does not conflict with YouTube
        try {
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
        } catch (e) {}

        setIsPlaying(true);
        setIsLoading(true);

        // Immediate play attempt to ensure playback starts without stalling at 0:00
        setTimeout(() => {
          const el = reactPlayerRef.current;
          if (el) {
            try {
              if (typeof el.play === 'function') {
                el.play().catch(() => {});
              }
              const internal = getSafeInternalPlayer(el);
              if (internal && typeof internal.playVideo === 'function') {
                internal.playVideo();
              }
            } catch (e) {}
          }
        }, 50);

        // Start watchdog to monitor and recover if YouTube fails to initialize
        startPlaybackWatchdog(newTrack.id, 1);
      } else {
        audio.loop = false;
        setYoutubeUrl(null);
        youtubeUrlRef.current = null;
        const ytPlayer = getSafeInternalPlayer(reactPlayerRef.current);
        if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
          try { ytPlayer.pauseVideo(); } catch (e) {}
        }
        console.log(`[PlayerContext:Preload] Pre-loading audio stream for "${newTrack.title}" (${newTrack.id}) from ${playableUrl}`);
        audio.preload = 'auto';
        const alreadyPlayingSameUrl = audio.src === playableUrl && (audio.currentTime > 0 || audio.readyState >= 2);
        if (audio.src !== playableUrl) {
          audio.src = playableUrl;
          audio.load();
          setIsLoading(true);
        } else if (alreadyPlayingSameUrl) {
          setIsLoading(false);
        }
        audio.playbackRate = playbackRateRef.current || 1.0;
        audio.volume = isMuted ? 0 : volume;
        setIsPlaying(true);

        // Start playback watchdog for this track
        startPlaybackWatchdog(newTrack.id, 1);

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              isTransitioningRef.current = false;
              setIsLoading(false);
              setIsPlaying(true);
              console.log(`[PlayerContext:State] audio.play() promise resolved for "${newTrack.title}".`);
            })
            .catch((err: any) => {
              isTransitioningRef.current = false;
              if (err.name === 'NotAllowedError') {
                console.warn('[PlayerContext:Autoplay] Autoplay waiting for user gesture:', err);
                setIsLoading(false);
                const unlock = () => {
                  if (audioRef.current && currentTrackRef.current?.id === newTrack.id) {
                    audioRef.current.play().catch(() => {});
                  }
                  window.removeEventListener('pointerdown', unlock);
                  window.removeEventListener('keydown', unlock);
                };
                window.addEventListener('pointerdown', unlock, { once: true });
                window.addEventListener('keydown', unlock, { once: true });
              } else if (err.name !== 'AbortError') {
                console.warn('[PlayerContext:Play] Playback error encountered:', err);
                handleStreamFallback('Initial audio.play() promise rejection');
              }
            });
        } else {
          isTransitioningRef.current = false;
          setIsLoading(false);
          setIsPlaying(true);
        }
      }

      // Load lyrics in parallel
      fetchLyrics(newTrack.id, newTrack.title, newTrack.artist, newTrack.duration);
    } catch (err: any) {
      if (playRequestIdRef.current === thisRequestId) {
        if (!immediateUrl) {
          console.warn('Audio play request interrupted or failed:', err);
          setError('Playback temporarily unavailable for this track. Please retry.');
          setIsLoading(false);
          setIsPlaying(false);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
          }
        }
        fetchLyrics(newTrack.id, newTrack.title, newTrack.artist, newTrack.duration);
      }
    }
  };

  const togglePlay = () => {
    initWebAudio();
    setError(null);
    const isYt = Boolean(youtubeUrlRef.current);

    if (isPlaying) {
      clearWatchdog();
      setIsPlaying(false);
      if (isYt) {
        const internalPlayer = getSafeInternalPlayer(reactPlayerRef.current);
        if (internalPlayer && typeof internalPlayer.pauseVideo === 'function') {
          try { internalPlayer.pauseVideo(); } catch (e) {}
        }
      }
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch (e) {}
      }
    } else {
      if (!track && queue.length > 0) {
        playTrack(queue[0], queue);
      } else if (isYt) {
        setIsPlaying(true);
        if (audioRef.current) {
          try { audioRef.current.pause(); } catch (e) {}
        }
        const internalPlayer = getSafeInternalPlayer(reactPlayerRef.current);
        if (internalPlayer && typeof internalPlayer.playVideo === 'function') {
          try {
            internalPlayer.playVideo();
          } catch (e) { console.warn("Sync playVideo error:", e); }
        }
        if (track) {
          startPlaybackWatchdog(track.id, 1);
        }
      } else if (audioRef.current) {
        const internalPlayer = getSafeInternalPlayer(reactPlayerRef.current);
        if (internalPlayer && typeof internalPlayer.pauseVideo === 'function') {
          try { internalPlayer.pauseVideo(); } catch (e) {}
        }
        if (!audioRef.current.src && track) {
          playTrack(track, queue);
        } else {
          audioRef.current.play().catch((err: any) => {
            if (err.name === 'AbortError') return;
          });
          setIsPlaying(true);
          if (track && (audioRef.current.currentTime || 0) < 0.1) {
            startPlaybackWatchdog(track.id, 1);
          }
        }
      }
    }
  };

  const pause = () => {
    setIsPlaying(false);
    clearWatchdog();
    const internalPlayer = getSafeInternalPlayer(reactPlayerRef.current);
    if (internalPlayer && typeof internalPlayer.pauseVideo === 'function') {
      try {
        internalPlayer.pauseVideo();
      } catch (e) {}
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (e) {}
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    syncMediaSessionPosition();
  };

  const resume = () => {
    initWebAudio();
    const isYt = Boolean(youtubeUrlRef.current);
    if (isYt) {
      setIsPlaying(true);
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch (e) {}
      }
      const internalPlayer = getSafeInternalPlayer(reactPlayerRef.current);
      if (internalPlayer && typeof internalPlayer.playVideo === 'function') {
        try {
          internalPlayer.playVideo();
        } catch (e) {}
      }
      if (track && (positionRef.current || 0) < 0.1) {
        startPlaybackWatchdog(track.id, 1);
      }
    } else if (audioRef.current) {
      const internalPlayer = getSafeInternalPlayer(reactPlayerRef.current);
      if (internalPlayer && typeof internalPlayer.pauseVideo === 'function') {
        try { internalPlayer.pauseVideo(); } catch (e) {}
      }
      if (!audioRef.current.src && track) {
        playTrack(track, queue);
      } else {
        audioRef.current.preload = 'auto';
        audioRef.current.play().catch((err: any) => {
          if (err.name !== 'AbortError') {
            console.warn('[PlayerContext:Resume] Play failed on resume:', err);
          }
        });
        setIsPlaying(true);
        if (track && (audioRef.current.currentTime || 0) < 0.1) {
          startPlaybackWatchdog(track.id, 1);
        }
      }
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }
    syncMediaSessionPosition();
  };

  const seek = (seconds: number) => {
    const maxDuration = durationRef.current > 0 ? durationRef.current : 999999;
    const clamped = Math.max(0, Math.min(seconds, maxDuration));
    
    isSeekingActiveRef.current = true;
    seekTargetRef.current = clamped;
    lastSeekTimestampRef.current = Date.now();

    usePlayerProgressStore.getState().setPosition(clamped);
    positionRef.current = clamped;
    syncLyricsPosition(clamped);

    // Safety timeout to ensure isSeekingActiveRef resets if 'seeked' event fails to fire
    setTimeout(() => {
      isSeekingActiveRef.current = false;
    }, 1000);

    if (youtubeUrlRef.current) {
      const el = reactPlayerRef.current;
      if (el) {
        try {
          if ('currentTime' in el) {
            try {
              el.currentTime = clamped;
            } catch (e) {}
          }
          if (typeof el.seekTo === 'function') {
            try {
              el.seekTo(clamped, 'seconds');
            } catch (e) {}
          }
          const internal = getSafeInternalPlayer(el);
          if (internal && typeof internal.seekTo === 'function') {
            try {
              internal.seekTo(clamped, true);
            } catch (e) {}
          }
        } catch (e) {
          console.warn('ReactPlayer seek error:', e);
        }
      }
      syncMediaSessionPosition();
      return;
    }

    if (audioRef.current) {
      try {
        audioRef.current.currentTime = clamped;
      } catch (e) {
        console.warn('Audio seek error:', e);
      }
      syncMediaSessionPosition();
    }
  };

  const handleTrackEnd = () => {
    if (repeatModeRef.current === 'one') {
      seek(0);
      if (youtubeUrlRef.current) {
        setIsPlaying(true);
        const internal = getSafeInternalPlayer(reactPlayerRef.current);
        if (internal && typeof internal.playVideo === 'function') {
          try { internal.playVideo(); } catch (e) {}
        }
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }
    nextTrack();
  };

  const nextTrack = () => {
    const currentQueue = queueRef.current;
    const currentIndex = queueIndexRef.current;

    if (!currentQueue || currentQueue.length === 0) return;

    if (currentTrackRef.current) {
      if (positionRef.current < 30) {
        // Less than 30 seconds played -> skip
        recordInteraction('skip', currentTrackRef.current.id);
      }
    }

    if (shuffleEnabledRef.current) {
      if (currentQueue.length === 1 && repeatModeRef.current === 'off') {
        // Skip shuffle and fall through to Autoplay logic
      } else {
        let randomIndex = Math.floor(Math.random() * currentQueue.length);
        if (currentQueue.length > 1 && randomIndex === currentIndex) {
          randomIndex = (randomIndex + 1) % currentQueue.length;
        }
        queueIndexRef.current = randomIndex;
        setQueueIndex(randomIndex);
        playTrack(currentQueue[randomIndex], currentQueue);
        return;
      }
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < currentQueue.length) {
      queueIndexRef.current = nextIndex;
      setQueueIndex(nextIndex);
      playTrack(currentQueue[nextIndex], currentQueue);
    } else if (repeatModeRef.current === 'all') {
      queueIndexRef.current = 0;
      setQueueIndex(0);
      playTrack(currentQueue[0], currentQueue);
    } else {
      // Autoplay Feature
      if (currentTrackRef.current && profile?.settings?.autoPlaySimilar !== false) {
        setIsLoading(true);
        const playedIds = currentQueue.map(t => t.id);
        getAutoplayRecommendation(currentTrackRef.current, {
          trackPlays: profile?.interactionStats?.trackPlays,
          artistPlays: profile?.interactionStats?.artistPlays,
          searchSelections: profile?.interactionStats?.searchSelections,
          skips: profile?.interactionStats?.skips,
          replays: profile?.interactionStats?.replays,
          recentHistory: profile?.recentHistory,
          likes: likedTrackIds,
          followedArtists: followedArtistIds,
          followedArtistNames: Object.values(followedArtistsMap).map((a: any) => a.name),
        }, playedIds).then(nextSong => {
          if (nextSong) {
            const nextQ = [...currentQueue, nextSong];
            queueIndexRef.current = nextQ.length - 1;
            setQueueIndex(nextQ.length - 1);
            playTrack(nextSong, nextQ);
          } else {
            setIsPlaying(false);
            usePlayerProgressStore.getState().setPosition(0);
          }
        }).catch(() => {
          setIsPlaying(false);
          usePlayerProgressStore.getState().setPosition(0);
        });
      } else {
        setIsPlaying(false);
        usePlayerProgressStore.getState().setPosition(0);
      }
    }
  };

  const previousTrack = () => {
    const currentQueue = queueRef.current;
    const currentIndex = queueIndexRef.current;

    if (!currentQueue || currentQueue.length === 0) return;

    if (positionRef.current > 3 && audioRef.current) {
      // If played more than 3 seconds, restart current track
      if (currentTrackRef.current) {
        recordInteraction('replay', currentTrackRef.current.id);
      }
      seek(0);
      return;
    }

    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      queueIndexRef.current = prevIndex;
      setQueueIndex(prevIndex);
      playTrack(currentQueue[prevIndex], currentQueue);
    } else if (repeatModeRef.current === 'all') {
      const lastIndex = currentQueue.length - 1;
      queueIndexRef.current = lastIndex;
      setQueueIndex(lastIndex);
      playTrack(currentQueue[lastIndex], currentQueue);
    } else {
      seek(0);
    }
  };

  // Keep mediaHandlersRef current on each state/render change
  useEffect(() => {
    mediaHandlersRef.current = {
      play: resume,
      pause: pause,
      next: nextTrack,
      prev: previousTrack,
      seek: seek,
    };
    nextTrackRef.current = nextTrack;
    handleTrackEndRef.current = handleTrackEnd;
  });

  const toggleShuffle = () => {
    setShuffleEnabled((prev) => !prev);
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const setVolume = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
    if (reactPlayerRef.current) {
      try {
        const internalPlayer = getSafeInternalPlayer(reactPlayerRef.current);
        if (internalPlayer) {
          if (typeof internalPlayer.setVolume === 'function') {
            internalPlayer.setVolume(Math.round(clamped * 100));
          }
          if (clamped === 0) {
            if (typeof internalPlayer.mute === 'function') internalPlayer.mute();
          } else {
            if (typeof internalPlayer.unMute === 'function') internalPlayer.unMute();
          }
        }
      } catch (err) {
        console.warn('[PlayerContext] Error syncing volume with internal player:', err);
      }
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (audioRef.current) {
        audioRef.current.volume = newMuted ? 0 : volume;
      }
      if (reactPlayerRef.current) {
        try {
          const internalPlayer = getSafeInternalPlayer(reactPlayerRef.current);
          if (internalPlayer) {
            if (newMuted) {
              if (typeof internalPlayer.mute === 'function') internalPlayer.mute();
            } else {
              if (typeof internalPlayer.unMute === 'function') internalPlayer.unMute();
              if (typeof internalPlayer.setVolume === 'function') {
                internalPlayer.setVolume(Math.round(volume * 100));
              }
            }
          }
        } catch (err) {}
      }
      return newMuted;
    });
  };

  const setPlaybackRate = (rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const addToQueue = (newTrack: Track) => {
    setQueue((prev) => [...prev, newTrack]);
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    if (index < queueIndex) {
      setQueueIndex((prev) => prev - 1);
    }
  };

  const reorderQueue = (fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  };

  const clearQueue = () => {
    if (track) {
      setQueue([track]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(0);
    }
  };

  const playQueueItem = (index: number) => {
    if (index >= 0 && index < queue.length) {
      setQueueIndex(index);
      playTrack(queue[index], queue);
    }
  };

  // Sleep Timer
  const setSleepTimer = (minutes: number | null) => {
    if (sleepTimerTimeoutRef.current) {
      clearTimeout(sleepTimerTimeoutRef.current);
      sleepTimerTimeoutRef.current = null;
    }
    setSleepTimerMinutes(minutes);

    if (minutes && minutes > 0) {
      sleepTimerTimeoutRef.current = setTimeout(() => {
        pause();
        setSleepTimerMinutes(null);
      }, minutes * 60 * 1000);
    }
  };

  return (
    <>
      <div
        id="youtube-player-host-container"
        style={{
          position: 'fixed',
          bottom: '0px',
          right: '0px',
          width: '200px',
          height: '200px',
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: 0.002, // Completely invisible to user, but provides full 200x200 canvas to prevent YouTube background throttling
          overflow: 'hidden',
          display: youtubeUrl ? 'block' : 'none'
        }}
        aria-hidden="true"
      >
        <ReactPlayerComponent
          ref={reactPlayerRef}
          src={youtubeUrl || undefined}
          url={youtubeUrl || undefined}
          playing={isPlaying && Boolean(youtubeUrl)}
          volume={youtubeUrl ? (isMuted ? 0 : volume) : 0}
          playbackRate={playbackRate}
          width="100%"
          height="100%"
          playsInline
          config={
            {
              youtube: {
                playerVars: {
                  autoplay: 1,
                  playsinline: 1,
                  modestbranding: 1,
                  rel: 0,
                  controls: 0,
                  enablejsapi: 1,
                },
              },
            } as any
          }
            progressInterval={100}
            onTimeUpdate={(e: any) => {
              if (!youtubeUrlRef.current) return;
              if (Date.now() - lastSeekTimestampRef.current >= 200) {
                const cur = e?.currentTarget?.currentTime ?? e?.target?.currentTime;
                if (typeof cur === 'number' && !isNaN(cur) && cur >= 0) {
                  if (seekTargetRef.current !== null && seekTargetRef.current > 5 && cur < 1) {
                    return;
                  }
                  usePlayerProgressStore.getState().setPosition(cur);
                  positionRef.current = cur;
                  syncLyricsPosition(cur);

                  if (cur > 0.05 && !playbackProgressConfirmedRef.current) {
                    playbackProgressConfirmedRef.current = true;
                    clearWatchdog();
                    console.log(`[PlayerContext:YouTube] ✅ Playback progression confirmed at ${cur.toFixed(2)}s.`);
                  }
                }
              }
            }}
            onDurationChange={(e: any) => {
              if (!youtubeUrlRef.current) return;
              const dur = e?.currentTarget?.duration ?? e?.target?.duration;
              if (typeof dur === 'number' && !isNaN(dur) && isFinite(dur) && dur > 5) {
                usePlayerProgressStore.getState().setDuration(dur);
                durationRef.current = dur;
                syncMediaSessionPosition();
              }
            }}
            onLoadedMetadata={(e: any) => {
              if (!youtubeUrlRef.current) return;
              setIsLoading(false);
              const dur = e?.currentTarget?.duration ?? e?.target?.duration;
              if (typeof dur === 'number' && !isNaN(dur) && isFinite(dur) && dur > 5) {
                usePlayerProgressStore.getState().setDuration(dur);
                durationRef.current = dur;
                syncMediaSessionPosition();
              }
            }}
            onSeeked={() => {
              isSeekingActiveRef.current = false;
            }}
            onProgress={(state: any) => {
              if (Date.now() - lastSeekTimestampRef.current >= 200) {
                const playedSeconds = state?.playedSeconds;
                if (typeof playedSeconds === 'number' && !Number.isNaN(playedSeconds) && playedSeconds >= 0) {
                  if (seekTargetRef.current !== null && seekTargetRef.current > 5 && playedSeconds < 1) {
                    return;
                  }
                  usePlayerProgressStore.getState().setPosition(playedSeconds);
                  positionRef.current = playedSeconds;
                  syncLyricsPosition(playedSeconds);

                  if (playedSeconds > 0.05 && !playbackProgressConfirmedRef.current) {
                    playbackProgressConfirmedRef.current = true;
                    clearWatchdog();
                    console.log(`[PlayerContext:YouTube] ✅ Playback progression confirmed at ${playedSeconds.toFixed(2)}s.`);
                  }
                }
              }
            }}
            onPause={() => {
              if (!isTransitioningRef.current && isPlayingRef.current) {
                console.log('[PlayerContext:YouTube] Internal pause event received.');
                setIsPlaying(false);
                if ('mediaSession' in navigator) {
                  navigator.mediaSession.playbackState = 'paused';
                }
                syncMediaSessionPosition();
              }
            }}
            onEnded={() => {
              if (!youtubeUrlRef.current) return;
              if (durationRef.current > 45 && positionRef.current < durationRef.current - 18) {
                console.warn(`ReactPlayer onEnded fired prematurely at ${positionRef.current.toFixed(1)}s (expected ${durationRef.current}s). Trying next fallback stream...`);
                const recovered = handleStreamFallback('ReactPlayer premature onEnded');
                if (recovered) return;
              }

              if (currentTrackRef.current) {
                api.logAnalyticsEvent('play_completed', currentTrackRef.current.id);
              }
              if (repeatModeRef.current === 'one') {
                if (reactPlayerRef.current && typeof reactPlayerRef.current.seekTo === 'function') {
                  reactPlayerRef.current.seekTo(0, 'seconds');
                }
                usePlayerProgressStore.getState().setPosition(0);
                positionRef.current = 0;
                syncLyricsPosition(0);
                setIsPlaying(true);
              } else {
                handleTrackEndRef.current();
              }
            }}
            onPlay={() => {
              if (!youtubeUrlRef.current) return;
              setIsLoading(false);
              setIsPlaying(true);
              playbackProgressConfirmedRef.current = true;
              clearWatchdog();
              lastActiveProgressTimestampRef.current = Date.now();
              if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
              }
              syncMediaSessionPosition();
              const player = getSafeInternalPlayer(reactPlayerRef.current);
              if (player && typeof player.setVolume === 'function') {
                try {
                  player.setVolume(isMuted ? 0 : Math.round(volume * 100));
                  if (typeof player.unMute === 'function' && !isMuted) {
                    player.unMute();
                  }
                } catch (e) {}
              }
            }}
            onStart={() => {
              if (!youtubeUrlRef.current) return;
              setIsLoading(false);
              setIsPlaying(true);
              lastActiveProgressTimestampRef.current = Date.now();
            }}
            onReady={() => {
              if (!youtubeUrlRef.current) return;
              setIsLoading(false);
              const el = reactPlayerRef.current;
              if (el) {
                try {
                  if (typeof el.play === 'function' && isPlayingRef.current) {
                    el.play().catch(() => {});
                  }
                } catch (e) {}
              }
              const player = getSafeInternalPlayer(el);
              if (player) {
                try {
                  if (typeof player.setVolume === 'function') {
                    player.setVolume(isMuted ? 0 : Math.round(volume * 100));
                  }
                  if (typeof player.unMute === 'function' && !isMuted) {
                    player.unMute();
                  }
                  if (isPlayingRef.current && typeof player.playVideo === 'function') {
                    player.playVideo();
                  }
                } catch (e) {}
              }
            }}
            onError={(err: any) => {
              console.warn('ReactPlayer onError:', err);
              const recovered = handleStreamFallback('ReactPlayer onError: ' + (err?.message || 'embed error'));
              if (!recovered) {
                setError('Audio playback temporarily unavailable. Please tap play again.');
                setIsLoading(false);
                setIsPlaying(false);
              }
            }}
          />
        </div>


      <PlayerContext.Provider
      value={{
        track,
        youtubeUrl,
        isPlaying,
        repeatMode,
        shuffleEnabled,
        volume,
        audioQuality,
        setAudioQuality,
        crossfadeSeconds,
        setCrossfadeSeconds,
        gapless,
        setGapless,
        normalizeVolume,
        setNormalizeVolume,
        canvasEnabled,
        setCanvasEnabled,
        dataSaver,
        setDataSaver,
        isMuted,
        playbackRate,
        queue,
        queueIndex,
        history,
        isLoading,
        error,
        audioElement: audioRef.current,
        analyserNode: analyserNode || analyserRef.current,
        sleepTimerMinutes,
        lyricsData,
        playTrack,
        togglePlay,
        pause,
        resume,
        seek,
        nextTrack,
        previousTrack,
        toggleShuffle,
        setShuffleEnabled,
        toggleRepeat,
        setVolume,
        toggleMute,
        setPlaybackRate,
        addToQueue,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        playQueueItem,
        setSleepTimer,
        fetchLyrics,
        isFullscreenOpen,
        setIsFullscreenOpen,
        isLyricsOpen,
        setIsLyricsOpen,
        isQueueOpen,
        setIsQueueOpen,
        isAmbientModeOpen,
        setIsAmbientModeOpen,
      }}
    >
      {children}
    </PlayerContext.Provider>
    </>
  );
};

export const usePlayer = (): PlayerContextType => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
