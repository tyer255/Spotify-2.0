import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchResults, SearchSuggestion, ViewState, Track, RecentSearchItem } from '../types';
import { api } from '../services/apiClient';
import { rankAndSortSuggestions, rankAndSortSearchResults, rankAndSortTracks } from '../utils/searchRanker';
import { usePlayer } from '../context/PlayerContext';
import { useUser } from '../context/UserContext';
import { SpotifyLogo } from '../components/Common/SpotifyLogo';
import { ArtistCard } from '../components/Common/ArtistCard';
import { ArtistAvatar } from '../components/Common/ArtistAvatar';
import { AlbumCard } from '../components/Common/AlbumCard';
import { PlaylistCard } from '../components/Common/PlaylistCard';
import { ContextMenu } from '../components/Common/ContextMenu';
import { UserAvatar } from '../components/Common/UserAvatar';
import { ProfileDrawer } from '../components/Navigation/ProfileDrawer';
import { VoiceSearchOverlay } from '../components/Search/VoiceSearchOverlay';
import { PromotionalAdCard } from '../components/Common/PromotionalAdCard';
import { QrScannerModal } from '../components/Search/QrScannerModal';
import { offlineStorage } from '../services/offlineStorage';

import {
 Play,
 Pause,
 Clock,
 AlertCircle,
 X,
 Search,
 Mic,
 Camera,
 Languages,
 Globe2,
 Sparkles,
 ArrowLeft,
 ArrowUpLeft,
 MoreVertical,
 Plus,
 PlusCircle,
 Check,
 Radio,
 Music,
 Download,
 ArrowDownCircle,
 Heart,
} from 'lucide-react';


interface SearchViewProps {
 searchQuery?: string;
 onSearchChange?: (q: string) => void;
 onNavigate: (view: ViewState) => void;
}

type FilterType = 'all' | 'songs' | 'artists' | 'albums' | 'playlists';

// Authentic Top 4 Spotlight Categories matching the Spotify Screenshot exactly
const TOP_4_SPOTLIGHT_CATEGORIES = [
 {
  id: 'music',
  title: 'Music',
  bgColor: '#e8115b',
  glassGradient: 'linear-gradient(135deg, #e8115b 0%, #b80d48 100%)',
  image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  query: 'Top Hindi & English Hits',
 },
 {
  id: 'podcasts',
  title: 'Podcasts',
  bgColor: '#006450',
  glassGradient: 'linear-gradient(135deg, #006450 0%, #004537 100%)',
  image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80',
  query: 'Top Podcasts Science',
 },
 {
  id: 'live_events',
  title: 'Live\nEvents',
  bgColor: '#8400e7',
  glassGradient: 'linear-gradient(135deg, #8400e7 0%, #5e00a5 100%)',
  image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
  query: 'Live Concerts Acoustic',
 },
 {
  id: 'ipop',
  title: 'Home of\nI-Pop',
  bgColor: '#1e3264',
  glassGradient: 'linear-gradient(135deg, #1e3264 0%, #122144 100%)',
  image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
  query: 'I-Pop Hits',
 },
];

const DEFAULT_DISCOVER_CARDS = [
 {
  id: 'discover-hindi-lofi',
  tag: '#hindi lofi',
  title: 'Hindi Lofi Vibes',
  artist: 'Chill & Relax',
  image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
  query: 'Hindi Lofi Chill Songs',
 },
 {
  id: 'discover-hindi-pop',
  tag: '#hindi pop',
  title: 'Hindi Pop Grooves',
  artist: 'Indie & Pop',
  image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80',
  query: 'Hindi Pop Trending',
 },
 {
  id: 'discover-sad',
  tag: '#sad',
  title: 'Heartbroken Melodies',
  artist: 'Sad Hindi Songs',
  image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
  query: 'Sad Hindi Songs Lofi',
 },
 {
  id: 'discover-punjabi-pop',
  tag: '#punjabi pop',
  title: 'Punjabi Pop Hits',
  artist: 'Bhangra & Pop',
  image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80',
  query: 'Punjabi Hits Karan Aujla',
 },
 {
  id: 'discover-trending',
  tag: '#trending',
  title: 'Top India Trending',
  artist: 'Viral Hits',
  image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80',
  query: 'India Trending Top 50',
 },
];

const getLanguageGlassGradient = (colorClass: string): string => {
 switch (colorClass) {
  case 'bg-[#e13300]':
   return 'linear-gradient(135deg, rgba(225, 51, 0, 0.8) 0%, rgba(170, 35, 0, 0.52) 55%, rgba(18, 12, 15, 0.85) 100%)';
  case 'bg-[#ba5d07]':
   return 'linear-gradient(135deg, rgba(186, 93, 7, 0.8) 0%, rgba(140, 68, 5, 0.52) 55%, rgba(20, 14, 12, 0.85) 100%)';
  case 'bg-[#8400e7]':
   return 'linear-gradient(135deg, rgba(132, 0, 231, 0.8) 0%, rgba(95, 0, 175, 0.52) 55%, rgba(18, 10, 25, 0.85) 100%)';
  case 'bg-[#006450]':
   return 'linear-gradient(135deg, rgba(0, 100, 80, 0.8) 0%, rgba(0, 75, 60, 0.52) 55%, rgba(10, 20, 18, 0.85) 100%)';
  case 'bg-[#b02897]':
   return 'linear-gradient(135deg, rgba(176, 40, 151, 0.8) 0%, rgba(130, 25, 110, 0.52) 55%, rgba(22, 10, 20, 0.85) 100%)';
  case 'bg-[#283ea3]':
   return 'linear-gradient(135deg, rgba(40, 62, 163, 0.8) 0%, rgba(28, 45, 125, 0.52) 55%, rgba(12, 15, 28, 0.85) 100%)';
  case 'bg-[#d84000]':
   return 'linear-gradient(135deg, rgba(216, 64, 0, 0.8) 0%, rgba(165, 45, 0, 0.52) 55%, rgba(22, 12, 10, 0.85) 100%)';
  case 'bg-[#503750]':
   return 'linear-gradient(135deg, rgba(80, 55, 80, 0.8) 0%, rgba(58, 38, 58, 0.52) 55%, rgba(18, 14, 20, 0.85) 100%)';
  case 'bg-[#148a08]':
   return 'linear-gradient(135deg, rgba(20, 138, 8, 0.8) 0%, rgba(15, 100, 6, 0.52) 55%, rgba(10, 18, 10, 0.85) 100%)';
  case 'bg-[#477d95]':
   return 'linear-gradient(135deg, rgba(71, 125, 149, 0.8) 0%, rgba(50, 92, 110, 0.52) 55%, rgba(12, 18, 22, 0.85) 100%)';
  case 'bg-[#e91429]':
   return 'linear-gradient(135deg, rgba(233, 20, 41, 0.8) 0%, rgba(175, 12, 30, 0.52) 55%, rgba(22, 10, 12, 0.85) 100%)';
  case 'bg-[#eb1e32]':
   return 'linear-gradient(135deg, rgba(235, 30, 50, 0.8) 0%, rgba(175, 18, 35, 0.52) 55%, rgba(22, 10, 12, 0.85) 100%)';
  case 'bg-[#1e3264]':
   return 'linear-gradient(135deg, rgba(30, 50, 100, 0.85) 0%, rgba(20, 35, 75, 0.58) 55%, rgba(10, 15, 28, 0.88) 100%)';
  case 'bg-[#2d46b9]':
   return 'linear-gradient(135deg, rgba(45, 70, 185, 0.8) 0%, rgba(30, 50, 140, 0.52) 55%, rgba(10, 14, 28, 0.85) 100%)';
  default:
   return 'linear-gradient(135deg, rgba(60, 60, 80, 0.8) 0%, rgba(40, 40, 60, 0.52) 55%, rgba(15, 15, 22, 0.85) 100%)';
 }
};

