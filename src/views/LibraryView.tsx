import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, Track, Playlist } from '../types';
import { useUser } from '../context/UserContext';
import { usePlayer } from '../context/PlayerContext';
import { api } from '../services/apiClient';
import { UserAvatar } from '../components/Common/UserAvatar';
import { ArtistAvatar } from '../components/Common/ArtistAvatar';
import { PlaylistArtwork } from '../components/Common/PlaylistArtwork';
import { getArtistPortrait } from '../utils/artistPortraits';
import { resolveArtist } from '../utils/artistAliases';
import { normalizeSearchString } from '../utils/searchRanker';
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

type LibraryFilter = 'all' | 'blends' | 'playlists' | 'artists' | 'albums' | 'podcasts' | 'downloaded';
type ViewMode = 'list' | 'grid';
type SortOption = 'recents' | 'recently_added' | 'alphabetical' | 'creator';

interface DisplayItem {
 id: string;
 type: 'playlist' | 'blend' | 'liked_songs' | 'artist' | 'album' | 'podcast' | 'downloaded';
 title: string;
 subtitle: string;
 isPinned?: boolean;
 coverImage?: string;
 collageImages?: string[];
 isBlend?: boolean;
 playlistObj?: Playlist;
 podcastObj?: any;
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
 const {
  profile,
  playlists,
  likedTrackIds,
  followedArtistIds,
  followedArtistsMap,
  downloadedTrackIds,
  downloadedTracksList,
  savedAlbumIds,
  savedAlbumsList,
  savedPodcastIds,
  savedPodcastsList,
 } = useUser();
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

 // Dynamic Category Pills calculation based strictly on real user data
 const availableCategories = useMemo(() => {
  const cats: { id: LibraryFilter; label: string }[] = [];

  // 1. Blends: Show only if user actually has at least one Blend
  const hasBlends = playlists.some((p) => Boolean(p.isBlend));
  if (hasBlends) {
   cats.push({ id: 'blends', label: 'Blends' });
  }

  // 2. Playlists: Show only if user actually has at least one playlist (or liked songs)
  const hasPlaylists = playlists.some((p) => !p.isBlend) || playlists.length > 0 || likedTrackIds.size > 0;
  if (hasPlaylists) {
   cats.push({ id: 'playlists', label: 'Playlists' });
  }

  // 3. Artists: Show only if user follows at least one artist
  const hasArtists = followedArtistIds.size > 0 || Object.keys(followedArtistsMap).length > 0;
  if (hasArtists) {
   cats.push({ id: 'artists', label: 'Artists' });
  }

  // 4. Albums: Show only if user saved at least one album
  const hasAlbums = (profile?.savedAlbumIds && profile.savedAlbumIds.length > 0) || savedAlbumIds.size > 0 || savedAlbumsList.length > 0;
  if (hasAlbums) {
   cats.push({ id: 'albums', label: 'Albums' });
  }

  // 5. Podcasts & Shows: Show only if user saved at least one podcast or show
  const hasPodcasts = savedPodcastIds.size > 0 || savedPodcastsList.length > 0;
  if (hasPodcasts) {
   cats.push({ id: 'podcasts', label: 'Podcasts & Shows' });
  }

  // 6. Downloaded: Show only if user has downloaded tracks
  const hasDownloaded = downloadedTrackIds.size > 0;
  if (hasDownloaded) {
   cats.push({ id: 'downloaded', label: 'Downloaded' });
  }

  return cats;
 }, [
  playlists,
  likedTrackIds.size,
  followedArtistIds.size,
  followedArtistsMap,
  profile?.savedAlbumIds,
  savedAlbumIds.size,
  savedAlbumsList.length,
  savedPodcastIds.size,
  savedPodcastsList.length,
  downloadedTrackIds.size,
 ]);

 // Synchronize activeFilter if the active category is no longer available in the user's library
 useEffect(() => {
  if (activeFilter !== 'all') {
   const isStillAvailable = availableCategories.some((c) => c.id === activeFilter);
   if (!isStillAvailable) {
    setActiveFilter('all');
   }
  }
 }, [availableCategories, activeFilter]);

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

