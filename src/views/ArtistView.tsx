import React, { useState, useEffect } from 'react';
import { Artist, ViewState } from '../types';
import { api } from '../services/apiClient';
import { usePlayer } from '../context/PlayerContext';
import { useUser } from '../context/UserContext';
import { TrackRow } from '../components/Common/TrackRow';
import { AlbumCard } from '../components/Common/AlbumCard';
import { ArtistCard } from '../components/Common/ArtistCard';
import { HeroSkeleton } from '../components/Common/SkeletonLoaders';
import {
  BadgeCheck,
  Play,
  Pause,
  Plus,
  Check,
  Users,
  Radio,
  Sparkles,
} from 'lucide-react';

interface ArtistViewProps {
  artistId: string;
  onNavigate: (view: ViewState) => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({ artistId, onNavigate }) => {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { track: currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isArtistFollowed, toggleFollowArtist } = useUser();

  const loadArtist = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getArtist(artistId);
      if (res.success && res.data) {
        setArtist(res.data);
      } else {
        setError('Music data source unavailable');
      }
    } catch (e) {
      console.warn('Failed to load artist:', e);
      setError('Music data source unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtist();
  }, [artistId]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <HeroSkeleton />
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="p-8 py-24 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <Radio className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Music data source unavailable</h3>
        <p className="text-sm text-neutral-400">
          Could not load artist metadata from authorized music catalog.
        </p>
        <button
          onClick={loadArtist}
          className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const isFollowed = isArtistFollowed(artist.id);
  const isPlayingArtist = currentTrack?.artistId === artist.id && isPlaying;

  const handlePlayAll = () => {
    if (artist.topTracks.length > 0) {
      if (isPlayingArtist) {
        togglePlay();
      } else {
        playTrack(artist.topTracks[0], artist.topTracks);
      }
    }
  };

  return (
    <div className="pb-32 text-white">
      {/* Large Hero Header */}
      <div
        className="relative h-72 sm:h-96 w-full flex flex-col justify-end p-6 md:p-10 bg-neutral-900 bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(18,18,18,0.85) 75%, #121212 100%), url(${
            artist.headerImage || artist.image
          })`,
        }}
      >
        <div className="z-10 space-y-2 max-w-4xl">
          {artist.verified && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
              <BadgeCheck className="w-4 h-4 fill-sky-400 text-black" />
              <span>Verified Artist</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
            {artist.name}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 flex items-center gap-2 drop-shadow">
            <Users className="w-4 h-4" />
            <span>{artist.monthlyListeners.toLocaleString()} monthly listeners</span>
            <span>•</span>
            <span>{artist.genres.join(', ')}</span>
          </p>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-10">
        {/* Play All & Follow Bar */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayAll}
            className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
            title="Play Artist Top Tracks"
          >
            {isPlayingArtist ? (
              <Pause className="w-6 h-6 fill-black" />
            ) : (
              <Play className="w-6 h-6 fill-black ml-0.5" />
            )}
          </button>

          <button
            onClick={() => toggleFollowArtist(artist)}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold border transition-all flex items-center gap-1.5 ${
              isFollowed
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'border-white/20 text-white hover:border-white hover:bg-white/10'
            }`}
          >
            {isFollowed ? (
              <>
                <Check className="w-4 h-4" />
                <span>Following</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Follow</span>
              </>
            )}
          </button>
        </div>

        {/* Popular Songs Table */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Popular Songs
          </h2>
          <div className="space-y-1">
            {artist.topTracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                queueContext={artist.topTracks}
                showCover={true}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>

        {/* Discography: Albums */}
        {artist.albums.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Albums & EPs
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
              {artist.albums.map((album) => (
                <AlbumCard key={album.id} album={album} onNavigate={onNavigate} />
              ))}
            </div>
          </section>
        )}

        {/* About Section & Stats */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            About {artist.name}
          </h2>
          <div className="p-6 md:p-8 rounded-3xl bg-neutral-900/80 border border-white/5 space-y-4">
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-3xl">
              {artist.bio}
            </p>
            <div className="flex flex-wrap gap-8 pt-4 border-t border-white/5">
              <div>
                <div className="text-xl font-bold text-white">
                  {artist.followers.toLocaleString()}
                </div>
                <div className="text-xs text-neutral-400">Followers</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">
                  {artist.monthlyListeners.toLocaleString()}
                </div>
                <div className="text-xs text-neutral-400">Monthly Listeners</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
