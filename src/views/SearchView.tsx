import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchResults, SearchSuggestion, ViewState, Track } from '../types';
import { api } from '../services/apiClient';
import { usePlayer } from '../context/PlayerContext';
import { useUser } from '../context/UserContext';
import { SpotifyLogo } from '../components/Common/SpotifyLogo';
import { ArtistCard } from '../components/Common/ArtistCard';
import { AlbumCard } from '../components/Common/AlbumCard';
import { PlaylistCard } from '../components/Common/PlaylistCard';
import { ContextMenu } from '../components/Common/ContextMenu';
import { UserAvatar } from '../components/Common/UserAvatar';
import {
  Play,
  Pause,
  Clock,
  AlertCircle,
  X,
  Search,
  Languages,
  Globe2,
  Sparkles,
  ArrowLeft,
  ArrowUpLeft,
  MoreVertical,
  Plus,
  Check,
  Radio,
  Music,
  Download,
  ArrowDownCircle,
} from 'lucide-react';

interface SearchViewProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onNavigate: (view: ViewState) => void;
}

type FilterType = 'all' | 'songs' | 'artists' | 'albums' | 'playlists';

// Authentic Spotify Category Browse Cards (with perfectly matched theme artwork)
const SPOTIFY_CATEGORIES = [
  {
    id: 'music',
    title: 'Music',
    bgColor: 'bg-[#e13300]', // Pinkish Red
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=350&auto=format&fit=crop&q=80',
    query: 'Hindi Pop Hits',
  },
  {
    id: 'podcasts',
    title: 'Podcasts',
    bgColor: 'bg-[#006450]', // Dark Teal Green
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=350&auto=format&fit=crop&q=80',
    query: 'Top Podcasts',
  },
  {
    id: 'live_events',
    title: 'Live Events',
    bgColor: 'bg-[#8400e7]', // Vibrant Purple
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=350&auto=format&fit=crop&q=80',
    query: 'Live Concerts',
  },
  {
    id: 'ipop',
    title: 'Home of I-Pop',
    bgColor: 'bg-[#1e3264]', // Deep Navy Blue
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=350&auto=format&fit=crop&q=80',
    query: 'I-Pop',
  },
  {
    id: 'made_for_you',
    title: 'Made For You',
    bgColor: 'bg-[#503750]', // Plum Indigo
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=350&auto=format&fit=crop&q=80',
    query: 'Daily Mix',
  },
  {
    id: 'up_next',
    title: 'Up-Next',
    bgColor: 'bg-[#148a08]', // Spotify Green
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=350&auto=format&fit=crop&q=80',
    query: 'Trending Hits',
  },
  {
    id: 'new_releases',
    title: 'New Releases',
    bgColor: 'bg-[#283ea3]', // Royal Blue
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=350&auto=format&fit=crop&q=80',
    query: 'New Hindi Releases',
  },
  {
    id: 'rain_monsoon',
    title: 'Rain & Monsoon',
    bgColor: 'bg-[#2d46b9]', // Monsoon Teal
    image: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=350&auto=format&fit=crop&q=80',
    query: 'Barish Lofi Songs',
  },
  {
    id: 'bollywood',
    title: 'Bollywood',
    bgColor: 'bg-[#d84000]', // Fiery Orange
    image: 'https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=350&auto=format&fit=crop&q=80',
    query: 'Bollywood Hits',
  },
  {
    id: 'punjabi',
    title: 'Punjabi 101',
    bgColor: 'bg-[#ba5d07]', // Deep Amber
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=350&auto=format&fit=crop&q=80',
    query: 'Punjabi Hits',
  },
];

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
  track: Track | null;
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
  
  // Track whether the user has submitted/completed the search vs is actively typing suggestions
  const [isSubmitted, setIsSubmitted] = useState<boolean>(() => {
    return Boolean(searchQuery && searchQuery.trim().length > 0);
  });
  
  // Song Suggestions while typing
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('spotify_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Real live discover tracks loaded from the music API
  const [discoverCards, setDiscoverCards] = useState<RealDiscoverCard[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(true);

  const { track: currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const {
    profile,
    isTrackLiked,
    toggleLikeTrack,
    isTrackDownloaded,
    isDownloadingTrack,
    getTrackDownloadProgress,
    showToast,
  } = useUser();
  const [menuTrack, setMenuTrack] = useState<Track | null>(null);
  const currentQueryRef = useRef<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Matching recent search history items (title contains query)
  const matchingRecentSearches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return recentSearches.filter((item) => item.toLowerCase().includes(q)).slice(0, 3);
  }, [searchQuery, recentSearches]);

  // Fetch real matching song suggestions while typing
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || isSubmitted) {
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
          if (res.success && Array.isArray(res.data)) {
            setSuggestions(res.data);
          } else {
            setSuggestions([]);
          }
        }
      } catch (err) {
        if (isCurrent) setSuggestions([]);
      } finally {
        if (isCurrent) setLoadingSuggestions(false);
      }
    }, 120);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [searchQuery, isSubmitted]);

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
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
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

  const saveRecentSearches = useCallback((searches: string[]) => {
    setRecentSearches(searches);
    try {
      localStorage.setItem('spotify_recent_searches', JSON.stringify(searches));
    } catch (e) {}
  }, []);

  const addRecentSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('spotify_recent_searches', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

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

      setIsSubmitted(true);
      setLoading(true);
      setSearchError(null);

      try {
        const res = await api.search(cleanQ);
        if (currentQueryRef.current === cleanQ) {
          if (res.success && res.data) {
            setResults(res.data);
            setSearchError(null);
            addRecentSearch(cleanQ);
          } else if ((res as any).error?.code !== 'ABORTED') {
            setSearchError('Music data source unavailable');
          }
        }
      } catch (e) {
        if (currentQueryRef.current === cleanQ) {
          console.warn('Search query failed:', e);
          setSearchError('Music data source unavailable');
        }
      } finally {
        if (currentQueryRef.current === cleanQ) {
          setLoading(false);
        }
      }
    },
    [addRecentSearch]
  );

  // If component mounts with an existing query (e.g. from mood/genre navigation), trigger full search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed && isSubmitted && !results && !loading) {
      executeFullSearch(trimmed);
    }
  }, [searchQuery, isSubmitted, executeFullSearch, results, loading]);

  const selectQuery = (q: string) => {
    if (onSearchChange) {
      onSearchChange(q);
    }
    executeFullSearch(q);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIsSubmitted(false); // Switch to typing/suggestions mode
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = searchQuery.trim();
      if (trimmed) {
        executeFullSearch(trimmed);
      }
    }
  };

  const removeRecent = (item: string) => {
    const updated = recentSearches.filter((s) => s !== item);
    saveRecentSearches(updated);
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
      className="p-4 sm:p-6 md:p-8 pb-36 space-y-6 max-w-7xl mx-auto"
    >
      {/* 1. Header with Spotify Logo on the left, Search Title, and Profile on Right */}
      <div className="flex items-center justify-between pt-1 select-none">
        <div className="flex items-center gap-3">
          {/* Spotify Logo Icon on the left */}
          <div
            onClick={() => onNavigate({ type: 'home' })}
            className="cursor-pointer hover:scale-105 transition-transform flex items-center justify-center"
            title="Spotify Home"
          >
            <SpotifyLogo size={32} variant="green" />
          </div>

          {/* Large Bold "Search" Title */}
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Search
          </h1>
        </div>

        {/* User Profile on the right */}
        <button
          onClick={() => onNavigate({ type: 'profile' })}
          className="flex items-center gap-2 p-1.5 px-3 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 text-neutral-200 text-xs font-semibold cursor-pointer transition-all hover:scale-105"
          title="Account Profile"
        >
          <UserAvatar
            avatarUrl={profile?.avatar}
            name={profile?.name || 'Your Name'}
            sizeClassName="w-5 h-5"
            iconClassName="w-3 h-3"
          />
          <span className="hidden xs:inline">{profile?.name || 'Profile'}</span>
        </button>
      </div>

      {/* 2. Official Spotify Search Input Box ("What do you want to listen to?") */}
      <div className="relative">
        <div className="w-full bg-white rounded-lg sm:rounded-xl px-3.5 py-3 sm:py-3.5 flex items-center gap-3 shadow-xl transition-all border border-transparent focus-within:ring-2 focus-within:ring-emerald-500">
          <button
            onClick={() => {
              if (searchQuery.trim()) {
                if (onSearchChange) onSearchChange('');
                setIsSubmitted(false);
              } else {
                onNavigate({ type: 'home' });
              }
            }}
            className="p-1 rounded-full text-neutral-800 hover:text-black hover:bg-neutral-200 transition-colors cursor-pointer flex-shrink-0"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to listen to?"
            className="w-full bg-transparent text-neutral-950 placeholder-neutral-700 font-semibold text-sm sm:text-base outline-none tracking-tight"
          />
          {searchQuery && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => {
                  if (onSearchChange) onSearchChange('');
                  setIsSubmitted(false);
                  if (searchInputRef.current) searchInputRef.current.focus();
                }}
                className="p-1 rounded-full text-neutral-700 hover:text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => {
                  const trimmed = searchQuery.trim();
                  if (trimmed) executeFullSearch(trimmed);
                }}
                className="p-1.5 rounded-full bg-black text-white hover:bg-neutral-800 transition-all cursor-pointer flex items-center justify-center"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Filter Tabs (ONLY shown when search is submitted/completed) */}
      {isSubmitted && searchQuery.trim() && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(['all', 'songs', 'artists', 'albums', 'playlists'] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`relative px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider capitalize transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === filter
                  ? 'bg-white text-black shadow-md'
                  : 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {/* 4. When Search Query is Empty: Category Cards + Uncut Real Discover + Complete Languages */}
      {!searchQuery.trim() && (
        <div className="space-y-10 pt-2">
          {/* 2-Column Spotify Category Cards (Music, Podcasts, Live Events, Home of I-Pop, etc.) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {SPOTIFY_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                onClick={() => selectQuery(cat.query)}
                className={`relative overflow-hidden h-24 sm:h-28 md:h-32 rounded-xl ${cat.bgColor} p-3.5 sm:p-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg group select-none`}
              >
                {/* Title in top-left */}
                <h3 className="text-sm sm:text-base md:text-lg font-black text-white leading-tight z-10 relative max-w-[65%] drop-shadow-sm">
                  {cat.title}
                </h3>

                {/* Rotated High-Res Album Artwork in bottom-right */}
                <div className="absolute -bottom-2 -right-3 w-16 h-16 sm:w-20 sm:h-20 rounded-md shadow-2xl overflow-hidden transform rotate-[25deg] group-hover:rotate-[20deg] group-hover:scale-105 transition-transform">
                  <img
                    src={cat.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80'}
                    alt={cat.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover shadow-inner"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* "Discover something new" Real Music Cards with Uncut, High-Res Thumbnails & Full Subject Framing */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Discover something new</span>
            </h2>

            {discoverLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] sm:aspect-[4/5] rounded-2xl bg-neutral-900 animate-pulse border border-white/5"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {discoverCards.map((story) => {
                  const isThisPlaying =
                    story.track && currentTrack?.id === story.track.id && isPlaying;

                  return (
                    <div
                      key={story.id}
                      onClick={() => handleDiscoverCardClick(story)}
                      className="group relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/10 bg-neutral-950 flex flex-col justify-between"
                    >
                      {/* Background Ambient Glow / Fill */}
                      <div className="absolute inset-0 w-full h-full overflow-hidden">
                        <img
                          src={story.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover filter blur-xl scale-125 opacity-30 pointer-events-none"
                        />
                      </div>

                      {/* Complete Uncut Artwork Display */}
                      <div className="absolute inset-0 flex items-center justify-center p-2.5">
                        <img
                          src={story.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'}
                          alt={story.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
                          }}
                          className="w-full h-full max-h-full max-w-full object-contain rounded-xl drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Smooth Dark Gradient Overlays for High Legibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />

                      {/* Top Header: Tag Pill */}
                      <div className="relative z-10 p-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-bold text-emerald-400 border border-emerald-500/30 shadow-md">
                          {story.tag}
                        </span>

                        {/* Play / Pause Action Button */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (story.track) {
                              if (currentTrack?.id === story.track.id) {
                                togglePlay();
                              } else {
                                playTrack(story.track, [story.track]);
                              }
                            } else {
                              selectQuery(story.query);
                            }
                          }}
                          className={`w-9 h-9 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-2xl transition-all cursor-pointer ${
                            isThisPlaying
                              ? 'opacity-100 scale-100'
                              : 'opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95'
                          }`}
                        >
                          {isThisPlaying ? (
                            <Pause className="w-4 h-4 fill-black" />
                          ) : (
                            <Play className="w-4 h-4 fill-black ml-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Bottom Footer: Track Title & Artist */}
                      <div className="relative z-10 p-3.5 space-y-0.5">
                        <p className="text-sm sm:text-base font-black text-white truncate drop-shadow-md">
                          {story.title}
                        </p>
                        <p className="text-xs text-neutral-300 font-semibold truncate drop-shadow-sm">
                          {story.artist}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Browse by Languages Section (Indian & International Languages including Korea, Japan, Russia, etc.) */}
          <section className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Explore by Language
                </h2>
              </div>

              {/* Language Region Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-neutral-900 border border-white/10 text-xs self-start sm:self-auto">
                <button
                  onClick={() => setLanguageTab('all')}
                  className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                    languageTab === 'all'
                      ? 'bg-white text-black shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  All ({ALL_SPOTIFY_LANGUAGES.length})
                </button>
                <button
                  onClick={() => setLanguageTab('Indian')}
                  className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                    languageTab === 'Indian'
                      ? 'bg-white text-black shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Indian
                </button>
                <button
                  onClick={() => setLanguageTab('Global')}
                  className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    languageTab === 'Global'
                      ? 'bg-white text-black shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Globe2 className="w-3 h-3" />
                  Global & International
                </button>
              </div>
            </div>

            {/* Language Browse Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {filteredLanguages.map((lang) => (
                <div
                  key={lang.name}
                  onClick={() => selectQuery(lang.query)}
                  className={`relative overflow-hidden h-28 rounded-xl ${lang.color} p-3.5 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg group select-none flex flex-col justify-between`}
                >
                  <div>
                    <h3 className="text-base font-black text-white leading-tight drop-shadow-sm">
                      {lang.name}
                    </h3>
                    <span className="text-xs font-semibold text-white/80 block mt-0.5">
                      {lang.native}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-bold text-white/90 truncate max-w-[80%]">
                      {lang.desc}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Searches (If any) */}
          {recentSearches.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> Recent Searches
                </h3>
                <button
                  onClick={() => saveRecentSearches([])}
                  className="text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {recentSearches.map((item) => (
                    <motion.div
                      key={item}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => selectQuery(item)}
                      className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-white/10 hover:border-emerald-500/40 text-xs text-neutral-200 cursor-pointer group transition-all shadow-sm"
                    >
                      <Search className="w-3 h-3 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
                      <span className="font-medium">{item}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecent(item);
                        }}
                        className="text-neutral-500 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition-colors"
                        title="Remove from recent searches"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Suggestions Display While Typing (When search is NOT submitted yet) */}
      {!isSubmitted && searchQuery.trim() && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-3"
        >
          {/* Quick Submit Row */}
          <div
            onClick={() => executeFullSearch(searchQuery.trim())}
            className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 border border-white/5 active:bg-neutral-800 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold truncate text-neutral-200 group-hover:text-white">
                Search for &ldquo;<span className="text-emerald-400 font-bold">{searchQuery}</span>&rdquo;
              </p>
            </div>
            <span className="text-xs text-neutral-500 font-medium px-2 py-1 rounded bg-black/40">Enter ↵</span>
          </div>

          {/* Matching Recent History Searches */}
          {matchingRecentSearches.length > 0 && (
            <div className="space-y-1 bg-neutral-900/40 rounded-2xl p-2 border border-white/5 shadow-md">
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider px-3 py-1">Recent Searches</p>
              {matchingRecentSearches.map((item) => (
                <div
                  key={`recent-${item}`}
                  onClick={() => selectQuery(item)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-800/80 active:bg-neutral-800 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Clock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <p className="text-sm font-semibold truncate capitalize text-neutral-200 group-hover:text-white transition-colors">
                      {item}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSearchChange) onSearchChange(item);
                      if (searchInputRef.current) searchInputRef.current.focus();
                    }}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer flex-shrink-0 ml-2"
                    title={`Fill "${item}" into search`}
                  >
                    <ArrowUpLeft className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Real Song-Title Predictive Suggestions */}
          {loadingSuggestions ? (
            <div className="space-y-2 bg-neutral-900/30 rounded-2xl p-3 border border-white/5 animate-pulse">
              <div className="h-3 w-28 bg-neutral-800 rounded mb-2" />
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-md bg-neutral-800 flex-shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-3/4 bg-neutral-800 rounded" />
                    <div className="h-2.5 w-1/2 bg-neutral-800/60 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-1 bg-neutral-900/40 rounded-2xl p-2 border border-white/5 shadow-lg">
              <div className="flex items-center justify-between px-3 py-1.5">
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Song Suggestions</p>
                <span className="text-[11px] text-neutral-500 font-medium">Matching title</span>
              </div>
              {suggestions.map((sug) => (
                <div
                  key={sug.id}
                  onClick={() => selectQuery(sug.title)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-800/80 active:bg-neutral-800 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-md bg-neutral-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/5">
                      {sug.image && sug.image.trim() !== '' ? (
                        <img
                          src={sug.image}
                          alt={sug.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate text-white group-hover:text-emerald-400 transition-colors">
                        {sug.title}
                      </p>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        Song • {sug.artist}
                      </p>
                    </div>
                  </div>

                  {/* Fill Search Query Button (ArrowUpLeft ↖) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSearchChange) onSearchChange(sug.title);
                      if (searchInputRef.current) searchInputRef.current.focus();
                    }}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer flex-shrink-0 ml-2"
                    title={`Fill "${sug.title}" into search`}
                  >
                    <ArrowUpLeft className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-neutral-500 text-xs">
              Press Enter ↵ or click Search to search for &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </motion.div>
      )}

      {/* 6. Submitted Search View: Loading Skeleton Indicator */}
      {isSubmitted && loading && (
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
      {isSubmitted && searchError && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-16 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto"
        >
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Music data source unavailable</h3>
          <p className="text-xs text-neutral-400">
            Unable to connect to the music search provider.
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
      {isSubmitted && searchQuery.trim() && results && !loading && !searchError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >

          {/* B. Verified Instant Music Matches (Songs Section) */}
          {(activeFilter === 'all' || activeFilter === 'songs') && results && results.songs.length > 0 && (
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
                {results.songs.map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isLiked = isTrackLiked(track.id);
                  const isDownloaded = isTrackDownloaded(track.id);
                  const downloadProgress = getTrackDownloadProgress(track.id);
                  const isDownloading = downloadProgress !== undefined;

                  return (
                    <div
                      key={track.id}
                      onClick={() => {
                        playTrack(track, results.songs);
                      }}
                      className={`group relative flex flex-col p-2 sm:p-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                        isCurrent
                          ? 'bg-neutral-800/90'
                          : 'hover:bg-neutral-900/90 active:bg-neutral-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between min-w-0 w-full">
                        {/* Left: Artwork + Title & "Song • Artist" */}
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 shadow-md">
                            <img
                              src={
                                track.images?.small ||
                                track.images?.medium ||
                                track.images?.large ||
                                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'
                              }
                              alt={track.title}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80';
                              }}
                              className="w-full h-full object-cover"
                            />
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
                                ? 'text-[#1ed760] hover:bg-emerald-500/10'
                                : 'text-neutral-400 hover:text-white hover:bg-white/10'
                            }`}
                            title={isLiked ? 'In Liked Songs' : 'Add to Liked Songs'}
                          >
                            {isLiked ? (
                              <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                            ) : (
                              <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                            )}
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

                {/* Spotify Radio / Playlist Matching Card */}
                {results.songs.length > 0 && (
                  <div
                    onClick={() => {
                      playTrack(results.songs[0], results.songs);
                      showToast(`Playing ${searchQuery} Radio`);
                    }}
                    className="group flex items-center justify-between p-2 sm:p-2.5 rounded-xl hover:bg-neutral-900/90 active:bg-neutral-800/80 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 shadow-md flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 border border-white/5">
                        {results.songs[0]?.images?.small || results.songs[0]?.images?.medium ? (
                          <img
                            src={results.songs[0].images.small || results.songs[0].images.medium || ''}
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
                          Playlist • Spotify • Made for you
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

          {/* C. Artists - ONLY when artists filter is active */}
          {activeFilter === 'artists' && results && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white">Artists</h3>
              {results.artists.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
                  {results.artists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} onNavigate={onNavigate} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-400 py-8">No artists found for &ldquo;{searchQuery}&rdquo;</p>
              )}
            </section>
          )}

          {/* D. Albums - ONLY when albums filter is active */}
          {activeFilter === 'albums' && results && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white">Albums</h3>
              {results.albums.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
                  {results.albums.map((album) => (
                    <AlbumCard key={album.id} album={album} onNavigate={onNavigate} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-400 py-8">No albums found for &ldquo;{searchQuery}&rdquo;</p>
              )}
            </section>
          )}

          {/* E. Playlists - ONLY when playlists filter is active */}
          {activeFilter === 'playlists' && results && (
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-white">Playlists</h3>
              {results.playlists.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
                  {results.playlists.map((playlist) => (
                    <PlaylistCard key={playlist.id} playlist={playlist} onNavigate={onNavigate} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-400 py-8">No playlists found for &ldquo;{searchQuery}&rdquo;</p>
              )}
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
    </motion.div>
  );
};
