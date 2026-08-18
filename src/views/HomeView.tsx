import React, { useEffect, useState } from 'react';
import { HomeFeedData, ViewState, Track } from '../types';
import { api } from '../services/apiClient';
import { usePlayer } from '../context/PlayerContext';
import { useUser } from '../context/UserContext';
import { TrackCard } from '../components/Common/TrackCard';
import { ArtistCard } from '../components/Common/ArtistCard';
import { AlbumCard } from '../components/Common/AlbumCard';
import { PlaylistCard } from '../components/Common/PlaylistCard';
import { CardSkeleton } from '../components/Common/SkeletonLoaders';
import { Play, Pause, Sparkles, ChevronRight, Flame, Disc, Radio, WifiOff, Download, Music } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: ViewState) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [feed, setFeed] = useState<HomeFeedData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { track: currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { downloadedTracksList } = useUser();

  const loadFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getHomeFeed();
      if (res.success && res.data) {
        setFeed(res.data);
      } else {
        setError('Music data source unavailable');
      }
    } catch (e) {
      console.warn('Failed to load home feed', e);
      setError('Music data source unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-white/10 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl" />
          ))}
        </div>
        <div className="space-y-4">
          <div className="h-6 w-36 bg-white/10 rounded" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !feed) {
    if (downloadedTracksList.length > 0) {
      return (
        <div className="p-4 md:p-8 pb-32 space-y-8">
          <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-transparent p-6 rounded-2xl border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                <WifiOff className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Offline Mode</h2>
                <p className="text-xs text-neutral-300">You are offline, but your {downloadedTracksList.length} downloaded track{downloadedTracksList.length === 1 ? '' : 's'} are ready to play.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate({ type: 'playlist', playlistId: 'downloaded-tracks' })}
                className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Downloaded Songs</span>
              </button>
              <button
                onClick={loadFeed}
                className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all"
              >
                Retry Online
              </button>
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                <span>Downloaded & Offline Music</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {downloadedTracksList.map((t) => (
                <TrackCard key={`offline-${t.id}`} track={t} queueContext={downloadedTracksList} onNavigate={onNavigate} />
              ))}
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="p-8 py-24 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <Radio className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Music catalog offline</h3>
        <p className="text-sm text-neutral-400">
          Connect to the internet or download songs from track menus to listen offline.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={loadFeed}
            className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
          >
            Retry
          </button>
          <button
            onClick={() => onNavigate({ type: 'library', subTab: 'downloaded' })}
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all cursor-pointer"
          >
            Go to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-32 space-y-10">
      {/* Greeting Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-4">
          {feed.greeting}
        </h1>

        {/* 6 Quick Picks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {feed.quickPicks.map((pick) => {
            const isThisTrack = currentTrack?.id === pick.id;
            return (
              <div
                key={pick.id}
                onClick={() => playTrack(pick, feed.quickPicks)}
                className="group flex items-center justify-between rounded-2xl liquid-glass-card cursor-pointer overflow-hidden pr-3 shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={pick.images?.large || pick.images?.medium || pick.images?.small || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80'}
                    alt={pick.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';
                    }}
                    className="w-14 h-14 sm:w-16 sm:h-16 object-cover flex-shrink-0"
                  />
                  <span className="font-semibold text-xs sm:text-sm text-neutral-100 group-hover:text-white truncate">
                    {pick.title}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isThisTrack) {
                      togglePlay();
                    } else {
                      playTrack(pick, feed.quickPicks);
                    }
                  }}
                  className={`w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg transition-all ${
                    isThisTrack && isPlaying
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95'
                  }`}
                >
                  {isThisTrack && isPlaying ? (
                    <Pause className="w-5 h-5 fill-black" />
                  ) : (
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Made For You (Daily Mixes) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-neutral-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Made For You
            </h2>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth">
          {feed.madeForYou.map((mix) => (
            <div
              key={mix.id}
              onClick={() => {
                if (mix.tracks.length > 0) {
                  playTrack(mix.tracks[0], mix.tracks);
                }
              }}
              className="group flex-shrink-0 w-44 sm:w-48 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-300 cursor-pointer flex flex-col"
            >
              <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-neutral-800 shadow-md">
                <img
                  src={mix.cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80'}
                  alt={mix.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (mix.tracks.length > 0) {
                      playTrack(mix.tracks[0], mix.tracks);
                    }
                  }}
                  className="absolute right-2.5 bottom-2.5 w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
                >
                  <Play className="w-5 h-5 fill-black ml-0.5" />
                </button>
              </div>
              <h4 className="font-bold text-sm text-white truncate">{mix.title}</h4>
              <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                {mix.subtitle}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Played */}
      {feed.recentlyPlayed.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Recently Played
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth">
            {feed.recentlyPlayed.map((t) => (
              <TrackCard key={`recent-${t.id}`} track={t} queueContext={feed.recentlyPlayed} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Hits */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-neutral-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Trending Today
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth">
          {feed.trending.map((t) => (
            <TrackCard key={`trend-${t.id}`} track={t} queueContext={feed.trending} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* Popular Artists */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Popular Artists
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth">
          {feed.popularArtists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* New Releases / Recommended Albums */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Disc className="w-5 h-5 text-neutral-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            New Album Releases
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth">
          {feed.newReleases.map((album) => (
            <AlbumCard key={album.id} album={album} onNavigate={onNavigate} />
          ))}
        </div>
      </section>

      {/* Browse Moods & Genres */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-neutral-400" />
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Explore Genres & Moods
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {feed.moods.map((mood) => (
            <div
              key={mood.id}
              onClick={() => onNavigate({ type: 'search', initialQuery: mood.query })}
              className="group relative h-28 sm:h-32 rounded-2xl overflow-hidden p-3.5 cursor-pointer shadow-lg hover:scale-102 transition-all duration-200 select-none border border-white/5"
              style={{ backgroundColor: mood.color }}
            >
              <h4 className="font-extrabold text-sm sm:text-base text-white z-10 relative drop-shadow-md max-w-[70%] leading-snug">
                {mood.name}
              </h4>
              <div className="absolute -right-2 -bottom-2 sm:-right-1 sm:-bottom-1 w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden shadow-2xl transform rotate-[22deg] group-hover:rotate-[18deg] group-hover:scale-105 transition-transform duration-300">
                <img
                  src={mood.image || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80'}
                  alt={mood.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80';
                  }}
                  className="w-full h-full object-cover shadow-inner"
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
