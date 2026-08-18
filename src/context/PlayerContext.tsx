import ReactPlayer from 'react-player';
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Track, RepeatMode, PlaybackState, LyricsData } from '../types';
import { api } from '../services/apiClient';

const ReactPlayerComponent = ReactPlayer as unknown as React.ComponentType<any>;



interface PlayerContextType extends PlaybackState {
  audioQuality: 'normal' | 'high' | 'very_high';
  setAudioQuality: (quality: 'normal' | 'high' | 'very_high') => void;
  crossfadeSeconds: number;
  setCrossfadeSeconds: (sec: number) => void;
  gapless: boolean;
  setGapless: (gapless: boolean) => void;
  normalizeVolume: boolean;
  setNormalizeVolume: (normalize: boolean) => void;
  audioElement: HTMLAudioElement | null;
  analyserNode: AnalyserNode | null;
  sleepTimerMinutes: number | null;
  lyricsData: LyricsData | null;
  activeLyricIndex: number;
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
  fetchLyrics: (trackId: string) => Promise<void>;
  isFullscreenOpen: boolean;
  setIsFullscreenOpen: (open: boolean) => void;
  isLyricsOpen: boolean;
  setIsLyricsOpen: (open: boolean) => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [track, setTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedPosition, setBufferedPosition] = useState<number>(0);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [shuffleEnabled, setShuffleEnabled] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.85);

  const [audioQuality, setAudioQualityState] = useState<'normal' | 'high' | 'very_high'>(() => (localStorage.getItem('spotify_audio_quality') as any) || 'very_high');
  const [crossfadeSeconds, setCrossfadeSecondsState] = useState(() => parseInt(localStorage.getItem('spotify_crossfade') || '3', 10));
  const [gapless, setGaplessState] = useState(() => localStorage.getItem('spotify_gapless') !== 'false');
  const [normalizeVolume, setNormalizeVolumeState] = useState(() => localStorage.getItem('spotify_normalize_volume') !== 'false');

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
  
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRateState] = useState<number>(1.0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [history, setHistory] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const reactPlayerRef = useRef<any>(null);

  // Modals & Panels UI state
  const [isFullscreenOpen, setIsFullscreenOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  // Lyrics & Visualizer
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [activeLyricIndex, setActiveLyricIndex] = useState<number>(-1);
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

  const positionRef = useRef(position);
  positionRef.current = position;
  const durationRef = useRef(duration);
  durationRef.current = duration;
  const playbackRateRef = useRef(playbackRate);
  playbackRateRef.current = playbackRate;

  // Dedicated seek protection locks
  const isSeekingActiveRef = useRef<boolean>(false);
  const seekTargetRef = useRef<number | null>(null);
  const lastSeekTimestampRef = useRef<number>(0);

  // Helper for lyrics sync at any given position
  const syncLyricsPosition = useCallback((time: number) => {
    const lyrics = lyricsDataRef.current;
    if (lyrics && lyrics.lines && lyrics.lines.length > 0) {
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
      setActiveLyricIndex((prev) => (prev !== found ? found : prev));
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
      audioRef.current &&
      durationRef.current > 0 &&
      !isNaN(durationRef.current) &&
      isFinite(durationRef.current)
    ) {
      try {
        const cur = Math.min(Math.max(audioRef.current.currentTime || positionRef.current || 0, 0), durationRef.current);
        navigator.mediaSession.setPositionState({
          duration: Math.max(durationRef.current, 1),
          playbackRate: playbackRateRef.current || 1.0,
          position: cur,
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
      if (audio) {
        if (Date.now() - lastSeekTimestampRef.current < 900) {
          return;
        }
        // Guard against transient 0 resets immediately after seeking to a timestamp > 5s
        if (seekTargetRef.current !== null && seekTargetRef.current > 5 && audio.currentTime < 1) {
          return;
        }
        setPosition(audio.currentTime);
        if (audio.buffered.length > 0) {
          setBufferedPosition(audio.buffered.end(audio.buffered.length - 1));
        }
        syncLyricsPosition(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio) {
        const actualDur = audio.duration;
        const trackDur = currentTrackRef.current?.duration;
        if (actualDur >= 29 && actualDur <= 31 && trackDur && trackDur > 40) {
          setDuration(trackDur);
        } else if (actualDur && !isNaN(actualDur) && isFinite(actualDur) && actualDur > 5) {
          setDuration(actualDur);
        } else if (trackDur && trackDur > 5) {
          setDuration(trackDur);
        } else if (currentTrackRef.current?.duration && currentTrackRef.current.duration > 5) {
          setDuration(currentTrackRef.current.duration);
        } else if (audio.duration && !isNaN(audio.duration)) {
          setDuration(audio.duration);
        }
        setIsLoading(false);
        syncMediaSessionPosition();
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      syncMediaSessionPosition();
    };

    const handlePause = () => {
      setIsPlaying(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
      syncMediaSessionPosition();
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      syncMediaSessionPosition();
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      handleTrackEnd();
    };

    const handleSeeked = () => {
      isSeekingActiveRef.current = false;
      setIsLoading(false);
      if (audio) {
        setPosition(audio.currentTime);
        syncMediaSessionPosition();
      }
    };

    const handleError = (e: any) => {
      console.warn('Audio playback error:', e);
      setIsLoading(false);
      setError('Playback unavailable for this track.');
      setIsPlaying(false);
    };

    // Foreground / Background Visibility Synchronization
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (audio) {
          setPosition(audio.currentTime);
          setIsPlaying(!audio.paused);
          if (audioContextRef.current && audioContextRef.current.state === 'suspended' && !audio.paused) {
            audioContextRef.current.resume().catch(() => {});
          }
          syncMediaSessionPosition();
        }
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('seeked', handleSeeked);
    audio.addEventListener('error', handleError);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('waiting', handleWaiting);
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

    const tick = () => {
      const audio = audioRef.current;
      const isSeekingRecently = Date.now() - lastSeekTimestampRef.current < 900;

      if (youtubeUrl && reactPlayerRef.current && isPlaying) {
        try {
          if (!isSeekingRecently) {
            const curTime = typeof reactPlayerRef.current.getCurrentTime === 'function'
              ? reactPlayerRef.current.getCurrentTime()
              : positionRef.current;
            if (typeof curTime === 'number' && !isNaN(curTime) && curTime >= 0) {
              if (seekTargetRef.current !== null && seekTargetRef.current > 5 && curTime < 1) {
                setPosition(seekTargetRef.current);
                syncLyricsPosition(seekTargetRef.current);
              } else {
                setPosition(curTime);
                syncLyricsPosition(curTime);
              }
            }
          } else if (seekTargetRef.current !== null) {
            setPosition(seekTargetRef.current);
            syncLyricsPosition(seekTargetRef.current);
          }
        } catch {}
      } else if (audio && !audio.paused && !audio.ended && !youtubeUrl) {
        if (!isSeekingRecently) {
          const curTime = audio.currentTime;
          if (seekTargetRef.current !== null && seekTargetRef.current > 5 && curTime < 1) {
            setPosition(seekTargetRef.current);
            syncLyricsPosition(seekTargetRef.current);
          } else {
            setPosition(curTime);
            syncLyricsPosition(curTime);
          }
        } else if (seekTargetRef.current !== null) {
          setPosition(seekTargetRef.current);
          syncLyricsPosition(seekTargetRef.current);
        }
      }
      if (isPlaying) {
        animFrameId = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      animFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
    };
  }, [isPlaying, syncLyricsPosition]);

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

  // Update MediaSession metadata when track changes
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (!track) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    try {
      const artworkList = [];
      if (track.images?.large) {
        artworkList.push({ src: track.images.large, sizes: '512x512', type: 'image/jpeg' });
      }
      if (track.images?.medium) {
        artworkList.push({ src: track.images.medium, sizes: '256x256', type: 'image/jpeg' });
      }
      if (track.images?.small) {
        artworkList.push({ src: track.images.small, sizes: '96x96', type: 'image/jpeg' });
      }
      if (artworkList.length === 0) {
        artworkList.push({ src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' });
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || track.artist || 'Spotify',
        artwork: artworkList,
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      syncMediaSessionPosition();
    } catch (e) {
      console.warn('MediaSession metadata error:', e);
    }
  }, [track, isPlaying, syncMediaSessionPosition]);

  // Update MediaSession playback state & position
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : (track ? 'paused' : 'none');
      syncMediaSessionPosition();
    }
  }, [isPlaying, track, syncMediaSessionPosition]);

  // Fetch lyrics helper
  const fetchLyrics = async (trackId: string, title?: string, artist?: string, durationSec?: number) => {
    try {
      const res = await api.getLyrics(trackId, title, artist, durationSec);
      if (res.success && res.data) {
        setLyricsData(res.data);
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
    setIsLoading(true);
    setError(null);
    currentTrackRef.current = newTrack;
    setTrack(newTrack);
    setDuration(newTrack.duration || 210);
    setPosition(0);

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const foundIdx = newQueue.findIndex((t) => t.id === newTrack.id);
      setQueueIndex(foundIdx >= 0 ? foundIdx : 0);
    } else {
      // If queue is empty or doesn't contain the track, ensure queue has track
      setQueue((prevQueue) => {
        if (!prevQueue.some((t) => t.id === newTrack.id)) {
          return [newTrack, ...prevQueue];
        }
        return prevQueue;
      });
      setQueueIndex(0);
    }

    // Add to history
    setHistory((prev) => [newTrack, ...prev.filter((t) => t.id !== newTrack.id)].slice(0, 30));
    api.logHistory(newTrack.id).catch(() => {});

    // Resolve playback URL via backend with full metadata to guarantee full-duration 320kbps playback
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Playback resolution timeout')), 15000);
      });
      const resolveRes = await Promise.race([
        api.resolvePlayback(
          newTrack.id,
          newTrack.title,
          newTrack.artist,
          newTrack.duration
        ),
        timeoutPromise
      ]) as any;

      let playableUrl = resolveRes.success && resolveRes.data?.stream?.url
        ? resolveRes.data.stream.url
        : (newTrack.streamUrl && !newTrack.streamUrl.includes('mzstatic.com') ? newTrack.streamUrl : '');

      if (resolveRes.success && resolveRes.data?.duration) {
        setDuration(resolveRes.data.duration);
      }

      

      if (!playableUrl) {
        setError('Playback unavailable for this track.');
        setIsPlaying(false);
        setIsLoading(false);
        fetchLyrics(newTrack.id, newTrack.title, newTrack.artist, newTrack.duration);
        return;
      }

            if (playableUrl.startsWith('youtube:')) {
        audio.pause();
        audio.src = '';
        setYoutubeUrl('https://www.youtube.com/watch?v=' + playableUrl.split(':')[1]);
        setIsPlaying(true);
        setIsLoading(false);
      } else {
        setYoutubeUrl(null);
        audio.src = playableUrl;
        audio.playbackRate = playbackRate;
        audio.volume = isMuted ? 0 : volume;
        try {
          await audio.play();
        } catch (err: any) {
          if (err.name !== 'AbortError') throw err;
        }
        setIsPlaying(true);
        setIsLoading(false);
      }

      // Load lyrics in parallel
      fetchLyrics(newTrack.id, newTrack.title, newTrack.artist, newTrack.duration);
    } catch (err: any) {
      console.warn('Audio play request interrupted or failed:', err);
      setError('Playback unavailable for this track.');
      setIsLoading(false);
      fetchLyrics(newTrack.id, newTrack.title, newTrack.artist, newTrack.duration);
    }
  };

  const togglePlay = () => {
    initWebAudio();

    if (isPlaying) {
      if (youtubeUrl) {
        setIsPlaying(false);
      } else if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      if (!track && queue.length > 0) {
        playTrack(queue[0], queue);
      } else if (youtubeUrl) {
        setIsPlaying(true);
      } else if (audioRef.current && audioRef.current.src) {
        audioRef.current.play().catch((err: any) => {
          if (err.name === 'AbortError') return;
        });
        setIsPlaying(true);
      }
    }
  };

  const pause = () => {
    if (youtubeUrl) {
      setIsPlaying(false);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    syncMediaSessionPosition();
  };

  const resume = () => {
    initWebAudio();
    if (youtubeUrl) {
      setIsPlaying(true);
    } else if (audioRef.current && audioRef.current.src) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }
    syncMediaSessionPosition();
  };

  const seek = (seconds: number) => {
    const maxDuration = durationRef.current > 0 ? durationRef.current : (duration > 0 ? duration : 999999);
    const clamped = Math.max(0, Math.min(seconds, maxDuration));
    
    isSeekingActiveRef.current = true;
    seekTargetRef.current = clamped;
    lastSeekTimestampRef.current = Date.now();

    setPosition(clamped);
    positionRef.current = clamped;
    syncLyricsPosition(clamped);

    if (youtubeUrl) {
      if (reactPlayerRef.current) {
        try {
          if ('currentTime' in reactPlayerRef.current) {
            reactPlayerRef.current.currentTime = clamped;
          } else if (typeof reactPlayerRef.current.seekTo === 'function') {
            reactPlayerRef.current.seekTo(clamped, 'seconds');
          }
          
          if (typeof reactPlayerRef.current.getInternalPlayer === 'function') {
            const internal = reactPlayerRef.current.getInternalPlayer();
            if (internal && typeof internal.seekTo === 'function') {
              internal.seekTo(clamped, true);
            }
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
    if (repeatMode === 'one') {
      seek(0);
      if (youtubeUrl) {
        setIsPlaying(true);
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }
    nextTrack();
  };

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;

    if (shuffleEnabled) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      setQueueIndex(randomIndex);
      playTrack(queue[randomIndex], queue);
      return;
    }

    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      setQueueIndex(nextIndex);
      playTrack(queue[nextIndex], queue);
    } else if (repeatMode === 'all') {
      setQueueIndex(0);
      playTrack(queue[0], queue);
    } else {
      setIsPlaying(false);
    }
  }, [queue, queueIndex, shuffleEnabled, repeatMode]);

  const previousTrack = () => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      // If played more than 3 seconds, restart current track
      seek(0);
      return;
    }

    if (queue.length === 0) return;

    const prevIndex = queueIndex - 1;
    if (prevIndex >= 0) {
      setQueueIndex(prevIndex);
      playTrack(queue[prevIndex], queue);
    } else if (repeatMode === 'all') {
      const lastIndex = queue.length - 1;
      setQueueIndex(lastIndex);
      playTrack(queue[lastIndex], queue);
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
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (audioRef.current) {
        audioRef.current.volume = newMuted ? 0 : volume;
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
      {youtubeUrl && (
        <div
          id="youtube-player-host-container"
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: '200px',
            height: '200px',
            opacity: 0.001,
            pointerEvents: 'none',
            zIndex: -1,
          }}
          aria-hidden="true"
        >
          <ReactPlayerComponent
            ref={reactPlayerRef}
            src={youtubeUrl}
            playing={isPlaying}
            volume={isMuted ? 0 : volume}
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
                    origin: typeof window !== 'undefined' ? window.location.origin : '',
                  },
                },
              } as any
            }
            onTimeUpdate={(e: any) => {
              if (Date.now() - lastSeekTimestampRef.current >= 900) {
                if (e && e.currentTarget && typeof e.currentTarget.currentTime === 'number') {
                  const playedSeconds = e.currentTarget.currentTime;
                  if (seekTargetRef.current !== null && seekTargetRef.current > 5 && playedSeconds < 1) {
                    return;
                  }
                  setPosition(playedSeconds);
                }
              }
            }}
            onDurationChange={(e: any) => {
              if (e && e.currentTarget && typeof e.currentTarget.duration === 'number' && e.currentTarget.duration > 5) {
                setDuration(e.currentTarget.duration);
              }
            }}
            onEnded={() => {
              handleTrackEnd();
            }}
            onWaiting={() => setIsLoading(true)}
            onPlaying={() => {
              setIsLoading(false);
              setIsPlaying(true);
            }}
            onReady={() => setIsLoading(false)}
            onError={(err: any) => {
              console.warn('ReactPlayer playback error:', err);
              setError('Playback unavailable for this track.');
              setIsLoading(false);
              setIsPlaying(false);
            }}
          />
        </div>
      )}

      <PlayerContext.Provider
      value={{
        track,
        isPlaying,
        position,
        duration,
        bufferedPosition,
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
        activeLyricIndex,
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