  // 2. User's Real Playlists & Blends
  playlists.forEach((pl) => {
   if (pl.isBlend) {
    const participantCount = pl.blendParticipants?.length || 2;
    items.push({
     id: pl.id,
     type: 'blend',
     title: pl.title,
     subtitle: `Blend • ${participantCount} members`,
     isPinned: false,
     isBlend: true,
     playlistObj: pl,
     coverImage: pl.coverImage,
     collageImages:
      !pl.coverImage && pl.tracks && pl.tracks.length > 0
       ? pl.tracks.slice(0, 4).map((t) => t.images?.small || t.images?.medium || t.images?.large)
       : undefined,
     targetView: { type: 'playlist', playlistId: pl.id },
     updatedAt: pl.updatedAt || pl.createdAt,
     creator: currentUserName,
    });
   } else {
    items.push({
     id: pl.id,
     type: 'playlist',
     title: pl.title,
     subtitle: `Playlist • ${currentUserName}`,
     isPinned: false,
     playlistObj: pl,
     coverImage: pl.coverImage,
     collageImages:
      !pl.coverImage && pl.tracks && pl.tracks.length > 0
       ? pl.tracks.slice(0, 4).map((t) => t.images?.small || t.images?.medium || t.images?.large)
       : undefined,
     targetView: { type: 'playlist', playlistId: pl.id },
     updatedAt: pl.updatedAt || pl.createdAt,
     creator: currentUserName,
    });
   }
  });

  // 3. User's Followed Artists
  const allArtistKeys = new Set([...Array.from(followedArtistIds), ...Object.keys(followedArtistsMap)]);
  if (allArtistKeys.size > 0) {
   const processedArtistNames = new Set<string>();
   allArtistKeys.forEach((key) => {
    const found = followedArtistsMap[key] || knownArtists.find((a) => a.id === key);
    const artistName = (found?.name || key.replace(/^(virtual-|spotify-)?artist-/, '').replace(/_/g, ' ')).trim();
    const norm = normalizeSearchString(artistName);
    if (!norm || processedArtistNames.has(norm)) return;
    processedArtistNames.add(norm);

    const realArtistId = found?.id || key;
    const portraitUrl = (found?.image && typeof found.image === 'string' && found.image.trim() !== '')
     ? found.image
     : (getArtistPortrait(realArtistId) || getArtistPortrait(artistName) || resolveArtist(artistName)?.entry?.portraitUrl || '');

    items.push({
     id: realArtistId,
     type: 'artist',
     title: artistName || 'Followed Artist',
     subtitle: 'Artist',
     isPinned: false,
     coverImage: portraitUrl,
     isCircular: true,
     targetView: { 
      type: 'artist', 
      artistId: realArtistId, 
      expectedName: artistName,
      initialImage: portraitUrl 
     },
     updatedAt: '2026-08-01',
     creator: 'Artist',
    });
   });
  }

  // 4. User's Saved Albums
  savedAlbumsList.forEach((alb) => {
   items.push({
    id: alb.id,
    type: 'album',
    title: alb.name || (alb as any).title || 'Album',
    subtitle: `Album • ${alb.artist || 'Various Artists'}`,
    isPinned: false,
    coverImage: alb.images?.medium || alb.images?.large || alb.images?.small || (alb as any).coverImage,
    targetView: { type: 'album', albumId: alb.id },
    updatedAt: '2026-08-01',
    creator: alb.artist || 'Artist',
   });
  });

  // 5. User's Saved Podcasts
  savedPodcastsList.forEach((pod) => {
   items.push({
    id: pod.id,
    type: 'podcast',
    title: pod.title,
    subtitle: `Podcast • ${pod.publisher || 'Show'}`,
    isPinned: false,
    coverImage: pod.image || pod.thumbnail,
    podcastObj: pod,
    targetView: { type: 'home' },
    updatedAt: '2026-08-01',
    creator: pod.publisher || 'Show',
   });
  });

