import React, { useState, useEffect } from 'react';
import { Album, ViewState } from '../types';
import { api } from '../services/apiClient';
import { usePlayer } from '../context/PlayerContext';
import { TrackRow } from '../components/Common/TrackRow';
import { HeroSkeleton } from '../components/Common/SkeletonLoaders';
import { useUser } from '../context/UserContext';
import { Play, Pause, Shuffle, Disc3, Clock, ArrowLeft, Plus, Check } from 'lucide-react';

interface AlbumViewProps {
  albumId: string;
  onNavigate: (view: ViewState) => void;
  onGoBack?: () => void;
}

export const AlbumView: React.FC<AlbumViewProps> = ({ albumId, onNavigate, onGoBack }) => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { track: currentTrack, isPlaying, playTrack, togglePlay, setShuffleEnabled } = usePlayer();
  const { isTrackHidden, isAlbumSaved, toggleSaveAlbum } = useUser();

  const loadAlbum = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAlbum(albumId);
      if (res.success && res.data) {
        setAlbum(res.data);
      } else {
        setError('Cannot connect to music service');
      }
    } catch (e) {
      console.warn('Failed to load album:', e);
      setError('Cannot connect to music service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbum();
  }, [albumId]);

  const visibleTracks = React.useMemo(() => {
    return album?.tracks ? album.tracks.filter(t => !isTrackHidden(t.id)) : [];
  }, [album, isTrackHidden]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <HeroSkeleton />
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="p-8 py-24 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <Disc3 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Cannot connect to music service</h3>
        <p className="text-sm text-neutral-400">
          Could not load album details from authorized music catalog.
        </p>
        <button
          onClick={loadAlbum}
          className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const isPlayingThisAlbum = currentTrack?.albumId === album.id && isPlaying;

  const handlePlayAlbum = () => {
    if (visibleTracks.length > 0) {
      if (isPlayingThisAlbum) {
        togglePlay();
      } else {
        playTrack(visibleTracks[0], visibleTracks);
      }
    }
  };

  const handleShuffleAlbum = () => {
    if (visibleTracks.length > 0) {
      setShuffleEnabled(true);
      const randomIndex = Math.floor(Math.random() * visibleTracks.length);
      playTrack(visibleTracks[randomIndex], visibleTracks);
    }
  };

  const formatTotalDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    return `${mins} min`;
  };

  const handleBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      onNavigate({ type: 'home' });
    }
  };

  return (
    <div className="relative text-white bg-[#121212] min-h-full">
      {/* Dynamic Background Gradient (Absolute Layer covering top) */}
      <div
        className="absolute top-0 left-0 right-0 h-96 sm:h-[450px] transition-colors duration-500 z-0 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${album.color || '#1DB954'}55 0%, #121212 100%)`,
        }}
      />

      {/* Top Navigation Bar with Back Button */}
      <div className="sticky top-0 z-20 px-4 sm:px-8 py-3 bg-[#121212]/80 backdrop-blur-md flex items-center justify-between border-b border-white/5">
        <button
          onClick={handleBack}
          className="p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Album Header Banner */}
      <div className="relative z-10 p-6 md:p-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
        <img
          src={album.images?.large || album.images?.medium || album.images?.small || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80' || undefined}
          alt={album.name}
          className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl object-cover shadow-2xl flex-shrink-0"
        />

        <div className="space-y-2 text-center sm:text-left min-w-0">
          <span className="text-xs uppercase font-bold tracking-widest text-neutral-300">
            Album
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow">
            {album.name}
          </h1>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-neutral-300">
            <span
              onClick={() => onNavigate({ type: 'artist', artistId: album.artistId })}
              className="font-semibold text-white hover:underline cursor-pointer"
            >
              {album.artist}
            </span>
            <span>•</span>
            <span>{album.year}</span>
            <span>•</span>
            <span>{visibleTracks.length} songs,</span>
            <span className="text-neutral-400">{formatTotalDuration(album.totalDuration)}</span>
          </div>

          {album.label && (
            <p className="text-[11px] text-neutral-400">{album.label}</p>
          )}
        </div>
      </div>

      <div className="relative z-10 p-4 md:p-8 space-y-6">
        {/* Play & Shuffle Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayAlbum}
            className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
            title="Play Album"
          >
            {isPlayingThisAlbum ? (
              <Pause className="w-6 h-6 fill-black" />
            ) : (
              <Play className="w-6 h-6 fill-black ml-0.5" />
            )}
          </button>

          <button
            onClick={handleShuffleAlbum}
            className="p-3.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
            title="Shuffle Album"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            id="album-save-library-btn"
            onClick={() => album && toggleSaveAlbum(album)}
            className={`p-3.5 rounded-full transition-all cursor-pointer ${
              album && isAlbumSaved(album.id)
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white'
            }`}
            title={album && isAlbumSaved(album.id) ? 'Remove from Your Library' : 'Save to Your Library'}
          >
            {album && isAlbumSaved(album.id) ? (
              <Check className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
            ) : (
              <Plus className="w-5 h-5 stroke-[2.2]" />
            )}
          </button>
        </div>

        {/* Track List Header */}
        <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_84px_40px] items-center gap-4 text-xs font-semibold uppercase tracking-wider text-neutral-400 px-3 pb-2 border-b border-white/5 mb-2 select-none">
          <div className="flex items-center">
            <span>Title</span>
          </div>
          <div className="flex items-center justify-end pr-1">
            <Clock className="w-4 h-4" />
          </div>
          <div></div>
        </div>

        {/* Tracks List */}
        <div className="space-y-1">
          {visibleTracks.map((track, idx) => (
            <TrackRow
              key={track.id}
              track={track}
              index={idx}
              queueContext={visibleTracks}
              showAlbum={false}
              showCover={false}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
