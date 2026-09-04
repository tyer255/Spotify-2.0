import React, { useState, useEffect, useCallback } from 'react';
import { Artist, ViewState } from '../types';
import { api } from '../services/apiClient';
import { usePlayer } from '../context/PlayerContext';
import { useUser } from '../context/UserContext';
import { TrackRow } from '../components/Common/TrackRow';
import { AlbumCard } from '../components/Common/AlbumCard';
import { ArtistCard } from '../components/Common/ArtistCard';
import { HeroSkeleton } from '../components/Common/SkeletonLoaders';
import { resolveArtist } from '../utils/artistAliases';
import { getArtistPortrait, cacheArtistPortrait, fetchArtistPortraitLive } from '../utils/artistPortraits';
import {
  ArrowLeft,
  BadgeCheck,
  Play,
  Pause,
  Plus,
  Check,
  Users,
  Radio,
  Sparkles,
  CheckCircle2,
  MoreVertical,
  Shuffle,
  ChevronRight,
} from 'lucide-react';

import { getValidImageUrl } from '../utils/imageHelper';

interface ArtistViewProps {
  artistId: string;
  expectedName?: string;
  initialImage?: string;
  onNavigate: (view: ViewState) => void;
  onGoBack?: () => void;
}

export const ArtistView: React.FC<ArtistViewProps> = ({ artistId, expectedName, initialImage, onNavigate, onGoBack }) => {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { track: currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isArtistFollowed, toggleFollowArtist } = useUser();

  const loadArtistData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Handle virtual artists injected by frontend
      if (artistId.startsWith('virtual-')) {
        const nameToSearch = expectedName || artistId.replace('virtual-', '');
        const searchRes = await api.search(nameToSearch);
        
        let imageUrl = '';
        let bioStr = '';
        let followersCount = 0;
        const resolved = resolveArtist(nameToSearch);
        if (resolved) {
          imageUrl = resolved.entry.portraitUrl || '';
          bioStr = resolved.entry.bio || '';
          followersCount = resolved.entry.followers || 0;
        }

        if (searchRes.success && searchRes.data && searchRes.data.songs) {
          const virtualArtist: Artist = {
              id: artistId.startsWith('virtual-') ? artistId : `virtual-${expectedName}`,
              name: nameToSearch || expectedName,
              image: imageUrl,
              headerImage: '',
              topTracks: searchRes.data.songs,
              albums: searchRes.data.albums || [],
              singles: [],
              relatedArtists: [],
              bio: bioStr,
              followers: followersCount,
              monthlyListeners: 0,
              genres: [],
              verified: false
            };
          setArtist(virtualArtist);
          setLoading(false);
          return;
        }
      }

      const res = await api.getArtist(artistId);
      if (res.success && res.data) {
        
        let loadedArtist = res.data;
        let isMismatched = false;

        // If we expect a specific artist name, verify the loaded profile matches the name
        if (expectedName) {
          const normExpected = expectedName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          const normLoaded = (loadedArtist.name || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
          
          // If the names don't overlap at all, it's a mismatch
          if (normExpected && normLoaded && !normLoaded.includes(normExpected) && !normExpected.includes(normLoaded)) {
            isMismatched = true;
          }
        }

        if (isMismatched && expectedName) {
          const searchRes = await api.search(expectedName).catch(() => ({ success: false, data: null }));
          let fallbackImage = '';
          let fallbackBio = '';
          let fallbackFollowers = 0;
          const fallbackResolved = resolveArtist(expectedName);
          if (fallbackResolved) {
            fallbackImage = fallbackResolved.entry.portraitUrl || '';
            fallbackBio = fallbackResolved.entry.bio || '';
            fallbackFollowers = fallbackResolved.entry.followers || 0;
          }
          const virtualArtist = {
            id: `virtual-${expectedName}`,
            name: expectedName,
            image: fallbackImage,
            headerImage: '',
            topTracks: (searchRes && searchRes.success && searchRes.data && searchRes.data.songs) ? searchRes.data.songs : [],
            albums: (searchRes && searchRes.success && searchRes.data && searchRes.data.albums) ? searchRes.data.albums : [],
            singles: [],
            relatedArtists: [],
            bio: fallbackBio,
            followers: fallbackFollowers,
            monthlyListeners: 0,
            genres: [],
            verified: false
          };
          setArtist(virtualArtist);
          setLoading(false);
          return;
        }
        
        if (!loadedArtist.image || loadedArtist.image.includes('unsplash') || loadedArtist.image.includes('placeholder')) {
          const fallbackImg = initialImage || getArtistPortrait(loadedArtist.id) || getArtistPortrait(loadedArtist.name) || getArtistPortrait(expectedName) || (resolveArtist(loadedArtist.name)?.entry?.portraitUrl) || '';
          if (fallbackImg) {
            loadedArtist = { ...loadedArtist, image: fallbackImg };
          }
        }
        if (loadedArtist.image) {
          cacheArtistPortrait(loadedArtist.id, loadedArtist.image);
          cacheArtistPortrait(loadedArtist.name, loadedArtist.image);
        }
        setArtist(loadedArtist);
      } else {
        if (expectedName) {
          const fallbackResolved = resolveArtist(expectedName);
          setArtist({
            id: `virtual-${expectedName}`,
            name: expectedName,
            image: fallbackResolved ? fallbackResolved.entry.portraitUrl || '' : '',
            headerImage: '',
            topTracks: [],
            albums: [],
            singles: [],
            relatedArtists: [],
            bio: fallbackResolved ? fallbackResolved.entry.bio || '' : '',
            followers: fallbackResolved ? fallbackResolved.entry.followers || 0 : 0,
            monthlyListeners: 0,
            genres: [],
            verified: false
          });
        } else {
          setError('Artist not found');
        }
      }
    } catch (err) {
      if (expectedName) {
        const fallbackResolved = resolveArtist(expectedName);
        setArtist({
          id: `virtual-${expectedName}`,
          name: expectedName,
          image: fallbackResolved ? fallbackResolved.entry.portraitUrl || '' : '',
          headerImage: '',
          topTracks: [],
          albums: [],
          singles: [],
          relatedArtists: [],
          bio: fallbackResolved ? fallbackResolved.entry.bio || '' : '',
          followers: fallbackResolved ? fallbackResolved.entry.followers || 0 : 0,
          monthlyListeners: 0,
          genres: [],
          verified: false
        });
      } else {
        setError('Failed to load artist details');
      }
    } finally {
      setLoading(false);
    }
  }, [artistId, expectedName]);

  useEffect(() => {
    loadArtistData();
  }, [loadArtistData]);

  const [heroImgUrl, setHeroImgUrl] = useState<string>('');
  const [portraitImgUrl, setPortraitImgUrl] = useState<string>('');

  useEffect(() => {
    if (!artist) return;
    const initial = getValidImageUrl(initialImage || artist.image || '') || getArtistPortrait(artist.id || artistId) || getArtistPortrait(artist.name || expectedName) || (resolveArtist(artist.name || expectedName || '')?.entry?.portraitUrl) || '';
    if (initial) {
      setPortraitImgUrl(initial);
    } else {
      fetchArtistPortraitLive(artist.name || expectedName || artistId).then((url) => {
        if (url) setPortraitImgUrl(url);
      });
    }

    const hasHeader = Boolean(artist.headerImage && !artist.headerImage.includes('unsplash') && getValidImageUrl(artist.headerImage));
    if (hasHeader) {
      setHeroImgUrl(getValidImageUrl(artist.headerImage));
    } else if (initial) {
      setHeroImgUrl(initial);
    }
  }, [artist, artistId, expectedName, initialImage]);

  const handleBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      onNavigate({ type: 'home' });
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <HeroSkeleton />
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="relative p-8 py-24 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto min-h-screen">
        <div className="absolute top-4 left-4 z-30">
          <button
            onClick={handleBack}
            className="p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <Radio className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Cannot connect to music service</h3>
        <p className="text-sm text-neutral-400">
          Could not load artist metadata from authorized music catalog.
        </p>
        <button
          onClick={loadArtistData}
          className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const isFollowed = isArtistFollowed(artist.id) || isArtistFollowed(artist.name);
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

  const hasValidHeader = Boolean(heroImgUrl && !heroImgUrl.includes('unsplash'));

  return (
    <div className="relative pb-32 text-white bg-[#121212] min-h-screen">
      {/* Top Navigation Bar with Back Button */}
      <div className="absolute top-0 left-0 right-0 z-30 px-4 sm:px-8 py-4 flex items-center bg-gradient-to-b from-black/60 to-transparent">
        <button
          onClick={handleBack}
          className="p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Header Area */}
      {hasValidHeader && artist.headerImage ? (
        <div
          className="relative h-80 sm:h-[450px] w-full bg-neutral-900 bg-cover bg-top"
          style={{
            backgroundImage: heroImgUrl ? `url(${heroImgUrl})` : `none`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4 md:p-8 w-full z-10 flex flex-col justify-end">
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white mb-2" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
              {artist.name}
            </h1>
            
            {artist.verified && (
              <div className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                <CheckCircle2 className="w-5 h-5 text-[#3b82f6] fill-white" />
                <span>Verified by Spotiz</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relative pt-24 pb-8 px-4 md:px-8 bg-gradient-to-b from-[#5c4a3d] to-[#121212] flex flex-col justify-end">
          <div className="flex flex-col mb-4">
            {portraitImgUrl ? (
              <div className="w-44 h-44 md:w-56 md:h-56 rounded-full overflow-hidden mb-6 shadow-2xl self-center sm:self-start mt-8 bg-neutral-800">
                <img
                  src={portraitImgUrl}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    const fallback = getArtistPortrait(artist.name);
                    if (fallback && fallback !== portraitImgUrl) {
                      setPortraitImgUrl(fallback);
                    } else {
                      fetchArtistPortraitLive(artist.name).then((url) => {
                        if (url) setPortraitImgUrl(url);
                      });
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-44 h-44 md:w-56 md:h-56 rounded-full overflow-hidden mb-6 shadow-2xl self-center sm:self-start mt-8 bg-neutral-800 flex items-center justify-center">
                 <span className="text-4xl text-neutral-500 font-bold">{artist.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white mb-2 text-left">
              {artist.name}
            </h1>
            {artist.verified && (
              <div className="flex items-center gap-2 text-sm font-medium text-white mb-2 justify-start">
                <CheckCircle2 className="w-5 h-5 text-[#3b82f6] fill-white" />
                <span>Verified by Spotiz</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-4 md:px-8 space-y-4 -mt-1 pt-4 relative z-20">
        <div className="text-sm text-neutral-400 font-medium pb-2">
          {artist.monthlyListeners.toLocaleString()} monthly listeners
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => toggleFollowArtist({
                ...artist,
                image: portraitImgUrl || artist.image
              })}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                isFollowed
                  ? 'border-white/40 text-white bg-white/5 hover:border-red-500 hover:text-red-400 hover:bg-red-500/10'
                  : 'bg-white text-neutral-950 border-white hover:bg-neutral-200 shadow-md'
              }`}
            >
              {isFollowed ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Follow</span>
                </>
              )}
            </button>

            <button className="text-neutral-400 hover:text-white transition-colors">
              <MoreVertical className="w-6 h-6" />
            </button>
            <button className="text-neutral-400 hover:text-white transition-colors">
              <Shuffle className="w-6 h-6" />
            </button>
          </div>
          
          <button
            onClick={handlePlayAll}
            className="w-14 h-14 rounded-full bg-[#1ed760] hover:scale-105 active:scale-95 text-black flex items-center justify-center transition-all shadow-lg"
          >
            {isPlayingArtist ? (
              <Pause className="w-6 h-6 fill-black" />
            ) : (
              <Play className="w-7 h-7 fill-black ml-1" />
            )}
          </button>
        </div>

        {/* Listen to the new album */}
        {artist.albums.length > 0 && (
          <div 
            onClick={() => onNavigate({ type: 'album', albumId: artist.albums[0].id })}
            className="flex items-center justify-between bg-neutral-800/60 hover:bg-neutral-800 rounded-lg p-2.5 mt-2 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <img 
                src={artist.albums[0].images?.small || artist.albums[0].images?.medium || artist.albums[0].images?.large || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'} 
                className="w-12 h-12 rounded object-cover shadow" 
                alt="New album" 
              />
              <span className="text-sm font-bold text-white">Listen to the new album</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400 mr-2" />
          </div>
        )}

        {/* Tabs: Music, Clips */}
        <div className="flex items-center gap-6 border-b border-white/5 mt-6 mb-4">
          <div className="flex flex-col gap-2 items-center cursor-pointer">
            <span className="text-[15px] font-bold text-white px-1">Music</span>
            <div className="h-[2px] w-full bg-[#1ed760] rounded-t-full"></div>
          </div>
          <div className="flex flex-col gap-2 items-center cursor-pointer text-neutral-400 hover:text-white transition-colors">
            <span className="text-[15px] font-bold px-1">Clips</span>
            <div className="h-[2px] w-full bg-transparent rounded-t-full"></div>
          </div>
        </div>

        {/* Popular Songs */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Popular
          </h2>
          <div className="space-y-1">
            {artist.topTracks.map((track, idx) => (
              <TrackRow
                key={`art-trk-${track.id}-${idx}`}
                track={track}
                index={idx}
                queueContext={artist.topTracks}
                showCover={true}
                onNavigate={onNavigate}
                variant="artist-popular"
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
              {artist.albums.map((album, idx) => (
                <AlbumCard key={`art-alb-${album.id}-${idx}`} album={album} onNavigate={onNavigate} />
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
