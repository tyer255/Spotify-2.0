import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';
import { HomeFeedData, ViewState, Track, Artist, Album } from '../types';
import { api } from '../services/apiClient';
import { usePlayer } from '../context/PlayerContext';
import { useUser } from '../context/UserContext';
import { TrackCard } from '../components/Common/TrackCard';
import { CompactTrackRow } from '../components/Common/CompactTrackRow';
import { StationCard, StationData } from '../components/Common/StationCard';
import { ArtistCard } from '../components/Common/ArtistCard';
import { ArtistAvatar } from '../components/Common/ArtistAvatar';
import { AlbumCard } from '../components/Common/AlbumCard';
import { PlaylistCard } from '../components/Common/PlaylistCard';
import { UserAvatar } from '../components/Common/UserAvatar';
import { HomeFooter } from '../components/Navigation/HomeFooter';
import { ProfileDrawer } from '../components/Navigation/ProfileDrawer';
import { PromotionalAdCard } from '../components/Common/PromotionalAdCard';
import { generatePersonalizedFeed } from '../utils/personalizedRecommendations';
import { getHomeAdPosition } from '../utils/adSessionHelper';
import {
  Heart,
  Radio,
  WifiOff,
  Download,
  ChevronRight,
  Sparkles,
  Headphones,
  Mic,
  Disc,
  Play,
  X,
  Plus,
  Check
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: ViewState) => void;
}

