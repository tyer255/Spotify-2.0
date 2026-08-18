import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, Track, Playlist } from '../types';
import { useUser } from '../context/UserContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/apiClient';
import { UserAvatar } from '../components/Common/UserAvatar';
import {
  Search,
  Plus,
  ArrowUpDown,
  LayoutGrid,
  List,
  Heart,
  Pin,
  Check,
  X,
  Music,
  Download,
  PlusCircle,
  Disc3,
  Mic2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LibraryViewProps {
  initialSubTab?: string;
  onNavigate: (view: ViewState) => void;
  onOpenCreatePlaylist: () => void;
}

type LibraryFilter = 'all' | 'playlists' | 'artists' | 'albums' | 'podcasts' | 'downloaded';
type ViewMode = 'list' | 'grid';
type SortOption = 'recents' | 'recently_added' | 'alphabetical' | 'creator';

interface DisplayItem {
  id: string;
  type: 'playlist' | 'liked_songs' | 'artist' | 'album' | 'downloaded';
  title: string;
  subtitle: string;
  isPinned?: boolean;
  coverImage?: string;
  collageImages?: string[];
  isCircular?: boolean;
  targetView: ViewState;
  updatedAt?: string;
  creator?: string;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  initialSubTab,
  onNavigate,
  onOpenCreatePlaylist,
}) => {
  const { profile, playlists, likedTrackIds, followedArtistIds, downloadedTrackIds, downloadedTracksList } = useUser();
  const { playTrack } = usePlayer();

  // Active filter chip
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>(() => {
    if (initialSubTab === 'playlists') return 'playlists';
    if (initialSubTab === 'artists') return 'artists';
    if (initialSubTab === 'downloaded') return 'downloaded';
    if (initialSubTab === 'albums') return 'albums';
    return 'all';
  });

  // View Mode: 'list' vs 'grid' (Persisted in localStorage for UI layout preference)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem('spotify_library_view_mode') as ViewMode) || 'list';
    } catch {
      return 'list';
    }
  });

  // Sort Option
  const [sortOption, setSortOption] = useState<SortOption>('recents');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  // In-Library Search Filter
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Popular artists cache for resolving followed artists metadata
  const [knownArtists, setKnownArtists] = useState<any[]>([]);

  useEffect(() => {
    async function loadArtists() {
      try {
        const homeRes = await api.getHomeFeed();
        if (homeRes.success && homeRes.data?.popularArtists) {
          setKnownArtists(homeRes.data.popularArtists);
        }
      } catch (e) {
        // Fallback silently
      }
    }
    loadArtists();
  }, []);

  const toggleViewMode = () => {
    const nextMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(nextMode);
    try {
      localStorage.setItem('spotify_library_view_mode', nextMode);
    } catch {}
  };

  const currentUserName = profile?.name || profile?.username || 'You';

  // Build the list of display items purely from the user's REAL library data
  const libraryItems: DisplayItem[] = useMemo(() => {
    const items: DisplayItem[] = [];

    // 1. Liked Songs (Special pinned playlist if user has liked tracks or as standard item)
    if (likedTrackIds.size > 0) {
      items.push({
        id: 'liked-songs',
        type: 'liked_songs',
        title: 'Liked Songs',
        subtitle: `Playlist • ${likedTrackIds.size} song${likedTrackIds.size === 1 ? '' : 's'}`,
        isPinned: true,
        targetView: { type: 'playlist', playlistId: 'liked-songs' },
        updatedAt: '9999-99-99',
        creator: currentUserName,
      });
    }

    // 1.5 Downloaded Songs (Pinned offline playlist when user has downloaded tracks)
    if (downloadedTrackIds.size > 0) {
      items.push({
        id: 'downloaded-tracks',
        type: 'downloaded',
        title: 'Downloaded Songs',
        subtitle: `Playlist • ${downloadedTrackIds.size} song${downloadedTrackIds.size === 1 ? '' : 's'} (Offline)`,
        isPinned: true,
        targetView: { type: 'playlist', playlistId: 'downloaded-tracks' },
        updatedAt: '9999-99-98',
        creator: currentUserName,
      });
    }

    // 2. User's Real Playlists
    playlists.forEach((pl) => {
      items.push({
        id: pl.id,
        type: 'playlist',
        title: pl.title,
        subtitle: `Playlist • ${currentUserName}`,
        isPinned: false,
        coverImage: pl.coverImage,
        collageImages:
          !pl.coverImage && pl.tracks.length >= 4
            ? pl.tracks.slice(0, 4).map((t) => t.images.small || t.images.medium)
            : undefined,
        targetView: { type: 'playlist', playlistId: pl.id },
        updatedAt: pl.updatedAt || pl.createdAt,
        creator: currentUserName,
      });
    });

    // 3. User's Followed Artists
    if (followedArtistIds.size > 0) {
      followedArtistIds.forEach((artistId) => {
        const found = knownArtists.find((a) => a.id === artistId);
        items.push({
          id: artistId,
          type: 'artist',
          title: found?.name || 'Followed Artist',
          subtitle: 'Artist',
          isPinned: false,
          coverImage: found?.image,
          isCircular: true,
          targetView: { type: 'artist', artistId },
          updatedAt: '2026-08-01',
          creator: 'Artist',
        });
      });
    }

    // Apply Filter Chips
    let filtered = items;
    if (activeFilter === 'playlists') {
      filtered = items.filter((i) => i.type === 'playlist' || i.type === 'liked_songs' || i.type === 'downloaded');
    } else if (activeFilter === 'artists') {
      filtered = items.filter((i) => i.type === 'artist');
    } else if (activeFilter === 'albums') {
      filtered = items.filter((i) => i.type === 'album');
    } else if (activeFilter === 'downloaded') {
      filtered = items.filter((i) => i.type === 'downloaded');
    }

    // Apply in-library search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (i) => i.title.toLowerCase().includes(q) || i.subtitle.toLowerCase().includes(q)
      );
    }

    // Sort items (Pinned items stay on top, then sorted according to selected sort option)
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortOption === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      if (sortOption === 'creator') {
        return (a.creator || '').localeCompare(b.creator || '');
      }
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });
  }, [
    playlists,
    likedTrackIds,
    followedArtistIds,
    downloadedTrackIds,
    knownArtists,
    activeFilter,
    searchQuery,
    sortOption,
    currentUserName,
  ]);

  const handleFilterClick = (filter: LibraryFilter) => {
    setActiveFilter(activeFilter === filter ? 'all' : filter);
  };

  const getSortLabel = () => {
    switch (sortOption) {
      case 'recents':
        return 'Recents';
      case 'recently_added':
        return 'Recently Added';
      case 'alphabetical':
        return 'Alphabetical';
      case 'creator':
        return 'Creator';
      default:
        return 'Recents';
    }
  };

  return (
    <div id="library-view-container" className="min-h-full text-white select-none pb-32">
      {/* 1. Header (Spotify Library UI Layout) */}
      <div id="library-header" className="sticky top-0 z-20 liquid-glass-topbar px-4 pt-3 pb-2 transition-all">
        <div className="flex items-center justify-between">
          {/* Left: User Profile Avatar + Title */}
          <div className="flex items-center gap-3">
            <button
              id="library-profile-avatar-btn"
              onClick={() => onNavigate({ type: 'profile' })}
              className="hover:opacity-90 active:scale-95 transition-all cursor-pointer flex-shrink-0"
              title="View Profile"
            >
              <UserAvatar
                avatarUrl={profile?.avatar}
                name={currentUserName}
                sizeClassName="w-8 h-8"
                iconClassName="w-4 h-4"
              />
            </button>
            <h1 className="text-2xl font-black text-white tracking-tight">Your Library</h1>
          </div>

          {/* Right: Search trigger + Create Playlist (+) trigger */}
          <div className="flex items-center gap-4 text-white">
            <button
              id="library-search-toggle-btn"
              onClick={() => setIsSearching(!isSearching)}
              className="p-1 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Search in Library"
            >
              <Search className="w-6 h-6 stroke-[2.2]" />
            </button>
            <button
              id="library-create-playlist-btn"
              onClick={onOpenCreatePlaylist}
              className="p-1 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Create playlist"
            >
              <Plus className="w-7 h-7 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* In-Library Search Filter Bar (Animated) */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              id="library-search-bar"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden mt-3"
            >
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
                <input
                  id="library-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find in Your Library"
                  autoFocus
                  className="w-full bg-white/10 text-white text-xs rounded-lg pl-9 pr-8 py-2.5 outline-none placeholder-neutral-400 focus:ring-1 focus:ring-white border border-white/10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 p-1 text-neutral-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Filter Pills Row */}
        <div id="library-filter-pills" className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 pb-2 -mx-4 px-4">
          {activeFilter !== 'all' && (
            <button
              id="library-clear-filter-btn"
              onClick={() => setActiveFilter('all')}
              className="w-7 h-7 rounded-full bg-white/10 text-neutral-300 hover:text-white flex items-center justify-center flex-shrink-0 cursor-pointer border border-white/10"
              title="Clear filter"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {[
            { id: 'playlists', label: 'Playlists' },
            { id: 'artists', label: 'Artists' },
            { id: 'albums', label: 'Albums' },
            { id: 'podcasts', label: 'Podcasts & Shows' },
            { id: 'downloaded', label: 'Downloaded' },
          ].map((pill) => {
            const isSelected = activeFilter === pill.id;
            return (
              <button
                key={pill.id}
                id={`library-filter-pill-${pill.id}`}
                onClick={() => handleFilterClick(pill.id as LibraryFilter)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'liquid-glass-pill-active text-white font-bold'
                    : 'liquid-glass-pill text-neutral-200 hover:text-white hover:bg-white/15'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* 3. Sub-header (Recents Sort + View Mode Toggle Icon) */}
        <div id="library-sub-header" className="flex items-center justify-between pt-2 pb-1 text-neutral-200">
          {/* Left: ⇅ Recents Sort Selector */}
          <button
            id="library-sort-button"
            onClick={() => setIsSortMenuOpen(true)}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowUpDown className="w-4 h-4 stroke-[2.2]" />
            <span className="text-xs font-bold tracking-tight">{getSortLabel()}</span>
          </button>

          {/* Right: View Mode Toggle Button */}
          <button
            id="library-view-mode-toggle-btn"
            onClick={toggleViewMode}
            className="p-1 hover:text-white text-neutral-200 transition-colors cursor-pointer"
            title={viewMode === 'list' ? 'Switch to Grid View' : 'Switch to List View'}
          >
            {viewMode === 'list' ? (
              <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
            ) : (
              <List className="w-5 h-5 stroke-[2.2]" />
            )}
          </button>
        </div>
      </div>

      {/* 4. Library Content Layout */}
      <div id="library-content-area" className="px-4 pt-2">
        {libraryItems.length === 0 ? (
          /* Empty State */
          <div id="library-empty-state" className="py-20 text-center text-neutral-400 space-y-4 max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#181818] flex items-center justify-center mx-auto text-neutral-500">
              <Music className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Your library is empty</h3>
              <p className="text-xs text-neutral-400">
                {searchQuery
                  ? `No items found matching "${searchQuery}"`
                  : activeFilter !== 'all'
                  ? `No ${activeFilter} in your library yet.`
                  : 'Playlists you create or like will show up here.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                id="library-empty-create-btn"
                onClick={onOpenCreatePlaylist}
                className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                Create playlist
              </button>
              <button
                id="library-empty-explore-btn"
                onClick={() => onNavigate({ type: 'search' })}
                className="px-5 py-2.5 rounded-full bg-neutral-800 text-white font-bold text-xs hover:bg-neutral-700 active:scale-95 transition-all cursor-pointer"
              >
                Find music & artists
              </button>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          /* ============================================================ */
          /* LIST VIEW LAYOUT (Spotify Vertical List Layout)              */
          /* ============================================================ */
          <div id="library-list-view" className="space-y-3.5">
            {libraryItems.map((item) => (
              <div
                key={item.id}
                id={`library-list-item-${item.id}`}
                onClick={() => onNavigate(item.targetView)}
                className="flex items-center justify-between group cursor-pointer active:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Artwork Box (64x64) */}
                  <div
                    className={`w-16 h-16 rounded-md overflow-hidden relative flex-shrink-0 shadow-md ${
                      item.isCircular ? 'rounded-full' : ''
                    }`}
                  >
                    <ItemCover item={item} />
                  </div>

                  {/* Title & Subtitle */}
                  <div className="min-w-0 flex-1 pr-2">
                    <h3 className="text-base font-bold text-white truncate leading-tight group-hover:text-white">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate mt-1">
                      {item.isPinned && (
                        <span className="flex items-center text-[#1ed760] flex-shrink-0" title="Pinned">
                          <Pin className="w-3 h-3 fill-[#1ed760] -rotate-45" />
                        </span>
                      )}
                      <span className="truncate">{item.subtitle}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ============================================================ */
          /* GRID VIEW LAYOUT (Spotify 3-Column / Responsive Grid Layout) */
          /* ============================================================ */
          <div id="library-grid-view" className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {libraryItems.map((item) => (
              <div
                key={item.id}
                id={`library-grid-item-${item.id}`}
                onClick={() => onNavigate(item.targetView)}
                className="flex flex-col group cursor-pointer active:opacity-80 transition-opacity"
              >
                {/* Artwork Box (Square) */}
                <div
                  className={`aspect-square w-full rounded-md overflow-hidden relative shadow-md bg-neutral-900 ${
                    item.isCircular ? 'rounded-full' : ''
                  }`}
                >
                  <ItemCover item={item} isGrid />
                </div>

                {/* Title */}
                <h3 className="text-xs sm:text-sm font-bold text-white truncate mt-2 leading-snug">
                  {item.title}
                </h3>

                {/* Subtitle */}
                <div className="flex items-center gap-1 text-[11px] sm:text-xs text-neutral-400 truncate mt-0.5">
                  {item.isPinned && (
                    <span className="flex items-center text-[#1ed760] flex-shrink-0" title="Pinned">
                      <Pin className="w-2.5 h-2.5 fill-[#1ed760] -rotate-45" />
                    </span>
                  )}
                  <span className="truncate">{item.subtitle}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Sort Sheet Modal (Spotify Bottom Sheet Drawer) */}
      <AnimatePresence>
        {isSortMenuOpen && (
          <div id="library-sort-modal" className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSortMenuOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[#282828] rounded-t-3xl p-6 text-white space-y-4 shadow-2xl z-10"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2" />
              <h3 className="text-lg font-bold">Sort by</h3>

              <div className="space-y-1">
                {[
                  { id: 'recents', label: 'Recents' },
                  { id: 'recently_added', label: 'Recently Added' },
                  { id: 'alphabetical', label: 'Alphabetical' },
                  { id: 'creator', label: 'Creator' },
                ].map((opt) => {
                  const isSelected = sortOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      id={`sort-opt-${opt.id}`}
                      onClick={() => {
                        setSortOption(opt.id as SortOption);
                        setIsSortMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-white/10 active:bg-white/15 transition-colors text-left cursor-pointer"
                    >
                      <span className={`text-sm ${isSelected ? 'text-[#1ed760] font-bold' : 'text-neutral-200'}`}>
                        {opt.label}
                      </span>
                      {isSelected && <Check className="w-5 h-5 text-[#1ed760]" />}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setIsSortMenuOpen(false)}
                className="w-full py-3 rounded-full bg-white/10 hover:bg-white/15 font-bold text-sm text-neutral-200 mt-2 cursor-pointer"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Cover Art Component for Real Library Items
// ============================================================================
interface ItemCoverProps {
  item: DisplayItem;
  isGrid?: boolean;
}

const ItemCover: React.FC<ItemCoverProps> = ({ item, isGrid }) => {
  // Liked Songs gradient cover
  if (item.type === 'liked_songs') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#450af5] via-[#8e2de2] to-[#7928ca] flex items-center justify-center shadow-inner">
        <Heart className={`${isGrid ? 'w-8 h-8' : 'w-7 h-7'} fill-white text-white`} />
      </div>
    );
  }

  // Downloaded songs cover
  if (item.type === 'downloaded') {
    return (
      <div className="w-full h-full bg-[#1e3a8a] flex items-center justify-center shadow-inner">
        <Download className={`${isGrid ? 'w-8 h-8' : 'w-7 h-7'} text-[#1ed760]`} />
      </div>
    );
  }

  // 4-track collage
  const validCollage = (item.collageImages || []).filter((img) => img && typeof img === 'string' && img.trim() !== '');
  if (validCollage.length >= 4) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full bg-neutral-900">
        {validCollage.slice(0, 4).map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ))}
      </div>
    );
  }

  // Single Image (Custom cover or artist avatar)
  if (item.coverImage && typeof item.coverImage === 'string' && item.coverImage.trim() !== '') {
    return (
      <img
        src={item.coverImage}
        alt={item.title}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover bg-neutral-900"
      />
    );
  }

  // Generic playlist placeholder
  return (
    <div className="w-full h-full bg-[#282828] flex items-center justify-center text-neutral-400">
      <Music className="w-6 h-6" />
    </div>
  );
};