// Comprehensive Indian & Global International Music Languages
const ALL_SPOTIFY_LANGUAGES = [
 // Indian Languages
 {
  name: 'Hindi',
  native: 'हिन्दी',
  category: 'Indian',
  color: 'bg-[#e13300]', // Orange Red
  query: 'Hindi Top Songs',
  desc: 'Bollywood & Indie Hits',
 },
 {
  name: 'Punjabi',
  native: 'ਪੰਜਾਬੀ',
  category: 'Indian',
  color: 'bg-[#ba5d07]', // Warm Amber
  query: 'Punjabi Hits',
  desc: 'Bhangra & Pop',
 },
 {
  name: 'Tamil',
  native: 'தமிழ்',
  category: 'Indian',
  color: 'bg-[#8400e7]', // Royal Purple
  query: 'Tamil Hits',
  desc: 'Kollywood Beats',
 },
 {
  name: 'Telugu',
  native: 'తెలుగు',
  category: 'Indian',
  color: 'bg-[#006450]', // Dark Emerald
  query: 'Telugu Hits',
  desc: 'Tollywood Melodies',
 },
 {
  name: 'Bhojpuri',
  native: 'भोजपुरी',
  category: 'Indian',
  color: 'bg-[#b02897]', // Magenta
  query: 'Bhojpuri Hits',
  desc: 'Desi Tadka',
 },
 {
  name: 'Malayalam',
  native: 'മലയാളം',
  category: 'Indian',
  color: 'bg-[#283ea3]', // Ocean Blue
  query: 'Malayalam Hits',
  desc: 'Mollywood Vibes',
 },
 {
  name: 'Kannada',
  native: 'ಕನ್ನಡ',
  category: 'Indian',
  color: 'bg-[#d84000]', // Vermillion
  query: 'Kannada Hits',
  desc: 'Sandalwood Tracks',
 },
 {
  name: 'Marathi',
  native: 'मराठी',
  category: 'Indian',
  color: 'bg-[#503750]', // Plum
  query: 'Marathi Songs',
  desc: 'Lavani & Modern',
 },
 {
  name: 'Gujarati',
  native: 'ગુજરાતી',
  category: 'Indian',
  color: 'bg-[#148a08]', // Vibrant Green
  query: 'Gujarati Hits',
  desc: 'Garba & Folk',
 },
 {
  name: 'Bengali',
  native: 'বাংলা',
  category: 'Indian',
  color: 'bg-[#477d95]', // Slate Teal
  query: 'Bengali Hits',
  desc: 'Melody & Sangeet',
 },
 {
  name: 'Haryanvi',
  native: 'हरियाणवी',
  category: 'Indian',
  color: 'bg-[#e91429]', // Crimson
  query: 'Haryanvi Songs',
  desc: 'Desi Raginis',
 },

 // Global & International Languages (Korea, Japan, Russia, English, Spanish, etc.)
 {
  name: 'Korean',
  native: '한국어',
  category: 'Global',
  color: 'bg-[#eb1e32]', // Korean Vibrant Red
  query: 'K-Pop Top Hits',
  desc: 'K-Pop & OSTs',
 },
 {
  name: 'Japanese',
  native: '日本語',
  category: 'Global',
  color: 'bg-[#e91429]', // Japan Crimson
  query: 'J-Pop Anime Hits',
  desc: 'J-Pop & Anime Soundtracks',
 },
 {
  name: 'Russian',
  native: 'Русский',
  category: 'Global',
  color: 'bg-[#1e3264]', // Deep Russian Blue
  query: 'Russian Hits Phonk',
  desc: 'Phonk & Russian Pop',
 },
 {
  name: 'English',
  native: 'English',
  category: 'Global',
  color: 'bg-[#2d46b9]', // Royal Blue
  query: 'English Pop Hits',
  desc: 'Global Top Charts',
 },
 {
  name: 'Spanish',
  native: 'Español',
  category: 'Global',
  color: 'bg-[#e13300]', // Latin Fiery Red
  query: 'Reggaeton Latin Hits',
  desc: 'Reggaeton & Latin Pop',
 },
 {
  name: 'French',
  native: 'Français',
  category: 'Global',
  color: 'bg-[#503750]', // French Chic Plum
  query: 'French Pop Hits',
  desc: 'French Pop & Chanson',
 },
 {
  name: 'German',
  native: 'Deutsch',
  category: 'Global',
  color: 'bg-[#ba5d07]', // German Amber
  query: 'German Rap Hits',
  desc: 'Deutschpop & Hip-Hop',
 },
 {
  name: 'Arabic',
  native: 'العربية',
  category: 'Global',
  color: 'bg-[#006450]', // Emerald Green
  query: 'Arabic Pop Hits',
  desc: 'Khaleeji & Middle East',
 },
 {
  name: 'Portuguese',
  native: 'Português',
  category: 'Global',
  color: 'bg-[#148a08]', // Brazil Green
  query: 'Brazilian Funk Hits',
  desc: 'Brazilian Funk & Samba',
 },
 {
  name: 'Italian',
  native: 'Italiano',
  category: 'Global',
  color: 'bg-[#283ea3]', // Italian Azure
  query: 'Italian Pop Hits',
  desc: 'Sanremo & Italian Pop',
 },
 {
  name: 'Chinese',
  native: '中文',
  category: 'Global',
  color: 'bg-[#b02897]', // Oriental Magenta
  query: 'Mandopop Top Hits',
  desc: 'Mandopop & Cantopop',
 },
];

interface RealDiscoverCard {
 id: string;
 tag: string;
 title: string;
 artist: string;
 image: string;
 track?: Track | null;
 query: string;
}