type CategoryFilter = 'all' | 'music' | 'podcasts';

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const [feed, setFeed] = useState<HomeFeedData | null>(() => api.getCachedHomeFeed());
  const [loading, setLoading] = useState<boolean>(() => !api.getCachedHomeFeed());
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedPodcast, setSelectedPodcast] = useState<any | null>(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false);

  const { track: currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { downloadedTracksList, profile, likedTrackIds, likedTracksList, followedArtistsList, removeTrackFromHistory, isTrackHidden, isPodcastSaved, toggleSavePodcast } = useUser();

  // Dynamic session-based promo ad position (0 = top of feed, 1 = after 1 content section)
  const homeAdPosition = useMemo(() => getHomeAdPosition(), []);

  const loadFeed = async (forceRefresh = false) => {
    // Only show full skeleton loader if we have NO cached data at all
    if (!feed && !api.getCachedHomeFeed()) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await api.getHomeFeed(forceRefresh);
      if (res.success && res.data) {
        setFeed(res.data);
      } else if (!feed) {
        setError('Cannot connect to music service');
      }
    } catch (e) {
      console.warn('Failed to load home feed', e);
      if (!feed) {
        setError('Cannot connect to music service');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Compute real-time personalized recommendations based on:
  // 1. Followed Artists (explicit preference)
  // 2. Listening Behavior (play counts, replays, skips, recent history)
  // 3. Genre/Style alignment (indie acoustic, bollywood romance, punjabi, global pop, etc.)
  // 4. Freshness & De-duplication (showing different/new songs from preferred artists)
  const personalized = useMemo(() => {
    return generatePersonalizedFeed(profile, followedArtistsList, likedTracksList, feed);
  }, [profile, followedArtistsList, likedTracksList, feed]);

  const [dynamicFeaturedImage, setDynamicFeaturedImage] = useState<string>('');
  const [dynamicRecommended, setDynamicRecommended] = useState<Track[]>([]);

  useEffect(() => {
    let isMounted = true;
    
    if (!profile || !profile.recentHistory || profile.recentHistory.length === 0) return;
    
    const historyArtists = profile.recentHistory.map(t => t.track?.artist).filter(Boolean);
    const artistCounts = {};
    let maxCount = 0;
    let mostListenedArtist = historyArtists[0];
    
    historyArtists.forEach(a => {
      artistCounts[a] = (artistCounts[a] || 0) + 1;
      if (artistCounts[a] > maxCount) {
        maxCount = artistCounts[a];
        mostListenedArtist = a;
      }
    });
    
    if (mostListenedArtist) {
      api.search(mostListenedArtist, true).then(res => {
        if (!isMounted) return;
        const newTracks = [];
        const seenIds = new Set(profile.recentHistory.map(t => t.track?.id).filter(Boolean)); 
        
        if (res.success && res.data && res.data.songs) {
          res.data.songs.forEach(t => {
            const titleL = t.title.toLowerCase();
            if (titleL.includes("punjabi kompa")) return;
            // Only show tracks we haven't heard
            if (!seenIds.has(t.id) && newTracks.length < 50) {
              seenIds.add(t.id);
              newTracks.push(t);
            }
          });
        }
        
        newTracks.sort((a, b) => {
          const playsA = a.plays || a.play_count || 0;
          const playsB = b.plays || b.play_count || 0;
          return playsB - playsA;
        });
        
        if (newTracks.length > 0) {
          setDynamicRecommended(newTracks.slice(0, 6));
        }
      }).catch(e => console.warn('Error fetching dynamic recs:', e));
    }
    return () => { isMounted = false; };
  }, [profile?.recentHistory]);


  useEffect(() => {
    let isMounted = true;
    const currentImage = personalized.featuredArtistImage || personalized.featuredArtist?.image || '';
    if (currentImage && !currentImage.includes('ui-avatars') && !currentImage.includes('unsplash')) {
      setDynamicFeaturedImage(currentImage);
      return;
    }
    
    
    // Fetch real profile image dynamically from backend
    const artistName = personalized.becauseYouListenToArtistName;
    if (artistName && artistName !== 'Great Artists') {
      api.search(artistName).then(res => {
        if (!isMounted) return;
        if (res.success && res.data?.artists && res.data.artists.length > 0) {
          // Find exact or closest match
          const match = res.data.artists.find(a => a.name.toLowerCase() === artistName.toLowerCase()) || res.data.artists[0];
          if (match && match.image) {
            setDynamicFeaturedImage(match.image);
          }
        }
      }).catch(() => {});
    }
    
    return () => { isMounted = false; };
  }, [personalized.becauseYouListenToArtistName, personalized.featuredArtistImage, personalized.featuredArtist?.image]);

  const featuredArtistImage = dynamicFeaturedImage || personalized.featuredArtistImage || personalized.featuredArtist?.image || '';

  // Curated Podcasts for the Podcasts tab (Top 10 Hindi)
  const podcastShows = useMemo(() => {
    return [
      {
        id: 'pod-1',
        title: 'The Ranveer Show (Hindi)',
        publisher: 'Ranveer Allahbadia',
        videoId: 'F9wRC4jXTAk',
        cover: 'https://i.ytimg.com/vi/F9wRC4jXTAk/hqdefault.jpg',
        description: 'India\'s smartest podcast. Conversations with the greatest minds in Hindi. Exploring spirituality, business, history, and science.',
        duration: '1 hr 45 min',
      },
      {
        id: 'pod-2',
        title: 'Figuring Out',
        publisher: 'Raj Shamani',
        videoId: 'ywd-Ve8a8Tc',
        cover: 'https://i.ytimg.com/vi/ywd-Ve8a8Tc/hqdefault.jpg',
        description: 'Conversations with top entrepreneurs, creators, and leaders about business, finance, and life strategies.',
        duration: '1 hr 30 min',
      },
      {
        id: 'pod-3',
        title: 'Dostcast',
        publisher: 'Vinamre Kasanaa',
        videoId: 'LJu9YxN-zrE',
        cover: 'https://i.ytimg.com/vi/LJu9YxN-zrE/hqdefault.jpg',
        description: 'Raw, unfiltered conversations about Indian internet culture, philosophy, and modern youth issues.',
        duration: '1 hr 45 min',
      },
      {
        id: 'pod-4',
        title: 'RealHit Podcast',
        publisher: 'RealHit',
        videoId: 'UTamrxUTOC0',
        cover: 'https://i.ytimg.com/vi/UTamrxUTOC0/hqdefault.jpg',
        description: 'Engaging podcasts with popular YouTubers, influencers, and trending internet personalities in India.',
        duration: '1 hr 20 min',
      },
      {
        id: 'pod-5',
        title: 'ANI Podcast with Smita Prakash',
        publisher: 'ANI News',
        videoId: 'Clx220eWzgc',
        cover: 'https://i.ytimg.com/vi/Clx220eWzgc/hqdefault.jpg',
        description: 'In-depth interviews with politicians, policymakers, and newsmakers shaping India.',
        duration: '2 hr 10 min',
      },
      {
        id: 'pod-6',
        title: 'Prakhar Ke Pravachan',
        publisher: 'Prakhar Gupta',
        videoId: 'bBFtd7_zMpc',
        cover: 'https://i.ytimg.com/vi/bBFtd7_zMpc/hqdefault.jpg',
        description: 'Philosophical insights, psychological breakdowns, and debates to challenge modern Indian thinking.',
        duration: '1 hr 55 min',
      },
      {
        id: 'pod-7',
        title: 'Bharti TV Podcast',
        publisher: 'Bharti Singh',
        videoId: 'Qe-UKF1BlNo',
        cover: 'https://i.ytimg.com/vi/Qe-UKF1BlNo/hqdefault.jpg',
        description: 'Hilarious and heartwarming conversations with TV and Bollywood celebrities hosted by Bharti Singh and Haarsh.',
        duration: '55 min',
      },
      {
        id: 'pod-8',
        title: 'Untriggered with Aminjaz',
        publisher: 'Aminjaz',
        videoId: 'xwMQumRkt7w',
        cover: 'https://i.ytimg.com/vi/xwMQumRkt7w/hqdefault.jpg',
        description: 'Candid chats, pop-culture reviews, and funny anecdotes with a close group of friends.',
        duration: '1 hr 40 min',
      },
      {
        id: 'pod-9',
        title: 'Shubhankar Mishra Podcast',
        publisher: 'Shubhankar Mishra',
        videoId: '0crPA8LhAZg',
        cover: 'https://i.ytimg.com/vi/0crPA8LhAZg/hqdefault.jpg',
        description: 'Hard-hitting questions and trending discussions with newsmakers, politicians and social media stars.',
        duration: '1 hr 25 min',
      },
      {
        id: 'pod-10',
        title: 'Sandeep Maheshwari Show',
        publisher: 'Sandeep Maheshwari',
        videoId: 'hhVy2T505s4',
        cover: 'https://i.ytimg.com/vi/hhVy2T505s4/hqdefault.jpg',
        description: 'Motivational sessions and deep Q&A interactions with audiences to solve real-life problems.',
        duration: '45 min',
      },
    ];
  }, []);

  // Skeleton loading state
  if (loading && !feed && !isOffline) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-8 animate-pulse select-none">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10" />
          <div className="h-8 w-16 bg-white/10 rounded-full" />
          <div className="h-8 w-20 bg-white/10 rounded-full" />
          <div className="h-8 w-24 bg-white/10 rounded-full" />
        </div>

        {/* Recommended for Today Skeleton */}
        <div className="space-y-4">
          <div className="h-7 w-56 bg-white/10 rounded-md" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-40 sm:w-44 flex-shrink-0 space-y-2">
                <div className="aspect-square w-full rounded-2xl bg-white/10" />
                <div className="h-4 w-3/4 bg-white/10 rounded" />
                <div className="h-3 w-1/2 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Start Listening Skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-48 bg-white/5 rounded" />
          <div className="h-7 w-40 bg-white/10 rounded-md" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 w-full rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error / Offline State
  if (isOffline) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-8 select-none">
        <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/20 to-transparent p-6 rounded-2xl border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <WifiOff className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Offline Mode</h2>
              <p className="text-xs text-neutral-300">
                {downloadedTracksList.length > 0 
                  ? `You are offline, but your ${downloadedTracksList.length} downloaded track${downloadedTracksList.length === 1 ? '' : 's'} are ready to play.`
                  : "You are offline and haven't downloaded any tracks yet. Connect to the internet to stream music and download them for later."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {downloadedTracksList.length > 0 && (
              <button
                onClick={() => onNavigate({ type: 'playlist', playlistId: 'downloaded-tracks' })}
                className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Downloaded Songs</span>
              </button>
            )}
            <button
              onClick={() => loadFeed(true)}
              className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all cursor-pointer"
            >
              Retry Online
            </button>
          </div>
        </div>

        {downloadedTracksList.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              <span>Downloaded & Offline Music</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {downloadedTracksList.map((t) => (
                <TrackCard
                  key={`offline-${t.id}`}
                  track={t}
                  queueContext={downloadedTracksList}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  if (error && !feed) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-8 select-none">
        <div className="bg-gradient-to-r from-red-900/40 via-orange-900/20 to-transparent p-6 rounded-2xl border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-red-400 flex-shrink-0">
              <WifiOff className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Connection Error</h2>
              <p className="text-xs text-neutral-300">
                Could not connect to Spotiz servers. Your internet connection is active, but the service is currently unreachable or timed out.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadFeed(true)}
              className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Personalized Data
  const recommendedTracks = (dynamicRecommended.length > 0 ? [...dynamicRecommended.slice(0, 5), ...personalized.recommendedForToday.filter(t => !dynamicRecommended.slice(0,5).find(dt => dt.id === t.id)).slice(0, 5)] : personalized.recommendedForToday).filter(t => !isTrackHidden(t.id));
  const startListeningTracks = personalized.startListening.filter(t => !isTrackHidden(t.id));
  const becauseYouListenToTracks = personalized.becauseYouListenToTracks.filter(t => !isTrackHidden(t.id));
  const trendingTracks = personalized.trendingInVibe.filter(t => !isTrackHidden(t.id));
  const recommendedStations = personalized.recommendedStations;
  const popularArtists = personalized.favouriteArtists;
  const newReleases = personalized.recommendedAlbums;

  return (
    <div className="px-4 sm:px-6 md:px-8 pt-0 space-y-8 select-none">
      {/* 1. Header with Profile Avatar & Filter Pills */}
      <div className="sticky top-0 z-20 bg-neutral-950/90 backdrop-blur-xl py-3 sm:py-3.5 -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 mb-4 flex items-center justify-between gap-3 border-b border-white/10 shadow-lg">
        {/* Left Side: Profile Avatar & Filter Pills (Scrollable if narrow, never crushed) */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar min-w-0 flex-1 pr-2">
          {/* User Profile Avatar */}
          <button
            onClick={() => setIsProfileDrawerOpen(true)}
            className="flex-shrink-0 rounded-full hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title="Open Profile & Menu"
            aria-label="Open Profile and settings menu"
          >
            <UserAvatar
              avatarUrl={profile?.avatar}
              name={profile?.name || 'Guest User'}
              sizeClassName="w-9 h-9 sm:w-10 sm:h-10"
              iconClassName="w-5 h-5 text-neutral-300"
            />
          </button>

          {/* Filter Pills */}
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer flex-shrink-0 ${
              categoryFilter === 'all'
                ? 'bg-[#1ed760] text-black shadow-sm font-bold'
                : 'bg-white/[0.08] hover:bg-white/[0.14] text-neutral-200 border border-white/10'
            }`}
          >
            All
          </button>

          <button
            onClick={() => setCategoryFilter('music')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer flex-shrink-0 ${
              categoryFilter === 'music'
                ? 'bg-[#1ed760] text-black shadow-sm font-bold'
                : 'bg-white/[0.08] hover:bg-white/[0.14] text-neutral-200 border border-white/10'
            }`}
          >
            Music
          </button>

          <button
            onClick={() => setCategoryFilter('podcasts')}
            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer flex-shrink-0 ${
              categoryFilter === 'podcasts'
                ? 'bg-[#1ed760] text-black shadow-sm font-bold'
                : 'bg-white/[0.08] hover:bg-white/[0.14] text-neutral-200 border border-white/10'
            }`}
          >
            Podcasts
          </button>
        </div>
      </div>

      {/* PODCASTS TAB VIEW (When Podcasts Pill is selected) */}
      {categoryFilter === 'podcasts' && (
        <div className="space-y-8 animate-fadeIn">
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Top 10 Hindi Podcasts & Shows
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {podcastShows.map((pod) => (
                <div
                  key={pod.id}
                  onClick={() => setSelectedPodcast(pod)}
                  className="p-4 rounded-2xl liquid-glass-card hover:bg-white/10 transition-all cursor-pointer flex flex-col justify-start group"
                >
                  <div className="aspect-video w-full rounded-xl overflow-hidden mb-3 bg-neutral-800 shadow-md relative">
                    <img
                      src={pod.cover || undefined}
                      alt={pod.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(pod.title)}&background=2a2a2a&color=1ed760&size=400`;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm z-10 backdrop-blur-sm">
                      {pod.duration}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 z-20">
                      <div className="w-12 h-12 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-6 h-6 ml-1" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white truncate group-hover:text-[#1ed760] transition-colors" title={pod.title}>
                      {pod.title}
                    </h3>
                    <p className="text-xs text-neutral-400 truncate mt-0.5" title={pod.publisher}>Show • {pod.publisher}</p>
                    <p className="text-xs text-neutral-400/80 line-clamp-2 mt-2 leading-relaxed" title={pod.description}>
                      {pod.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ALL & MUSIC TAB VIEWS */}
      {categoryFilter !== 'podcasts' && (
        <>
          {/* Session Ad Position 0: Top of Feed */}
          {homeAdPosition === 0 && (
            <div className="my-2">
              <PromotionalAdCard onNavigate={onNavigate} />
            </div>
          )}

          {/* 2. Recommended for Today (Personalized with followed + listened artists + fresh discovery) */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Recommended for today
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth">
              {recommendedTracks.map((track, idx) => (
                <TrackCard
                  key={`rec-today-${track.id}-${idx}`}
                  track={track}
                  queueContext={recommendedTracks}
                  contentType="Single"
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </section>

          {/* Session Ad Position 1: After One Content Section */}
          {homeAdPosition === 1 && (
            <div className="my-3">
              <PromotionalAdCard onNavigate={onNavigate} />
            </div>
          )}

          {/* 3. Start Listening / Jump into a session based on your tastes */}
          <section className="space-y-2.5">
            <p className="text-xs sm:text-sm text-neutral-400 font-medium">
              Jump into a session based on your tastes
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Start listening
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2 pt-1">
              {startListeningTracks.map((track, idx) => (
                <CompactTrackRow
                  key={`start-listening-${track.id}-${idx}`}
                  track={track}
                  queueContext={startListeningTracks}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </section>

          {personalized.becauseYouListenToArtistName && personalized.becauseYouListenToTracks.length > 0 && (

          <section className="space-y-3.5">
            <div
              onClick={() => onNavigate({ 
                type: 'artist', 
                artistId: personalized.featuredArtist?.id || `artist-${encodeURIComponent(personalized.becauseYouListenToArtistName.toLowerCase().replace(/\s+/g, '-'))}`,
                expectedName: personalized.becauseYouListenToArtistName,
                initialImage: featuredArtistImage || personalized.featuredArtist?.image || undefined
              })}
              className="flex items-center gap-3 cursor-pointer group w-fit"
              title={`View ${personalized.becauseYouListenToArtistName}`}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-md bg-neutral-800 flex-shrink-0 border border-white/10 group-hover:scale-105 transition-transform duration-300">
                <ArtistAvatar
                  name={personalized.becauseYouListenToArtistName}
                  id={personalized.featuredArtist?.id}
                  image={featuredArtistImage || personalized.featuredArtist?.image}
                  sizeClassName="w-full h-full"
                  showHoverEffect={true}
                />
              </div>
              <div>
                <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold group-hover:text-neutral-300">
                  Because you listen to
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                  {personalized.becauseYouListenToArtistName}
                </h2>
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth">
              {becauseYouListenToTracks.map((track, idx) => (
                <TrackCard
                  key={`because-like-${track.id}-${idx}`}
                  track={track}
                  queueContext={becauseYouListenToTracks}
                  contentType="Single"
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </section>
          )}

          {/* 5. Trending & Viral (Matched to your vibe) */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Trending Hits
              </h2>
              <span className="text-xs text-neutral-400 font-medium capitalize">{personalized.topVibe.replace('_', ' ')}</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth">
              {trendingTracks.map((track, idx) => (
                <TrackCard
                  key={`trending-${track.id}-${idx}`}
                  track={track}
                  queueContext={trendingTracks}
                  contentType="Single"
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </section>

          {/* 6. Dynamic Recommended Stations */}
          <section className="space-y-3.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Recommended Stations
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth">
              {recommendedStations.map((station, idx) => (
                <StationCard
                  key={`rec-sta-${station.id}-${idx}`}
                  station={station}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </section>

          {/* 7. Recents Section */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Recents
              </h2>
              <button
                onClick={() => onNavigate({ type: 'library', subTab: 'history' })}
                className="text-xs sm:text-sm font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Show all
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth">
              {/* Liked Songs Tile (if user has liked songs) */}
              {likedTrackIds.size > 0 && (
                <div
                  onClick={() => onNavigate({ type: 'playlist', playlistId: 'liked-songs' })}
                  className="group relative flex-shrink-0 w-40 sm:w-44 p-3 rounded-2xl liquid-glass-card transition-all duration-300 cursor-pointer flex flex-col select-none"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
                      <Heart className="w-6 h-6 fill-white text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm truncate text-white group-hover:text-emerald-400">
                      Liked Songs
                    </h4>
                    <p className="text-xs text-neutral-400 truncate mt-0.5 flex items-center gap-1">
                      <span className="text-emerald-400 font-bold">●</span>
                      <span>{likedTrackIds.size} song{likedTrackIds.size === 1 ? '' : 's'} added</span>
                    </p>
                  </div>
                </div>
              )}

              {/* User Playlists in Recents */}
              {profile?.playlists && profile.playlists.length > 0 && (
                profile.playlists.slice(0, 3).map((pl, idx) => (
                  <PlaylistCard
                    key={`rec-pl-${pl.id}-${idx}`}
                    playlist={pl}
                    onNavigate={onNavigate}
                  />
                ))
              )}

              {/* Played History Tracks */}
              {profile?.recentHistory && profile.recentHistory.length > 0 ? (
                profile.recentHistory.slice(0, 10).map((h, idx) => (
                  <TrackCard
                    key={`recent-hist-${h.track.id}-${h.playedAt}-${idx}`}
                    track={h.track}
                    queueContext={profile.recentHistory.map((r) => r.track)}
                    contentType="Single"
                    onNavigate={onNavigate}
                    onDeleteFromHistory={() => removeTrackFromHistory(h.track.id)}
                    showDeleteFromHistory={true}
                  />
                ))
              ) : likedTrackIds.size === 0 && (!profile?.playlists || profile.playlists.length === 0) ? (
                <div className="col-span-full py-6 px-5 rounded-2xl liquid-glass-card border border-white/5 flex items-center gap-4 text-neutral-400">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 flex-shrink-0">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-200">No recent activity</h4>
                    <p className="text-xs text-neutral-400">Tracks and playlists you listen to will appear here.</p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* 8. Your favourite artists (Followed & preferred artists) */}
          {popularArtists.length > 0 && (
            <section className="space-y-3.5">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Your favourite artists
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth">
                {popularArtists.map((artist, idx) => (
                  <ArtistCard
                    key={artist.id}
                    artist={artist}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 9. Popular albums and singles / New Releases */}
          {newReleases.length > 0 && (
            <section className="space-y-3.5">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Popular albums and new releases
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth">
                {newReleases.map((album, idx) => (
                  <AlbumCard
                    key={`new-rel-${album.id}-${idx}`}
                    album={album}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Podcast Detail Modal */}
      {selectedPodcast && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fadeIn"
            onClick={() => setSelectedPodcast(null)}
          />
          <div className="relative w-full sm:max-w-lg bg-neutral-900 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl sm:border sm:border-white/10 animate-slideUpMobile sm:animate-scaleIn max-h-[90vh] flex flex-col">
            {/* Mobile Pull Indicator */}
            <div className="w-full flex justify-center pt-3 pb-2 sm:hidden absolute top-0 z-10">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>
            
            <div className="relative aspect-video w-full bg-neutral-950 shrink-0">
              <img 
                src={selectedPodcast.cover}
                alt={selectedPodcast.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPodcast.title)}&background=2a2a2a&color=1ed760&size=600`;
                }}
                className="w-full h-full object-cover opacity-90"
              />
              <button 
                onClick={() => setSelectedPodcast(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black hover:scale-105 active:scale-95 transition-all z-20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto no-scrollbar pb-8 sm:pb-6">
              <div>
                <h2 className="text-xl sm:text-3xl font-bold text-white mb-1.5 tracking-tight leading-tight">{selectedPodcast.title}</h2>
                <p className="text-xs sm:text-sm font-semibold text-[#1ed760] uppercase tracking-wider">{selectedPodcast.publisher} • {selectedPodcast.duration}</p>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {selectedPodcast.description}
                </p>
              </div>
              
              <div className="flex items-center gap-3 mt-4">
                <button
                  id="podcast-save-btn"
                  onClick={() => toggleSavePodcast(selectedPodcast)}
                  className={`py-3.5 px-6 rounded-full font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                    isPodcastSaved(selectedPodcast.id)
                      ? 'border-[#1ed760] text-[#1ed760] bg-[#1ed760]/10 hover:bg-[#1ed760]/20'
                      : 'border-white/20 text-white hover:bg-white/10'
                  }`}
                  title={isPodcastSaved(selectedPodcast.id) ? 'Remove from Your Library' : 'Save to Your Library'}
                >
                  {isPodcastSaved(selectedPodcast.id) ? (
                    <>
                      <Check className="w-5 h-5 text-[#1ed760] stroke-[2.5]" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 stroke-[2.2]" />
                      <span>Save</span>
                    </>
                  )}
                </button>

                <button
                  id="podcast-play-youtube-btn"
                  onClick={() => {
                     window.open(`https://youtube.com/watch?v=${selectedPodcast.videoId}`, '_blank');
                     setSelectedPodcast(null);
                  }}
                  className="flex-1 py-3.5 rounded-full bg-[#1ed760] text-black font-bold text-sm sm:text-base hover:bg-[#1db954] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-black" />
                  Play on YouTube
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Footer Section */}
      <HomeFooter onNavigate={onNavigate} />

      {/* Slide-in Navigation & Profile Drawer */}
      <ProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};