  // Apply Filter Chips
  let filtered = items;
  if (activeFilter === 'blends') {
   filtered = items.filter((i) => i.type === 'blend' || i.isBlend);
  } else if (activeFilter === 'playlists') {
   filtered = items.filter((i) => i.type === 'playlist' || i.type === 'blend' || i.type === 'liked_songs' || i.type === 'downloaded');
  } else if (activeFilter === 'artists') {
   filtered = items.filter((i) => i.type === 'artist');
  } else if (activeFilter === 'albums') {
   filtered = items.filter((i) => i.type === 'album');
  } else if (activeFilter === 'podcasts') {
   filtered = items.filter((i) => i.type === 'podcast');
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
  followedArtistsMap,
  savedAlbumsList,
  savedPodcastsList,
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
  <div id="library-view-container" className="min-h-full text-white select-none">
   {/* 1. Header (Spotiz Library UI Layout) */}
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
         value={searchQuery || ''}
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
    {availableCategories.length > 0 && (
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

      {availableCategories.map((pill) => {
       const isSelected = activeFilter === pill.id;
       return (
        <button
         key={pill.id}
         id={`library-filter-pill-${pill.id}`}
         onClick={() => handleFilterClick(pill.id)}
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
    )}

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
         ? `No items found matching"${searchQuery}"`
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
    ) : (
     <div className="space-y-6">
      {activeFilter === 'all' && libraryItems.filter(i => i.isBlend).length > 0 && !searchQuery && (
       <div className="space-y-3.5">
        <h2 className="text-lg font-bold text-white mb-2">Your Blends</h2>
        <div className={viewMode === 'list' ? 'space-y-3.5' : 'grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'}>
         {libraryItems.filter(i => i.isBlend).map(item => (
          <LibraryItemCard key={item.id} item={item} viewMode={viewMode} onNavigate={onNavigate} />
         ))}
        </div>
       </div>
      )}
      
      <div className="space-y-3.5">
       {activeFilter === 'all' && libraryItems.filter(i => i.isBlend).length > 0 && !searchQuery && (
        <h2 className="text-lg font-bold text-white mb-2 pt-2 border-t border-white/10">All Library</h2>
       )}
       <div className={viewMode === 'list' ? 'space-y-3.5' : 'grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'}>
        {libraryItems.filter(i => activeFilter !== 'all' || !!searchQuery || !i.isBlend).map(item => (
         <LibraryItemCard key={item.id} item={item} viewMode={viewMode} onNavigate={onNavigate} />
        ))}
       </div>
      </div>
     </div>
    )}
   </div>

   {/* 5. Sort Sheet Modal (Spotiz Bottom Sheet Drawer) */}
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
// Card Component for Library Items
// ============================================================================
interface LibraryItemCardProps {
 item: DisplayItem;
 viewMode: ViewMode;
 onNavigate: (view: ViewState) => void;
}

const LibraryItemCard: React.FC<LibraryItemCardProps> = ({ item, viewMode, onNavigate }) => {
 const handleClick = () => {
  if (item.type === 'podcast' && item.podcastObj?.videoId) {
   window.open(`https://youtube.com/watch?v=${item.podcastObj.videoId}`, '_blank');
   return;
  }
  onNavigate(item.targetView);
 };

 if (viewMode === 'list') {
  return (
   <div
    id={`library-list-item-${item.id}`}
    onClick={handleClick}
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
  );
 }

 return (
  <div
   id={`library-grid-item-${item.id}`}
   onClick={handleClick}
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
   <div className="flex items-center gap-1 text-[11px]text-xs text-neutral-400 truncate mt-0.5">
    {item.isPinned && (
     <span className="flex items-center text-[#1ed760] flex-shrink-0" title="Pinned">
      <Pin className="w-2.5 h-2.5 fill-[#1ed760] -rotate-45" />
     </span>
    )}
    <span className="truncate">{item.subtitle}</span>
   </div>
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

 // Podcast cover
 if (item.type === 'podcast') {
  if (item.coverImage && typeof item.coverImage === 'string' && item.coverImage.trim() !== '') {
   return (
    <img
     src={item.coverImage}
     alt={item.title}
     referrerPolicy="no-referrer"
     className="w-full h-full object-cover bg-neutral-900 rounded-md"
    />
   );
  }
  return (
   <div className="w-full h-full bg-[#1b2838] flex items-center justify-center text-[#1ed760] shadow-inner rounded-md">
    <Mic2 className={`${isGrid ? 'w-8 h-8' : 'w-7 h-7'}`} />
   </div>
  );
 }

 // Blend cover or Track collage using PlaylistArtwork
 if (item.isBlend) {
  return <PlaylistArtwork tracks={item.playlistObj?.tracks || []} playlist={item.playlistObj} />;
 }

 const validCollage = (item.collageImages || []).filter((img) => img && typeof img === 'string' && img.trim() !== '');
 if (validCollage.length > 0) {
  const dummyTracks = validCollage.map(img => ({
   id: img,
   title: 'dummy',
   artist: 'dummy',
   album: 'dummy',
   duration: 0,
   url: '',
   images: { small: img, medium: img, large: img }
  } as unknown as Track));
  return <PlaylistArtwork tracks={dummyTracks} playlist={item.playlistObj} />;
 }

 // Artist Avatar
 if (item.type === 'artist') {
  return (
   <ArtistAvatar
    id={item.id}
    name={item.title}
    image={item.coverImage}
    sizeClassName="w-full h-full"
    iconClassName="w-7 h-7 text-neutral-400"
   />
  );
 }

 // Single Image (Custom cover or album artwork)
 if (item.coverImage && typeof item.coverImage === 'string' && item.coverImage.trim() !== '') {
  return (
   <img
    src={item.coverImage}
    alt={item.title}
    referrerPolicy="no-referrer"
    onError={(e) => {
     e.currentTarget.onerror = null;
     e.currentTarget.style.display = 'none';
     if (e.currentTarget.parentElement) {
      e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full bg-[#282828] flex items-center justify-center text-neutral-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg></div>';
     }
    }}
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