export const SearchView: React.FC<SearchViewProps> = ({
 searchQuery = '',
 onSearchChange,
 onNavigate,
}) => {
 const [activeFilter, setActiveFilter] = useState<FilterType>('all');
 const [languageTab, setLanguageTab] = useState<'all' | 'Indian' | 'Global'>('all');
 const [results, setResults] = useState<SearchResults | null>(null);
 const [loading, setLoading] = useState(false);
 const [searchError, setSearchError] = useState<string | null>(null);
 const [isListening, setIsListening] = useState(false);
 const [isVoiceOpen, setIsVoiceOpen] = useState(false);
 const [voiceTranscript, setVoiceTranscript] = useState('');
 const recognitionRef = useRef<any>(null);
 
 const [isSearchFocused, setIsSearchFocused] = useState(false);
 const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

 // Song Suggestions while typing
 const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
 const [loadingSuggestions, setLoadingSuggestions] = useState(false);

 // Real live discover tracks loaded from the music API
 const [discoverCards, setDiscoverCards] = useState<RealDiscoverCard[]>(DEFAULT_DISCOVER_CARDS);
 const [discoverLoading, setDiscoverLoading] = useState(false);

 const { track: currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
 const {
  profile,
  likedTrackIds,
  followedArtistIds,
  followedArtistsList,
  isTrackLiked,
  toggleLikeTrack,
  isArtistFollowed,
  toggleFollowArtist,
  isTrackDownloaded,
  isDownloadingTrack,
  getTrackDownloadProgress,
  isTrackHidden,
  showToast,
  recordInteraction,
  recentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
 } = useUser();

 const [isScannerOpen, setIsScannerOpen] = useState(false);

 const handleScanSuccess = async (songId: string) => {
  setIsScannerOpen(false);
  showToast('Spotiz code scanned! Loading track...');

  try {
   // 1. Check offline storage
   const offline = await offlineStorage.getOfflineTrack(songId);
   if (offline) {
    playTrack(offline, [offline]);
    showToast(`Now playing: ${offline.title}`);
    return;
   }

   // 2. Fetch track directly from catalog
   const res = await api.getTrack(songId);
   if (res && res.success && res.data) {
    playTrack(res.data, [res.data]);
    showToast(`Now playing: ${res.data.title}`);
    return;
   }

   // 3. Fallback search by song ID
   const searchRes = await api.search(songId);
   if (searchRes && searchRes.success && searchRes.data?.songs && searchRes.data.songs.length > 0) {
    const matched = searchRes.data.songs.find((t: Track) => t.id === songId) || searchRes.data.songs[0];
    playTrack(matched, searchRes.data.songs);
    showToast(`Now playing: ${matched.title}`);
    return;
   }

   showToast("This QR code isn't a valid Spotiz song code or song not found.");
  } catch (err) {
   console.warn('Failed to resolve scanned song ID:', err);
   showToast("This QR code isn't a valid Spotiz song code.");
  }
 };

 const addRecentItem = useCallback((item: RecentSearchItem) => {
  addRecentSearch(item);
 }, [addRecentSearch]);

 const followedArtistNames = useMemo(() => followedArtistsList.map(a => a.name), [followedArtistsList]);
 const [menuTrack, setMenuTrack] = useState<Track | null>(null);
 const currentQueryRef = useRef<string>('');
 const searchInputRef = useRef<HTMLInputElement>(null);
 const suggestionsRef = useRef<SearchSuggestion[]>([]);

 useEffect(() => {
  suggestionsRef.current = suggestions;
 }, [suggestions]);

 // Matching recent search history items (title contains query)
 const matchingRecentSearches = useMemo(() => {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return [];
  return recentSearches.filter((item) => item.title.toLowerCase().includes(q)).slice(0, 3);
 }, [searchQuery, recentSearches]);

 

 // Fetch real matching song suggestions while typing
 useEffect(() => {
  const trimmed = searchQuery.trim();
  if (!trimmed) {
   setSuggestions([]);
   setLoadingSuggestions(false);
   return;
  }

  let isCurrent = true;
  setLoadingSuggestions(true);

  const timer = setTimeout(async () => {
   try {
    const res = await api.getSuggestions(trimmed);
    if (isCurrent) {
     let candidateSuggestions: SearchSuggestion[] = [];
     if (res.success && Array.isArray(res.data)) {
      candidateSuggestions = [...res.data];
     }

     // Candidate Enrichment: Inject any matching songs from user's listening history
     const qLower = trimmed.toLowerCase();
     const existingIds = new Set(candidateSuggestions.map((s) => s.id));
     
     const enrichFromTrack = (t: Track) => {
      if (t && !existingIds.has(t.id)) {
       const titleLower = (t.title || '').toLowerCase();
       const artistLower = (t.artist || '').toLowerCase();
       const albumLower = (t.album || '').toLowerCase();
       if (
        titleLower.includes(qLower) ||
        artistLower.includes(qLower) ||
        albumLower.includes(qLower) ||
        qLower.includes(titleLower)
       ) {
        candidateSuggestions.unshift({
         id: t.id,
         title: t.title,
         artist: t.artist,
         album: t.album,
         type: 'song',
         image: t.images?.medium || t.images?.small || t.images?.large || '',
         score: 9999,
        });
        existingIds.add(t.id);
       }
      }
     };

     if (profile?.recentHistory && profile.recentHistory.length > 0) {
      for (const item of profile.recentHistory) {
       enrichFromTrack(item.track);
      }
     }

     if (profile?.interactionStats?.trackCache) {
      for (const trackId of Object.keys(profile.interactionStats.trackCache)) {
       enrichFromTrack(profile.interactionStats.trackCache[trackId]);
      }
     }

     // Strict deduplication by title + artist to prevent duplicates from different providers
     candidateSuggestions = candidateSuggestions.filter((sug, index, self) => {
      if (sug.type !== 'song') return true;
      const normTitle = (sug.title || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/[^a-z0-9]/g, '');
      const normArtist = (sug.artist || '').split(/[,&/|]/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      return index === self.findIndex((s) => {
       if (s.type !== 'song') return false;
       const sNormTitle = (s.title || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/[^a-z0-9]/g, '');
       const sNormArtist = (s.artist || '').split(/[,&/|]/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
       return normTitle === sNormTitle && normArtist === sNormArtist;
      });
     });

     const ranked = rankAndSortSuggestions(candidateSuggestions, trimmed, {
      trackPlays: profile?.interactionStats?.trackPlays,
      artistPlays: profile?.interactionStats?.artistPlays,
      searchSelections: profile?.interactionStats?.searchSelections,
      skips: profile?.interactionStats?.skips,
      replays: profile?.interactionStats?.replays,
      recentHistory: profile?.recentHistory,
      likes: likedTrackIds,
      followedArtists: followedArtistIds,
      followedArtistNames,
     });
     setSuggestions(ranked);
    }
   } catch (err) {
    if (isCurrent) setSuggestions([]);
   } finally {
    if (isCurrent) setLoadingSuggestions(false);
   }
  }, 300);

  return () => {
   isCurrent = false;
   clearTimeout(timer);
  };
 }, [searchQuery, profile?.recentHistory, profile?.interactionStats, likedTrackIds, followedArtistIds, followedArtistNames]);

 // Fetch real data for Discover Something New on mount
 useEffect(() => {
  let isMounted = true;

  async function loadRealDiscoverData() {
   setDiscoverLoading(true);
   try {
    const homeRes = await api.getHomeFeed();
    if (!isMounted) return;

    let realTracks: Track[] = [];
    if (homeRes.success && homeRes.data) {
     const feed = homeRes.data;
     realTracks = [
      ...(feed.quickPicks || []),
      ...(feed.trending || []),
      ...(feed.newReleases || []),
     ];
    }

    if (realTracks.length < 4) {
     const hindiRes = await api.search('Pal Pal');
     if (isMounted && hindiRes.success && hindiRes.data?.songs) {
      realTracks = [...realTracks, ...hindiRes.data.songs];
     }
    }

    const tags = ['#hindi lofi', '#hindi pop', '#heartbroken', '#punjabi pop', '#trending'];
    const queries = ['Pal Pal Dil Ke Paas', 'Husn Anuv Jain', 'Aarzu Madhurxo', 'Bhangra Hits', 'Kesariya'];

    const cards: RealDiscoverCard[] = [];
    for (let i = 0; i < 4; i++) {
     const track = realTracks[i] || null;
     cards.push({
      id: track?.id || `discover-${i}`,
      tag: tags[i % tags.length],
      title: track?.title || 'Trending Song',
      artist: track?.artist || 'Popular Artist',
      image:
       track?.images?.large ||
       track?.images?.medium ||
       track?.images?.small ||
       undefined,
      track,
      query: queries[i % queries.length],
     });
    }

    if (isMounted) {
     setDiscoverCards(cards);
     setDiscoverLoading(false);
    }
   } catch (err) {
    console.warn('Could not load real discover data', err);
    if (isMounted) {
     setDiscoverLoading(false);
    }
   }
  }

  loadRealDiscoverData();

  return () => {
   isMounted = false;
  };
 }, []);

 

 

 const processSearchResults = useCallback(
  (data: any, cleanQ: string) => {
   const mergedData = {
    ...data,
    songs: (data.songs || []).filter((s: Track) => !isTrackHidden(s.id)),
   };

   return rankAndSortSearchResults(mergedData, cleanQ, {
    trackPlays: profile?.interactionStats?.trackPlays,
    artistPlays: profile?.interactionStats?.artistPlays,
    searchSelections: profile?.interactionStats?.searchSelections,
    skips: profile?.interactionStats?.skips,
    replays: profile?.interactionStats?.replays,
    recentHistory: profile?.recentHistory,
    likes: likedTrackIds,
    followedArtists: followedArtistIds,
    followedArtistNames,
   });
  },
  [profile?.recentHistory, profile?.interactionStats, likedTrackIds, followedArtistIds, followedArtistNames, isTrackHidden]
 );

 const executeFullSearch = useCallback(
  async (q: string) => {
   const cleanQ = q.trim();
   currentQueryRef.current = cleanQ;

   if (!cleanQ) {
    setResults(null);
    setLoading(false);
    setSearchError(null);
    return;
   }

   setResults(null);
   setLoading(true);
   setSearchError(null);

   try {
    const res = await api.search(cleanQ);
    if (currentQueryRef.current === cleanQ) {
     if (res.success && res.data) {
      const ranked = processSearchResults(res.data, cleanQ);
      setResults(ranked);
      if (ranked.topResult?.type === 'track') {
       api.logAnalyticsEvent('search', (ranked.topResult.data as any).id);
      }

      
      setSearchError(null);
     } else if ((res as any).error?.code !== 'ABORTED') {
      setSearchError(null); // Fallback to 'no results' screen
     }
    }
   } catch (e) {
    if (currentQueryRef.current === cleanQ) {
     console.warn('Search query failed:', e);
     setSearchError(null); // Fallback to 'no results' screen
    }
   } finally {
    if (currentQueryRef.current === cleanQ) {
     setLoading(false);
    }
   }
  },
  [processSearchResults]
 );

 // Debounce live full search so users get fast, automatic results without flooding requests
 useEffect(() => {
  const trimmed = searchQuery.trim();
  if (!trimmed) {
   setResults(null);
   setLoading(false);
   setSearchError(null);
   return;
  }

  const timer = setTimeout(() => {
   executeFullSearch(trimmed);
  }, 1200);

  return () => clearTimeout(timer);
 }, [searchQuery, executeFullSearch]);

 const playSuggestionTrack = async (sug: SearchSuggestion, e: React.MouseEvent) => {
  e.stopPropagation();
  setSuggestions([]);
  try {
   const res = await api.getTrack(sug.id);
   if (res && res.success && res.data) {
    recordInteraction('search_selection', res.data.id, res.data.artist, searchQuery, res.data);
    playTrack(res.data, [res.data]);
    return;
   }
  } catch (err) {
   console.warn('Failed to fetch real track data for suggestion:', err);
  }
  
  // Fallback if real fetch fails
  const t: Track = {
   id: sug.id,
   title: sug.title,
   artist: sug.artist || 'Artist',
   artistId: `artist-${encodeURIComponent(sug.artist || 'unknown')}`,
   album: sug.album || 'Single',
   albumId: `album-${sug.id}`,
   duration: 210,
   provider: 'unified',
   playbackAvailability: true,
   streamUrl: '',
   mimeType: 'audio/mp4',
   images: {
    small: sug.image || '',
    medium: sug.image || '',
    large: sug.image || '',
   },
   release_date: sug.release_date || sug.releaseDate,
   releaseDate: sug.releaseDate || sug.release_date,
   releaseYear: sug.releaseYear,
   play_count: sug.play_count ?? sug.plays ?? sug.views,
   plays: sug.plays ?? sug.play_count ?? sug.views,
   views: sug.views ?? sug.plays ?? sug.play_count,
  };
  recordInteraction('search_selection', t.id, t.artist, searchQuery, t);
  playTrack(t, [t]);
 };

 const submitSearch = useCallback(
  (query: string, matchedTrack?: Track) => {
   const cleanQ = query.trim();
   if (!cleanQ && !matchedTrack) return;

   setIsSearchFocused(true);
   setSuggestions([]);
   
   const finalQuery = matchedTrack ? matchedTrack.title : cleanQ;
   
   if (onSearchChange) {
    onSearchChange(finalQuery);
   }
   if (matchedTrack) {
    playTrack(matchedTrack, [matchedTrack]);
   }
   executeFullSearch(finalQuery);
  },
  [onSearchChange, executeFullSearch, playTrack]
 );

 useEffect(() => {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (SpeechRecognition && !recognitionRef.current) {
   recognitionRef.current = new SpeechRecognition();
   recognitionRef.current.continuous = false;
   recognitionRef.current.interimResults = true;
  }
 }, []);

 const closeVoiceSearch = useCallback(() => {
  if (recognitionRef.current) {
   try {
    recognitionRef.current.stop();
   } catch (e) {}
  }
  setIsListening(false);
  setIsVoiceOpen(false);
  setVoiceTranscript('');
 }, []);

 const openVoiceSearch = useCallback(() => {
  setIsVoiceOpen(true);
  setVoiceTranscript('');
  if (!recognitionRef.current) {
   showToast("Voice search isn't supported in this browser.", { iconType: 'info' });
   return;
  }
  try {
   recognitionRef.current.start();
  } catch (e: any) {
   if (e?.name !== 'InvalidStateError') {
    console.warn('[VoiceSearch] Failed to start speech recognition:', e?.message || e);
   }
  }
 }, [showToast]);

 useEffect(() => {
  if (recognitionRef.current) {
   recognitionRef.current.onstart = () => {
    setIsListening(true);
   };
   
   recognitionRef.current.onend = () => {
    setIsListening(false);
   };
   
   recognitionRef.current.onerror = (event: any) => {
    setIsListening(false);
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
     console.warn('[VoiceSearch] Microphone permission denied or blocked:', event.error);
     showToast('Microphone permission is required for voice search. Please allow microphone access.', { iconType: 'info' });
    } else if (event.error === 'no-speech') {
     showToast("I couldn't hear anything. Try again.", { iconType: 'info' });
    } else if (event.error === 'aborted') {
     // Clean abort when closing voice search
    } else {
     console.warn('[VoiceSearch] Speech recognition notice:', event.error);
    }
   };
   
   recognitionRef.current.onresult = (event: any) => {
    let finalTranscript = '';
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
     const transcript = event.results[i][0].transcript;
     if (event.results[i].isFinal) {
      finalTranscript += transcript;
     } else {
      interimTranscript += transcript;
     }
    }
    
    if (finalTranscript) {
     const cleanQuery = finalTranscript.trim();
     setVoiceTranscript(cleanQuery);
     if (onSearchChange) onSearchChange(cleanQuery);
     setIsSearchFocused(true);
     submitSearch(cleanQuery);
     // Auto close voice overlay after brief moment so user immediately sees their search results!
     setTimeout(() => {
      closeVoiceSearch();
     }, 350);
    } else if (interimTranscript) {
     setVoiceTranscript(interimTranscript);
    }
   };
  }
 }, [onSearchChange, submitSearch, showToast, closeVoiceSearch]);

 const toggleVoiceSearch = () => {
  if (isVoiceOpen) {
   closeVoiceSearch();
  } else {
   openVoiceSearch();
  }
 };

 const selectQuery = (q: string) => {
  submitSearch(q);
 };

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const val = e.target.value;
   // Switch to typing/suggestions mode
  setResults(null);
  setSearchError(null);
  if (onSearchChange) {
   onSearchChange(val);
  }
 };

 const handleFormSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const trimmed = searchQuery.trim();
  if (trimmed) {
   submitSearch(trimmed);
  }
 };

 const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
   e.preventDefault();
   const trimmed = searchQuery.trim();
   if (trimmed) {
    submitSearch(trimmed);
   }
  }
 };

 const removeRecent = (id: string) => {
  removeRecentSearch(id);
 };

 const handleDiscoverCardClick = (card: RealDiscoverCard) => {
  if (card.track) {
   const queue = discoverCards.map((c) => c.track).filter(Boolean) as Track[];
   playTrack(card.track, queue.length > 0 ? queue : [card.track]);
  } else {
   selectQuery(card.query);
  }
 };

 const filteredLanguages = ALL_SPOTIFY_LANGUAGES.filter((lang) => {
  if (languageTab === 'Indian') return lang.category === 'Indian';
  if (languageTab === 'Global') return lang.category === 'Global';
  return true;
 });

 return (
  <motion.div
   initial={{ opacity: 0, y: 8 }}
   animate={{ opacity: 1, y: 0 }}
   transition={{ duration: 0.25 }}
   className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto"
  >
   {/* Active Search & Recents Mode Header (When Search is Focused or Query is Active) */}
   {(isSearchFocused || searchQuery.trim()) ? (
    <div className="space-y-4">
     {/* Top Bar for Active Search */}
     <div className="flex items-center gap-2.5 pt-1 select-none">
      <button
       onClick={() => {
        setIsSearchFocused(false);
        if (onSearchChange) onSearchChange('');
        if (searchInputRef.current) searchInputRef.current.blur();
       }}
       className="p-2.5 -ml-1 text-white hover:text-neutral-200 active:scale-90 transition-all cursor-pointer rounded-full hover:bg-white/10 active:bg-white/15"
       title="Back"
       aria-label="Back to browse"
      >
       <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
      </button>

      {/* Liquid Glass Search Input Capsule */}
      <form
       onSubmit={handleFormSubmit}
       className="flex-1 liquid-glass-active-input rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 transition-all"
      >
       <Search className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 stroke-[2.2] flex-shrink-0" />
       <input
        ref={searchInputRef}
        type="text"
        value={searchQuery || ''}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        autoFocus
        placeholder={isListening ?"Listening..." :"What do you want to listen to?"}
        className={`w-full bg-transparent text-white placeholder-neutral-400 font-medium text-sm sm:text-base outline-none tracking-tight caret-emerald-400 ${isListening ? 'animate-pulse text-emerald-400' : ''}`}
       />
       {searchQuery && (
        <button
         type="button"
         onClick={() => {
          if (onSearchChange) onSearchChange('');
          if (searchInputRef.current) searchInputRef.current.focus();
         }}
         className="p-1 text-neutral-400 hover:text-white active:scale-90 transition-all cursor-pointer rounded-full hover:bg-white/10"
         title="Clear search"
        >
         <X className="w-4 h-4 stroke-[2.2]" />
        </button>
       )}
       
       <div className="w-px h-4 bg-white/10 mx-1"></div>
       
       <button
        type="button"
        onClick={() => setIsScannerOpen(true)}
        className="p-1.5 active:scale-90 transition-all cursor-pointer rounded-full flex-shrink-0 text-neutral-400 hover:text-white hover:bg-white/10"
        title="Scan Spotiz Song QR Code"
        aria-label="Scan Spotiz Song QR Code"
       >
        <Camera className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
       </button>

       <button
        type="button"
        onClick={openVoiceSearch}
        className={`p-1.5 active:scale-90 transition-all cursor-pointer rounded-full flex-shrink-0 ${isVoiceOpen ? 'text-emerald-400 bg-emerald-400/10' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
        title="Search with Voice"
       >
        <Mic className={`w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] ${isListening ? 'animate-pulse' : ''}`} />
       </button>
      </form>
     </div>

     {/* Filter Tabs (When searching with text) */}
     {searchQuery.trim() && (
      <div className="flex items-center gap-2 flex-wrap pb-1 pt-1">
       {(['all', 'songs', 'artists', 'albums', 'playlists'] as FilterType[]).map((filter) => (
        <button
         key={filter}
         onClick={() => setActiveFilter(filter)}
         className={`relative px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider capitalize transition-all cursor-pointer active:scale-95 ${
          activeFilter === filter
           ? 'bg-white text-neutral-950 shadow-md ring-1 ring-white/20'
           : 'bg-white/[0.08] hover:bg-white/[0.12] active:bg-white/[0.16] text-neutral-300 border border-white/10'
         }`}
        >
         {filter}
        </button>
       ))}
      </div>
     )}

     {/* When Tapped/Focused on Search Bar with Empty Query: Display Recents List matching Screenshot */}
     {!searchQuery.trim() && (
      <div className="space-y-4 pt-2">
       <div className="flex items-center justify-between px-1">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
         Recents
        </h2>
        {recentSearches.length > 0 && (
         <button
          onClick={() => clearRecentSearches()}
          className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
         >
          Clear all
         </button>
        )}
       </div>

       {recentSearches.length === 0 ? (
        <div className="py-12 text-center text-neutral-400 text-sm">
         <p>No recent searches yet.</p>
        </div>
       ) : (
        <div className="flex flex-col gap-1">
         <AnimatePresence>
          {recentSearches.map((item) => {
           const isLiked = item.type === 'track'
            ? isTrackLiked(item.id)
            : (item.type === 'artist' ? (isArtistFollowed(item.id) || isArtistFollowed(item.title)) : false);
           const isThisPlaying =
            item.type === 'track' && currentTrack?.id === item.id && isPlaying;

           return (
            <motion.div
             key={item.id}
             layout
             initial={{ opacity: 0, y: 8 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.95 }}
             transition={{ duration: 0.15 }}
             onClick={() => {
              if (item.type === 'track') {
               const dummyTrack: Track = {
                id: item.id,
                title: item.title,
                artist: item.subtitle.replace(/^(Single|Song)\s*•\s*/i, '').trim() || item.title,
                artistId: 'artist-' + item.id,
                album: item.subtitle,
                albumId: 'album-' + item.id,
                duration: 210,
                streamUrl: '',
                provider: 'spotiz',
                mimeType: 'audio/mpeg',
                playbackAvailability: true,
                images: { small: item.image, medium: item.image, large: item.image },
               };
               playTrack(dummyTrack);
               addRecentItem(item);
              } else if (item.type === 'artist') {
               onNavigate({ type: 'artist', artistId: item.id });
              } else if (item.type === 'album') {
               onNavigate({ type: 'album', albumId: item.id });
              } else if (item.type === 'playlist') {
               onNavigate({ type: 'playlist', playlistId: item.id });
              } else if (item.query) {
               selectQuery(item.query);
              }
             }}
             className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer group"
            >
             {/* Artwork thumbnail */}
             <div className="relative w-12 h-12 flex-shrink-0 overflow-hidden bg-neutral-900 shadow-md rounded-md">
              <img
               src={item.image || 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&q=80'}
               alt={item.title}
               className={`w-full h-full object-cover shadow-sm ${item.type === 'artist' ? 'rounded-full' : 'rounded-md'}`}
               loading="lazy"
              />
             </div>

             {/* Title & Subtitle */}
             <div className="flex-1 min-w-0 pr-2 flex flex-col justify-center">
              <h4
               className={`text-sm sm:text-base truncate ${
                isThisPlaying ? 'text-emerald-400 font-semibold' : 'text-white font-medium'
               }`}
              >
               {item.title}
              </h4>
              <p className="text-xs text-neutral-400 truncate mt-0.5">
               {item.subtitle}
              </p>
             </div>

             {/* Actions on right: (+) / (✓) and (×) */}
             <div className="flex items-center gap-2 flex-shrink-0">
              {/* Collection / Liked toggle button */}
              <button
               onClick={(e) => {
                e.stopPropagation();
                if (item.type === 'track') {
                 const dummyTrack: Track = {
                  id: item.id,
                  title: item.title,
                  artist: item.subtitle.replace(/^(Single|Song)\s*•\s*/i, '').trim() || item.title,
                  artistId: 'artist-' + item.id,
                  album: item.subtitle,
                  albumId: 'album-' + item.id,
                  duration: 210,
                  streamUrl: '',
                  provider: 'spotiz',
                  mimeType: 'audio/mpeg',
                  playbackAvailability: true,
                  images: { small: item.image, medium: item.image, large: item.image },
                 };
                 toggleLikeTrack(dummyTrack);
                } else if (item.type === 'artist') {
                 toggleFollowArtist({ id: item.id, name: item.title, image: item.image });
                }
               }}
               className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
               title={isLiked ? 'In your Library' : 'Add to collection'}
              >
               {isLiked ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                 <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                </div>
               ) : (
                <PlusCircle className="w-5 h-5 stroke-[1.5]" />
               )}
              </button>

              {/* Remove from recents button */}
              <button
               onClick={(e) => {
                e.stopPropagation();
                removeRecent(item.id);
               }}
               className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
               title="Remove from recents"
              >
               <X className="w-5 h-5 stroke-[1.75]" />
              </button>
             </div>
            </motion.div>
           );
          })}
         </AnimatePresence>
        </div>
       )}
      </div>
     )}
    </div>
   ) : (
    /* Overview Mode Header & Browse (When Search is Not Focused & Query is Empty) */
    <div className="space-y-6">
     {/* 1. Spotify Top Header: Profile avatar on left (matching homepage),"Search" title, Camera icon on right */}
     <div className="flex items-center justify-between pt-1 select-none">
      <div className="flex items-center gap-3">
       {/* User Profile Avatar matching homepage */}
       <button
        onClick={() => setIsProfileDrawerOpen(true)}
        className="flex-shrink-0 rounded-full hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        title="Open Profile & Menu"
        aria-label="Open Profile and settings menu"
       >
        <UserAvatar
         avatarUrl={profile?.avatar}
         name={profile?.name || 'Guest User'}
         sizeClassName="w-8 h-8 sm:w-9 sm:h-9"
         iconClassName="w-4 h-4 text-neutral-300"
        />
       </button>

       {/* Large Bold"Search" Title */}
       <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
        Search
       </h1>
      </div>

      {/* Camera / QR Scanner Icon Button on Top-Right */}
      <button
       type="button"
       onClick={() => setIsScannerOpen(true)}
       className="p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-neutral-200 hover:text-white transition-all cursor-pointer shadow-md flex items-center justify-center border border-white/10 group"
       title="Scan Spotiz Song QR Code"
       aria-label="Scan Spotiz Song QR Code"
      >
       <Camera className="w-5 h-5 text-neutral-200 group-hover:text-emerald-400 transition-colors" />
      </button>
     </div>

     {/* 2. Official Spotiz Liquid Glass Search Capsule ("What do you want to listen to?") */}
     <div
      onClick={() => {
       setIsSearchFocused(true);
       setTimeout(() => {
        searchInputRef.current?.focus();
       }, 50);
      }}
      className="relative cursor-pointer group"
     >
      <div className="w-full liquid-glass-search-capsule rounded-2xl px-4 py-3.5 sm:py-4 flex items-center justify-between gap-3 shadow-lg select-none">
       <div className="flex items-center gap-3 min-w-0 flex-1">
        <Search className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-900 stroke-[2.4] flex-shrink-0 group-hover:scale-105 transition-transform" />
        <span className="text-neutral-800 font-semibold text-sm sm:text-base tracking-tight truncate">
         What do you want to listen to?
        </span>
       </div>
       <div className="flex items-center gap-1.5">
        <button
         type="button"
         onClick={(e) => {
          e.stopPropagation();
          setIsScannerOpen(true);
         }}
         className="p-1.5 active:scale-90 transition-all rounded-full flex-shrink-0 cursor-pointer text-neutral-700 hover:text-neutral-950 hover:bg-black/5"
         title="Scan Spotiz Song QR Code"
         aria-label="Scan Spotiz Song QR Code"
        >
         <Camera className="w-5 h-5 stroke-[2.2]" />
        </button>
        <button
         type="button"
         onClick={(e) => {
          e.stopPropagation();
          openVoiceSearch();
         }}
         className={`p-1.5 active:scale-90 transition-all rounded-full flex-shrink-0 cursor-pointer ${isListening ? 'text-emerald-600 bg-emerald-500/10' : 'text-neutral-700 hover:text-neutral-950 hover:bg-black/5'}`}
         title="Search with Voice"
        >
         <Mic className={`w-5 h-5 stroke-[2.2] ${isListening ? 'animate-pulse' : ''}`} />
        </button>
       </div>
      </div>
     </div>

     {/* B. Top 4 Category Cards (Music, Podcasts, Live Events, Home of I-Pop) matching Spotify */}
     <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {TOP_4_SPOTLIGHT_CATEGORIES.map((cat) => (
       <motion.div
        key={cat.id}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => selectQuery(cat.query)}
        style={{ background: cat.glassGradient }}
        className="group relative h-24 sm:h-32 rounded-xl p-3 sm:p-4 overflow-hidden border border-white/10 shadow-lg cursor-pointer flex flex-col justify-start transition-all"
       >
        <h3 className="relative z-10 text-base sm:text-lg font-black text-white tracking-tight leading-snug whitespace-pre-line drop-shadow-md">
         {cat.title}
        </h3>

        {/* Rotated decorative art image on bottom-right corner */}
        {cat.image && (
         <img
          src={cat.image}
          alt={cat.title}
          className="absolute -right-3 -bottom-2 w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover shadow-2xl transform rotate-[25deg] group-hover:rotate-[18deg] group-hover:scale-105 transition-transform duration-300 pointer-events-none"
          loading="lazy"
         />
        )}
       </motion.div>
      ))}
     </div>

     {/* Promotional Video Ad Component embedded natively below Search Categories */}
     <div className="my-2">
      <PromotionalAdCard onNavigate={onNavigate} />
     </div>

     {/* C."Discover something new" Portrait Cards Section */}
     <section className="space-y-3.5">
      <div className="flex items-center justify-between px-1">
       <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
        Discover something new
       </h2>
      </div>

      {/* Horizontally scrollable container for portrait 9:16 cards */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
       {discoverCards.map((card) => {
        const isThisPlaying = card.track && currentTrack?.id === card.track.id && isPlaying;
        return (
         <motion.div
          key={card.id}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleDiscoverCardClick(card)}
          className="group relative flex-shrink-0 w-36 sm:w-44 h-56 sm:h-64 rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-xl cursor-pointer flex flex-col justify-end p-3.5 transition-all"
         >
          {/* Background Portrait Image */}
          <img
           src={card.image || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80'}
           alt={card.title}
           className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 brightness-90 group-hover:brightness-100"
           loading="lazy"
          />

          {/* Gradient Overlay for bottom text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

          {/* Hashtag tag at bottom-left exactly as in screenshot */}
          <div className="relative z-10">
           <span className="text-sm sm:text-base font-extrabold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-1">
            {card.tag}
           </span>
          </div>

          {/* Floating Play button on hover */}
          <button
           onClick={(e) => {
            e.stopPropagation();
            if (card.track) {
             if (isThisPlaying) {
              togglePlay();
             } else {
              const queue = discoverCards.map((c) => c.track).filter(Boolean) as Track[];
              playTrack(card.track, queue.length > 0 ? queue : [card.track]);
             }
            } else {
             selectQuery(card.query);
            }
           }}
           className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95 cursor-pointer"
           title={isThisPlaying ? 'Pause' : 'Play'}
          >
           {isThisPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-black" />
           ) : (
            <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
           )}
          </button>
         </motion.div>
        );
       })}
      </div>
     </section>

     {/* D. Explore by Language Section */}
     <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
       <div className="flex items-center gap-2">
        <Languages className="w-5 h-5 text-emerald-400" />
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
         Explore by language
        </h2>
       </div>

       {/* Language Tabs: All / Indian / Global */}
       <div className="flex items-center gap-1.5 p-1 bg-neutral-900/90 rounded-full border border-white/5 w-fit">
        {(['all', 'Indian', 'Global'] as const).map((tab) => (
         <button
          key={tab}
          onClick={() => setLanguageTab(tab)}
          className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all capitalize cursor-pointer ${
           languageTab === tab
            ? 'bg-white text-black shadow-md'
            : 'text-neutral-400 hover:text-white'
          }`}
         >
          {tab === 'all' ? 'All Languages' : tab}
         </button>
        ))}
       </div>
      </div>

      {/* Language Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
       {filteredLanguages.map((lang) => {
        const gradient = getLanguageGlassGradient(lang.color);
        return (
         <motion.div
          key={lang.name}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => selectQuery(lang.query)}
          style={{ background: gradient }}
          className="group relative p-4 rounded-2xl border border-white/10 shadow-lg cursor-pointer overflow-hidden flex flex-col justify-between min-h-[110px]min-h-[125px] transition-all"
         >
          <div className="relative z-10 flex items-start justify-between">
           <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
             {lang.name}
            </h3>
            <p className="text-xs text-white/80 font-medium mt-0.5 line-clamp-1">
             {lang.desc}
            </p>
           </div>
           <span className="text-xl sm:text-2xl font-black text-white/40 group-hover:text-white/80 transition-colors select-none font-serif">
            {lang.native}
           </span>
          </div>

          <div className="relative z-10 flex items-center justify-between mt-2 pt-1 border-t border-white/10">
           <span className="text-[11px] font-semibold text-white/70">
            {lang.category} Music
           </span>
           <Search className="w-3.5 h-3.5 text-white/60 group-hover:text-white transition-colors" />
          </div>
         </motion.div>
        );
       })}
      </div>
     </section>
    </div>
   )}

   {/* 5. Live Search Suggestions & Matching Dropdown (When typing) */}
   {searchQuery.trim() && !results && !loading && (matchingRecentSearches.length > 0 || suggestions.length > 0) && (
    <div className="space-y-3 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 shadow-2xl">
     {/* Quick Submit Row */}
     <div
      onClick={() => executeFullSearch(searchQuery)}
      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer text-white"
     >
      <div className="flex items-center gap-3 min-w-0">
       <Search className="w-5 h-5 text-emerald-400 flex-shrink-0" />
       <span className="text-sm font-semibold truncate">
        Search for <strong className="text-emerald-400">&ldquo;{searchQuery}&rdquo;</strong>
       </span>
      </div>
      <ArrowUpLeft className="w-4 h-4 text-neutral-400" />
     </div>

     {/* Matching Recent Searches */}
     {matchingRecentSearches.length > 0 && (
      <div className="space-y-1 pt-1 border-t border-white/5">
       <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2">
        Recent Matches
       </span>
       {matchingRecentSearches.map((item) => (
        <div
         key={`match-${item.id}`}
         onClick={() => {
          setSuggestions([]);
          if (item.type === 'track') {
           const dummyTrack: any = {
            id: item.id,
            title: item.title,
            artist: item.subtitle.replace('Song • ', '').replace('Single • ', ''),
            images: { small: item.image, medium: item.image, large: item.image },
           };
           playTrack(dummyTrack);
           selectQuery(item.title);
          } else if (item.type === 'artist') {
           onNavigate({ type: 'artist', artistId: item.id });
          } else if (item.type === 'album') {
           onNavigate({ type: 'album', albumId: item.id });
          } else if (item.type === 'playlist') {
           onNavigate({ type: 'playlist', playlistId: item.id });
          } else if (item.query) {
           selectQuery(item.query);
          }
         }}
         className="flex items-center justify-between p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
        >
         <div className="flex items-center gap-3 min-w-0">
          <Clock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <img
           src={item.image || 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=400&q=80'}
           alt={item.title}
           className="w-8 h-8 rounded object-cover flex-shrink-0"
          />
          <div className="min-w-0">
           <p className="text-sm font-medium text-white truncate">{item.title}</p>
           <p className="text-xs text-neutral-400 truncate">{item.subtitle}</p>
          </div>
         </div>
         <ArrowUpLeft className="w-4 h-4 text-neutral-400" />
        </div>
       ))}
      </div>
     )}

     {/* Predictive Song & Artist Suggestions */}
     {suggestions.length > 0 && (
      <div className="space-y-1 pt-1 border-t border-white/5">
       <div className="flex items-center justify-between px-2 pb-1">
        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
         Suggestions
        </span>
        {loadingSuggestions && (
         <span className="text-[11px] text-emerald-400 animate-pulse">
          Updating...
         </span>
        )}
       </div>
       {suggestions.slice(0, 5).map((sug) => (
        <div
         key={sug.id}
         onClick={(e) => {
          setSuggestions([]);
          if (sug.type === 'artist') {
           addRecentItem({
            id: sug.id,
            title: sug.title,
            subtitle: 'Artist',
            image: sug.image || '',
            type: 'artist',
           });
           onNavigate({ type: 'artist', artistId: sug.id, expectedName: sug.title });
          } else {
           playSuggestionTrack(sug, e);
           addRecentItem({
            id: sug.id,
            title: sug.title,
            subtitle: `Song • ${sug.artist || 'Artist'}`,
            image: sug.image || '',
            type: 'track',
           });
           selectQuery(sug.title);
          }
         }}
         className="flex items-center justify-between p-2 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer group"
        >
         <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800 shadow-sm">
           <img
            src={sug.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80'}
            alt={sug.title}
            className={`w-full h-full object-cover ${sug.type === 'artist' ? 'rounded-full' : 'rounded-md'}`}
           />
          </div>
          <div className="min-w-0 flex-1">
           <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
            {sug.title}
           </p>
           <p className="text-xs text-neutral-400 truncate">
            {sug.type === 'artist' ? 'Artist' : `Song • ${sug.artist || 'Artist'}`}
           </p>
          </div>
         </div>

         <div className="flex items-center gap-2 flex-shrink-0">
          {sug.type === 'song' ? (
           <button
            onClick={(e) => {
             e.stopPropagation();
             setSuggestions([]);
             playSuggestionTrack(sug, e);
             selectQuery(sug.title);
            }}
            className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
            title="Play"
           >
            <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
           </button>
          ) : (
           <ArrowUpLeft className="w-4 h-4 text-neutral-400" />
          )}
         </div>
        </div>
       ))}
      </div>
     )}
    </div>
   )}

   

   {/* 6. Submitted Search View: Loading Skeleton Indicator (Only if no results yet) */}
   {searchQuery.trim() && loading && (!results || results.songs.length === 0) && (
    <div className="space-y-6 animate-pulse py-2">
     <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 h-56 rounded-3xl bg-neutral-900/90 border border-white/5 p-5 flex flex-col justify-between" />
      <div className="lg:col-span-7 space-y-2">
       <div className="h-4 w-24 bg-neutral-800 rounded" />
       {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 bg-neutral-900/60 rounded-xl" />
       ))}
      </div>
     </div>
    </div>
   )}

   {/* 7. Submitted Search View: Error state */}
   {searchQuery.trim() && searchError && !loading && (!results || results.songs.length === 0) && (
    <motion.div
     initial={{ opacity: 0, scale: 0.95 }}
     animate={{ opacity: 1, scale: 1 }}
     className="py-16 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto"
    >
     <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
      <AlertCircle className="w-7 h-7" />
     </div>
     <h3 className="text-lg font-bold text-white">Cannot connect to search</h3>
     <p className="text-xs text-neutral-400">
      Check your network connection and try again.
     </p>
     <button
      onClick={() => executeFullSearch(searchQuery)}
      className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
     >
      Retry
     </button>
    </motion.div>
   )}

   {/* 8. Submitted Search View: Full Results Display */}
   {searchQuery.trim() && results && !searchError && (
    <motion.div
     initial={{ opacity: 0, y: 10 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.2 }}
     className="space-y-8"
    >
     {/* A. Top Result + Songs Split View for 'All' Filter */}
     {activeFilter === 'all' && results.topResult && !(results.topResult.type === 'track' && isTrackHidden((results.topResult.data as Track).id)) && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
       {/* Top Result Column */}
       <div className="lg:col-span-5 space-y-2 flex flex-col">
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">Top result</h3>
        <div
         onClick={() => {
          if (results.topResult?.type === 'track') {
           const t = results.topResult.data as Track;
           recordInteraction('search_selection', t.id, t.artist, searchQuery, t);
           playTrack(t, [t]);
          } else if (results.topResult?.type === 'artist') {
           onNavigate({ 
            type: 'artist', 
            artistId: (results.topResult.data as any).id,
            expectedName: (results.topResult.data as any).name
           });
          } else if (results.topResult?.type === 'album') {
           onNavigate({ type: 'album', albumId: (results.topResult.data as any).id });
          }
         }}
         className="group relative p-5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800/80 border border-white/5 transition-all duration-200 cursor-pointer flex flex-col justify-between flex-1 min-h-[220px]"
        >
         <div>
          <div
           className={`relative mb-4 overflow-hidden shadow-2xl bg-neutral-800 ${
            results.topResult.type === 'artist' ? 'w-24 h-24 rounded-full' : 'w-24 h-24 rounded-xl'
           }`}
          >
           {results.topResult.type === 'artist' ? (
            <ArtistAvatar
             id={(results.topResult.data as any).id}
             name={(results.topResult.data as any).name || (results.topResult.data as any).title}
             image={(results.topResult.data as any).image}
             sizeClassName="w-full h-full"
             iconClassName="w-12 h-12 text-neutral-400"
            />
           ) : (
            <img
             src={
              results.topResult.type === 'track'
               ? (results.topResult.data as Track).images?.large || (results.topResult.data as Track).images?.medium || (results.topResult.data as Track).images?.small || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
               : (results.topResult.data as any).images?.large || (results.topResult.data as any).images?.medium || (results.topResult.data as any).image || (results.topResult.data as any).coverImage || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
             }
             alt="Top Result"
             referrerPolicy="no-referrer"
             onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = 'none';
             }}
             className="w-full h-full object-cover"
            />
           )}
          </div>
          <div className="flex items-center gap-2">
           <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight line-clamp-1 group-hover:text-emerald-400 transition-colors">
            {results.topResult.type === 'track'
             ? (results.topResult.data as Track).title
             : (results.topResult.data as any).name || (results.topResult.data as any).title}
           </h2>
           {results.topResult.type === 'track' && (results.topResult.data as Track).isOriginal && (
            <span title="Original / Canonical Track" className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest bg-[#1ed760]/10 text-[#1ed760] border border-[#1ed760]/20 shrink-0 mt-0.5">
             Original
            </span>
           )}
          </div>
          <div className="flex items-center gap-2 mt-2">
           <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-black/60 text-white/90 border border-white/10">
            {results.topResult.type}
           </span>
           <span className="text-xs text-neutral-400 font-medium truncate">
            {results.topResult.type === 'track'
             ? (results.topResult.data as Track).artist
             : results.topResult.type === 'artist'
             ? 'Artist'
             : (results.topResult.data as any).artist || 'Album'}
           </span>
          </div>
         </div>

         {/* Spotiz Circular Play Button */}
         <div className="absolute right-5 bottom-5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 shadow-2xl">
          <button
           onClick={(e) => {
            e.stopPropagation();
            if (results.topResult?.type === 'track') {
             playTrack(results.topResult.data as Track, [results.topResult.data as Track]);
            } else if (results.topResult?.type === 'artist' && (results.topResult.data as any).topTracks?.length > 0) {
             playTrack((results.topResult.data as any).topTracks[0], (results.topResult.data as any).topTracks);
            }
           }}
           className="w-12 h-12 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-xl transition-transform cursor-pointer"
          >
           <Play className="w-5 h-5 fill-black ml-0.5" />
          </button>
         </div>
        </div>
       </div>

       {/* Songs Column */}
       <div className="lg:col-span-7 space-y-2">
        <div className="flex items-center justify-between px-1">
         <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">Songs</h3>

        </div>

        <div className="space-y-1">
         {results.songs.filter(track => !isTrackHidden(track.id)).map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;
          const isLiked = isTrackLiked(track.id);

          return (
           <div
            key={`${track.id}-${idx}`}
            onClick={() => {
             recordInteraction('search_selection', track.id, track.artist, searchQuery, track);
             playTrack(track, [track]);
             addRecentItem({
              id: track.id,
              title: track.title,
              subtitle: `Song • ${track.artist}`,
              image: track.images?.small || track.images?.medium || track.images?.large || '',
              type: 'track'
             });

            }}
            className={`group relative flex items-center justify-between p-2 rounded-xl transition-all duration-150 cursor-pointer ${
             isCurrent ? 'bg-neutral-800/90' : 'hover:bg-neutral-900/90 active:bg-neutral-800/60'
            }`}
           >
            <div className="flex items-center gap-3 min-w-0 flex-1">
             <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 shadow-md">
              <img
               src={track.images?.small || track.images?.medium || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'}
               alt={track.title}
               referrerPolicy="no-referrer"
               className="w-full h-full object-cover"
              />
              {isCurrent && isPlaying && (
               <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="w-1 bg-[#1ed760] rounded-full h-3 animate-pulse" />
               </div>
              )}
             </div>
             <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-1.5 min-w-0">
               <p className={`text-sm font-bold truncate ${isCurrent ? 'text-[#1ed760]' : 'text-white'}`}>
                {track.title}
               </p>
               {track.isOriginal && (
                <span title="Original / Canonical Track" className="px-1 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-widest bg-[#1ed760]/10 text-[#1ed760] border border-[#1ed760]/20 shrink-0">
                 Original
                </span>
               )}
              </div>
              <p className="text-xs text-neutral-400 truncate mt-0.5">{track.artist}</p>
             </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
             <button
              onClick={(e) => {
               e.stopPropagation();
               toggleLikeTrack(track);
              }}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
               isLiked ? 'text-red-500' : 'text-neutral-400 hover:text-white'
              }`}
              title={isLiked ? 'Unlike' : 'Like'}
             >
              <Heart className={`w-4 h-4 transition-transform ${isLiked ? 'text-red-500 fill-red-500 scale-105' : ''}`} />
             </button>
            </div>
           </div>
          );
         })}
        </div>
       </div>
      </div>
     )}

     {/* B. Songs List (When Songs Filter active, or additional songs in All) */}
     {(activeFilter === 'songs' || (activeFilter === 'all' && !results.topResult)) && results.songs.length > 0 && (
      <section className="space-y-2">
       <div className="flex items-center justify-between px-1">
        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
         Songs
        </h3>
        <span className="text-xs text-neutral-400 font-semibold">
         {results.songs.length} verified tracks
        </span>
       </div>

       <div className="space-y-1">
        {results.songs.filter(track => !isTrackHidden(track.id)).map((track, idx) => {
         const isCurrent = currentTrack?.id === track.id;
         const isLiked = isTrackLiked(track.id);
         const isDownloaded = isTrackDownloaded(track.id);
         const downloadProgress = getTrackDownloadProgress(track.id);
         const isDownloading = downloadProgress !== undefined;

         return (
          <div
           key={`${track.id}-${idx}`}
           onClick={() => {
            recordInteraction('search_selection', track.id, track.artist, searchQuery, track);
            playTrack(track, [track]);
             addRecentItem({
              id: track.id,
              title: track.title,
              subtitle: `Song • ${track.artist}`,
              image: track.images?.small || track.images?.medium || track.images?.large || '',
              type: 'track'
             });

           }}
           className={`group relative flex flex-col p-2 sm:p-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
            isCurrent
             ? 'bg-neutral-800/90'
             : 'hover:bg-neutral-900/90 active:bg-neutral-800/60'
           }`}
          >
           <div className="flex items-center justify-between min-w-0 w-full">
            {/* Left: Artwork + Title &"Song • Artist" */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
             <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 shadow-md flex items-center justify-center">
              {track.images?.small || track.images?.medium || track.images?.large ? (
               <img
                src={
                 track.images?.small ||
                 track.images?.medium ||
                 track.images?.large
                }
                alt={track.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                 e.currentTarget.onerror = null;
                 e.currentTarget.style.display = 'none';
                }}
                className="w-full h-full object-cover"
               />
              ) : (
               <Music className="w-5 h-5 text-neutral-500" />
              )}
              {isCurrent && isPlaying && (
               <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex items-end gap-0.5 h-4">
                 <span className="w-1 bg-[#1ed760] rounded-full h-full animate-pulse" />
                 <span className="w-1 bg-[#1ed760] rounded-full h-2.5 animate-pulse delay-75" />
                 <span className="w-1 bg-[#1ed760] rounded-full h-3.5 animate-pulse delay-150" />
                </div>
               </div>
              )}
              {isDownloading && (
               <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Download className="w-4 h-4 text-emerald-400 animate-bounce" />
               </div>
              )}
             </div>

             <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-1.5 min-w-0">
               <p
                className={`text-sm sm:text-base font-bold truncate leading-snug ${
                 isCurrent ? 'text-[#1ed760]' : 'text-white'
                }`}
               >
                {isCurrent && <span className="text-[#1ed760] mr-1">...</span>}
                {track.title}
               </p>
               {track.isOriginal && (
                <span title="Original / Canonical Track" className="px-1 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-widest bg-[#1ed760]/10 text-[#1ed760] border border-[#1ed760]/20 shrink-0">
                 Original
                </span>
               )}
               {isDownloaded && !isDownloading && (
                <span title="Downloaded for offline playback" className="flex-shrink-0">
                 <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/20" />
                </span>
               )}
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-400 truncate mt-0.5 font-medium">
               <span>Song • {track.artist}</span>
               {isDownloading && (
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 ml-1 animate-pulse">
                 <span>• Downloading</span>
                 <span>{downloadProgress}%</span>
                </span>
               )}
              </div>
             </div>
            </div>

            {/* Right: Three Dots (⋮) and Add to Liked / Playlist Button (⊕ / +) */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
             <button
              onClick={(e) => {
               e.stopPropagation();
               setMenuTrack(track);
              }}
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
              title="More options"
             >
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
             </button>

             <button
              onClick={(e) => {
               e.stopPropagation();
               toggleLikeTrack(track);
              }}
              className={`p-2 rounded-full transition-all cursor-pointer ${
               isLiked
                ? 'text-red-500 hover:bg-red-500/10'
                : 'text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
              title={isLiked ? 'In Liked Songs' : 'Add to Liked Songs'}
             >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${isLiked ? 'text-red-500 fill-red-500 scale-105' : ''}`} />
             </button>
            </div>
           </div>

           {/* Active Visual Download Progress Bar in Search Item */}
           {isDownloading && (
            <div className="w-full mt-2 pt-0.5">
             <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
               <Download className="w-3 h-3 animate-pulse" />
               <span>Caching track for offline use...</span>
              </span>
              <span className="font-mono text-emerald-400 font-semibold">{downloadProgress}%</span>
             </div>
             <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden relative shadow-inner">
              <div
               className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-200 relative overflow-hidden"
               style={{ width: `${Math.max(4, downloadProgress || 0)}%` }}
              >
               <div className="absolute inset-0 bg-white/20 animate-[pulse_1.5s_infinite]" />
              </div>
             </div>
            </div>
           )}
          </div>
         );
        })}

        {/* Spotiz Radio / Playlist Matching Card */}
        {results.songs.length > 0 && (
         <div
          onClick={() => {
           playTrack(results.songs[0], [results.songs[0]]);
           showToast(`Playing ${searchQuery} Radio`);
          }}
          className="group flex items-center justify-between p-2 sm:p-2.5 rounded-xl hover:bg-neutral-900/90 active:bg-neutral-800/80 transition-all cursor-pointer"
         >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
           <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 shadow-md flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 border border-white/5">
            {results.songs[0]?.images?.small || results.songs[0]?.images?.medium ? (
             <img
              src={results.songs[0].images.small || results.songs[0].images.medium || undefined}
              alt="Radio"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-80"
             />
            ) : (
             <Radio className="w-6 h-6 text-emerald-400" />
            )}
           </div>
           <div className="min-w-0 flex-1 pr-2">
            <p className="text-sm sm:text-base font-bold text-white truncate leading-snug capitalize">
             {searchQuery} Radio
            </p>
            <p className="text-xs text-neutral-400 truncate mt-0.5 font-medium">
             Playlist • Spotiz • Made for you
            </p>
           </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
           <button
            onClick={(e) => {
             e.stopPropagation();
             setMenuTrack(results.songs[0]);
            }}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
            title="More options"
           >
            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
           </button>
           <button
            onClick={(e) => {
             e.stopPropagation();
             toggleLikeTrack(results.songs[0]);
            }}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
            title="Save to Library"
           >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
           </button>
          </div>
         </div>
        )}
       </div>
      </section>
     )}

     {/* C. Artists - In 'all' or 'artists' filter */}
     {(activeFilter === 'all' || activeFilter === 'artists') && results && results.artists.length > 0 && (
      <section className="space-y-4">
       <h3 className="text-lg font-bold text-white">Artists</h3>
       <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
        {results.artists.map((artist, idx) => (
         <ArtistCard key={artist.id} artist={artist} onNavigate={(view) => {
          addRecentItem({
           id: artist.id,
           title: artist.name,
           subtitle: 'Artist',
           image: artist.image || '',
           type: 'artist'
          });
          onNavigate(view);
         }} />
        ))}
       </div>
      </section>
     )}

     {/* D. Albums - In 'all' or 'albums' filter */}
     {(activeFilter === 'all' || activeFilter === 'albums') && results && results.albums.length > 0 && (
      <section className="space-y-4">
       <h3 className="text-lg font-bold text-white">Albums</h3>
       <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
        {results.albums.map((album, idx) => (
                  <AlbumCard key={`${album.id}-${idx}`} album={album} onNavigate={(view) => {
          addRecentItem({
           id: album.id,
           title: album.name,
           subtitle: `Album • ${album.artist}`,
           image: album.images?.small || album.images?.medium || album.images?.large || '',
           type: 'album'
          });
          onNavigate(view);
         }} />
        ))}
       </div>
      </section>
     )}

     {/* E. Playlists - In 'all' or 'playlists' filter */}
     {(activeFilter === 'all' || activeFilter === 'playlists') && results && results.playlists.length > 0 && (
      <section className="space-y-4">
       <h3 className="text-lg font-bold text-white">Playlists</h3>
       <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
        {results.playlists.map((playlist, idx) => (
                  <PlaylistCard key={`${playlist.id}-${idx}`} playlist={playlist} onNavigate={(view) => {
          addRecentItem({
           id: playlist.id,
           title: playlist.title,
           subtitle: 'Playlist',
           image: playlist.coverImage || '',
           type: 'playlist'
          });
          onNavigate(view);
         }} />
        ))}
       </div>
      </section>
     )}

     {/* F. Empty Results State */}
     {results &&
      !loading &&
      results.songs.length === 0 &&
      results.artists.length === 0 &&
      results.albums.length === 0 &&
      results.playlists.length === 0 && (
       <div className="py-16 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-neutral-600 mx-auto" />
        <h4 className="text-lg font-semibold text-neutral-300">
         No results found for &ldquo;{searchQuery}&rdquo;
        </h4>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
         Please check the spelling or try searching for a different artist, track title, or genre.
        </p>
       </div>
      )}
    </motion.div>
   )}

   {/* Context Menu for track actions */}
   <ContextMenu
    track={menuTrack}
    isOpen={!!menuTrack}
    onClose={() => setMenuTrack(null)}
    onNavigate={onNavigate}
   />

   {/* Profile & Settings Drawer */}
   <ProfileDrawer
    isOpen={isProfileDrawerOpen}
    onClose={() => setIsProfileDrawerOpen(false)}
    onNavigate={onNavigate}
   />

   <VoiceSearchOverlay 
    isOpen={isVoiceOpen}
    isListening={isListening} 
    onClose={closeVoiceSearch} 
    transcript={voiceTranscript}
    onToggleListening={() => {
     if (isListening) {
      try {
       recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
     } else {
      try {
       recognitionRef.current?.start();
      } catch (e: any) {
       if (e?.name !== 'InvalidStateError') {
        console.warn('[VoiceSearch] Toggle start notice:', e?.message || e);
       }
      }
     }
    }}
    onSelectSuggestion={(sugg) => {
     closeVoiceSearch();
     if (onSearchChange) onSearchChange(sugg);
     setIsSearchFocused(true);
     submitSearch(sugg);
    }}
   />

   {/* Built-in Spotiz Song QR Scanner Modal */}
   <QrScannerModal
    isOpen={isScannerOpen}
    onClose={() => setIsScannerOpen(false)}
    onScanSuccess={handleScanSuccess}
   />
  </motion.div>
 );
};

