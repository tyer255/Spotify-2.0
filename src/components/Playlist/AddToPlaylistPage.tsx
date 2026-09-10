import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  X,
  PlusCircle,
  CheckCircle2,
  Play,
  Pause,
  ChevronRight,
  Loader2,
  Music,
  Radio,
} from 'lucide-react';
import { Track, Playlist } from '../../types';
import { api } from '../../services/apiClient';
import { usePlayer } from '../../context/PlayerContext';

interface AddToPlaylistPageProps {
  playlist: Playlist;
  onClose: () => void;
  onAddTrack: (track: Track) => Promise<void> | void;
}

type SearchTab = 'songs' | 'albums' | 'playlists' | 'artists' | 'episodes';
type BrowseTab = 'songs' | 'episodes';

export const AddToPlaylistPage: React.FC<AddToPlaylistPageProps> = ({
  playlist,
  onClose,
  onAddTrack,
}) => {
  const { track: currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();

  // Search & Navigation State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBrowseTab, setActiveBrowseTab] = useState<BrowseTab>('songs');
  const [activeSearchTab, setActiveSearchTab] = useState<SearchTab>('songs');

  // Songs & Recommendations State
  const [recommendedSongs, setRecommendedSongs] = useState<Track[]>([]);
  const [recommendedEpisodes, setRecommendedEpisodes] = useState<Track[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // Search Results State
  const [searchResults, setSearchResults] = useState<{
    songs: Track[];
    albums: any[];
    playlists: any[];
    artists: any[];
  }>({
    songs: [],
    albums: [],
    playlists: [],
    artists: [],
  });
  const [isSearching, setIsSearching] = useState(false);

  // Expanded Album for viewing album tracks
  const [selectedAlbum, setSelectedAlbum] = useState<{ id: string; title: string; tracks: Track[] } | null>(null);
  const [isLoadingAlbumTracks, setIsLoadingAlbumTracks] = useState(false);

  // Track IDs that were just added in this session to provide instant optimistic feedback
  const [justAddedIds, setJustAddedIds] = useState<Set<string>>(new Set());

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSearchActive = searchQuery.trim().length > 0;

  // Set of track IDs currently in the playlist
  const existingTrackIds = useMemo(() => {
    const ids = new Set<string>();
    if (playlist && playlist.tracks) {
      playlist.tracks.forEach((t) => ids.add(t.id));
    }
    return ids;
  }, [playlist.tracks]);

  // Initial fetch for recommendations based on playlist title and contents
  useEffect(() => {
    let isCancelled = false;

    const fetchInitialRecommendations = async () => {
      setIsLoadingRecommendations(true);
      try {
        // Build seed queries
        const seedQueries: string[] = [];

        if (playlist.tracks && playlist.tracks.length > 0) {
          const artists = Array.from(new Set(playlist.tracks.map((t) => t.artist).filter(Boolean)));
          if (artists.length > 0) {
            seedQueries.push(artists.slice(0, 2).join(' '));
          }
        }

        if (playlist.title && !playlist.title.toLowerCase().startsWith('my playlist')) {
          seedQueries.push(playlist.title);
        }

        // Fallback popular & trending seeds
        seedQueries.push('trending hits', 'top hindi pop', 'chill acoustic', 'arijit singh talwinder');

        const query = seedQueries[0] || 'trending hits';
        const res = await api.search(query);

        if (!isCancelled && res.success && res.data && res.data.songs) {
          setRecommendedSongs(res.data.songs.slice(0, 30));
        }

        // Also fetch episodes/podcasts
        const epRes = await api.search('podcast episode audio talk');
        if (!isCancelled && epRes.success && epRes.data && epRes.data.songs) {
          setRecommendedEpisodes(epRes.data.songs.slice(0, 20));
        }
      } catch (err) {
        console.warn('Error fetching recommendations for Add to Playlist page:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingRecommendations(false);
        }
      }
    };

    fetchInitialRecommendations();

    return () => {
      isCancelled = true;
    };
  }, [playlist.id, playlist.title]);

  // Debounced search
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults({ songs: [], albums: [], playlists: [], artists: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.search(trimmed);
        if (res.success && res.data) {
          setSearchResults({
            songs: res.data.songs || [],
            albums: res.data.albums || [],
            playlists: res.data.playlists || [],
            artists: res.data.artists || [],
          });
        }
      } catch (err) {
        console.warn('Search failed in AddToPlaylistPage:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle adding a song to the playlist
  const handleAdd = async (track: Track) => {
    if (existingTrackIds.has(track.id) || justAddedIds.has(track.id)) {
      return;
    }

    // Optimistically mark as added right away to prevent double taps
    setJustAddedIds((prev) => new Set(prev).add(track.id));

    try {
      await onAddTrack(track);
    } catch (err) {
      console.error('Failed to add track to playlist:', err);
      // Revert if failed
      setJustAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }
  };

  // Preview or toggle play for a track
  const handlePreviewTrack = (track: Track, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, [track]);
    }
  };

  // Handle viewing album details to add its tracks
  const handleOpenAlbum = async (album: any) => {
    setSelectedAlbum({
      id: album.id,
      title: album.title || album.name,
      tracks: [],
    });
    setIsLoadingAlbumTracks(true);
    try {
      const res = await api.getAlbum(album.id);
      if (res.success && res.data) {
        const albumSongs: Track[] = res.data.songs || res.data.tracks || [];
        setSelectedAlbum({
          id: album.id,
          title: album.title || album.name,
          tracks: albumSongs,
        });
      }
    } catch (err) {
      console.warn('Failed to load album tracks:', err);
    } finally {
      setIsLoadingAlbumTracks(false);
    }
  };

  // Escape key closes modal / search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedAlbum) {
          setSelectedAlbum(null);
        } else if (searchQuery) {
          setSearchQuery('');
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, searchQuery, selectedAlbum]);

  const isTrackAdded = (trackId: string) => {
    return existingTrackIds.has(trackId) || justAddedIds.has(trackId);
  };

  // Render individual compact track row
  const renderTrackRow = (track: Track, subtitleFormat: 'plain' | 'prefixed' = 'plain') => {
    const added = isTrackAdded(track.id);
    const isThisTrackPlaying = currentTrack?.id === track.id && isPlaying;

    return (
      <div
        key={track.id}
        className="py-2 px-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between gap-3 group"
      >
        {/* Left: Square Thumbnail (Screenshot 1: small play triangle overlay) */}
        <div
          onClick={(e) => handlePreviewTrack(track, e)}
          className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-sm overflow-hidden bg-neutral-800 flex-shrink-0 cursor-pointer shadow-sm group/art"
          title="Preview track"
        >
          <img
            src={
              track.images?.small ||
              track.images?.medium ||
              track.images?.large ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'
            }
            alt={track.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-85 group-hover/art:opacity-100 transition-opacity">
            {isThisTrackPlaying ? (
              <Pause className="w-4 h-4 fill-white text-white" />
            ) : (
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Middle: Title & Artist */}
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-[15px] text-white truncate leading-snug">
            {track.title}
          </h4>
          <p className="text-[13px] text-neutral-400 truncate mt-0.5">
            {subtitleFormat === 'prefixed' ? `Song • ${track.artist}` : track.artist}
          </p>
        </div>

        {/* Right: Plus circle button (or CheckCircle2 if added) */}
        <button
          onClick={() => handleAdd(track)}
          disabled={added}
          aria-label={added ? 'Already added' : `Add ${track.title}`}
          className={`p-1.5 flex-shrink-0 transition-transform cursor-pointer ${
            added
              ? 'text-[#1ed760] cursor-default'
              : 'text-neutral-400 hover:text-white active:scale-90'
          }`}
          title={added ? 'Added to playlist' : 'Add to playlist'}
        >
          {added ? (
            <CheckCircle2 className="w-7 h-7 text-[#1ed760]" />
          ) : (
            <PlusCircle className="w-7 h-7 stroke-[1.5]" />
          )}
        </button>
      </div>
    );
  };

  // Render search results content based on activeSearchTab
  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <div className="py-16 flex flex-col items-center justify-center text-neutral-400 gap-3">
          <Loader2 className="w-8 h-8 text-[#1ed760] animate-spin" />
          <span className="text-sm">Searching...</span>
        </div>
      );
    }

    if (activeSearchTab === 'songs') {
      if (searchResults.songs.length === 0) {
        return (
          <div className="py-16 text-center text-neutral-500">
            <p className="text-base font-semibold text-neutral-300">No songs found</p>
            <p className="text-xs text-neutral-500 mt-1">
              Try searching for another song title or artist name
            </p>
          </div>
        );
      }
      return searchResults.songs.map((track) => renderTrackRow(track, 'prefixed'));
    }

    if (activeSearchTab === 'albums') {
      if (searchResults.albums.length === 0) {
        return (
          <div className="py-16 text-center text-neutral-500">
            <p className="text-base font-semibold text-neutral-300">No albums found</p>
          </div>
        );
      }
      return searchResults.albums.map((album) => (
        <div
          key={album.id}
          onClick={() => handleOpenAlbum(album)}
          className="py-2 px-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
        >
          <div className="relative w-12 h-12 rounded-sm overflow-hidden bg-neutral-800 flex-shrink-0 shadow-sm">
            <img
              src={
                album.images?.small ||
                album.images?.medium ||
                album.image ||
                album.coverImage ||
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'
              }
              alt={album.title || album.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-[15px] text-white truncate leading-snug">
              {album.title || album.name}
            </h4>
            <p className="text-[13px] text-neutral-400 truncate mt-0.5">
              Album • {album.artist || album.artistName || 'Various Artists'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors flex-shrink-0" />
        </div>
      ));
    }

    if (activeSearchTab === 'artists') {
      if (searchResults.artists.length === 0) {
        return (
          <div className="py-16 text-center text-neutral-500">
            <p className="text-base font-semibold text-neutral-300">No artists found</p>
          </div>
        );
      }
      return searchResults.artists.map((artist) => (
        <div
          key={artist.id}
          onClick={() => setSearchQuery(artist.name || artist.title)}
          className="py-2 px-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between gap-3 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0 shadow-sm">
            <img
              src={
                artist.images?.small ||
                artist.images?.medium ||
                artist.image ||
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'
              }
              alt={artist.name || artist.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-[15px] text-white truncate leading-snug">
              {artist.name || artist.title}
            </h4>
            <p className="text-[13px] text-neutral-400 truncate mt-0.5">Artist</p>
          </div>
          <Search className="w-4 h-4 text-neutral-500 flex-shrink-0" />
        </div>
      ));
    }

    if (activeSearchTab === 'episodes') {
      if (searchResults.songs.length === 0) {
        return (
          <div className="py-16 text-center text-neutral-500">
            <p className="text-base font-semibold text-neutral-300">No episodes found</p>
          </div>
        );
      }
      return searchResults.songs.map((track) => {
        const added = isTrackAdded(track.id);
        return (
          <div
            key={track.id}
            className="py-2 px-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between gap-3"
          >
            <div className="w-12 h-12 rounded-sm overflow-hidden bg-neutral-800 flex-shrink-0 shadow-sm relative">
              <img
                src={
                  track.images?.small ||
                  track.images?.medium ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'
                }
                alt={track.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-[15px] text-white truncate leading-snug">
                {track.title}
              </h4>
              <p className="text-[13px] text-neutral-400 truncate mt-0.5">
                Episode • {track.artist}
              </p>
            </div>
            <button
              onClick={() => handleAdd(track)}
              disabled={added}
              className={`p-1.5 flex-shrink-0 cursor-pointer ${
                added ? 'text-[#1ed760]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {added ? (
                <CheckCircle2 className="w-7 h-7 text-[#1ed760]" />
              ) : (
                <PlusCircle className="w-7 h-7 stroke-[1.5]" />
              )}
            </button>
          </div>
        );
      });
    }

    // Playlists
    if (searchResults.playlists.length === 0) {
      return (
        <div className="py-16 text-center text-neutral-500">
          <p className="text-base font-semibold text-neutral-300">No playlists found</p>
        </div>
      );
    }
    return searchResults.playlists.map((pl) => (
      <div
        key={pl.id}
        onClick={() => setSearchQuery(pl.title || pl.name)}
        className="py-2 px-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between gap-3 cursor-pointer"
      >
        <div className="w-12 h-12 rounded-sm overflow-hidden bg-neutral-800 flex-shrink-0 shadow-sm">
          <img
            src={
              pl.images?.small ||
              pl.images?.medium ||
              pl.coverImage ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'
            }
            alt={pl.title || pl.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-[15px] text-white truncate leading-snug">
            {pl.title || pl.name}
          </h4>
          <p className="text-[13px] text-neutral-400 truncate mt-0.5">
            Playlist • {pl.creator || 'Curated'}
          </p>
        </div>
        <Search className="w-4 h-4 text-neutral-500 flex-shrink-0" />
      </div>
    ));
  };

  // Render initial recommendations
  const renderRecommendations = () => {
    if (isLoadingRecommendations) {
      return (
        <div className="py-16 flex flex-col items-center justify-center text-neutral-400 gap-3">
          <Loader2 className="w-8 h-8 text-[#1ed760] animate-spin" />
          <span className="text-sm">Loading recommendations...</span>
        </div>
      );
    }

    if (activeBrowseTab === 'songs') {
      if (recommendedSongs.length === 0) {
        return (
          <div className="py-16 text-center text-neutral-500">
            <Music className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
            <p className="text-sm font-medium text-neutral-400">
              Use the search bar below to find songs
            </p>
          </div>
        );
      }
      return recommendedSongs.map((track) => renderTrackRow(track, 'plain'));
    }

    // Episodes
    if (recommendedEpisodes.length === 0) {
      return (
        <div className="py-16 text-center text-neutral-500">
          <Radio className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
          <p className="text-sm font-medium text-neutral-400">
            Search for podcast episodes to add
          </p>
        </div>
      );
    }
    return recommendedEpisodes.map((track) => {
      const added = isTrackAdded(track.id);
      return (
        <div
          key={track.id}
          className="py-2 px-2.5 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between gap-3"
        >
          <div className="w-12 h-12 rounded-sm overflow-hidden bg-neutral-800 flex-shrink-0 shadow-sm relative">
            <img
              src={
                track.images?.small ||
                track.images?.medium ||
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80'
              }
              alt={track.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-[15px] text-white truncate leading-snug">
              {track.title}
            </h4>
            <p className="text-[13px] text-neutral-400 truncate mt-0.5">
              {track.artist}
            </p>
          </div>
          <button
            onClick={() => handleAdd(track)}
            disabled={added}
            className={`p-1.5 flex-shrink-0 cursor-pointer ${
              added ? 'text-[#1ed760]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {added ? (
              <CheckCircle2 className="w-7 h-7 text-[#1ed760]" />
            ) : (
              <PlusCircle className="w-7 h-7 stroke-[1.5]" />
            )}
          </button>
        </div>
      );
    });
  };

  return (
    <div
      id="add-to-playlist-fullscreen-page"
      className="fixed inset-0 z-50 bg-[#121212] flex flex-col text-white select-none overflow-hidden"
    >
      {/* 1. TOP HEADER (Back button, Title) */}
      <header className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0 bg-[#121212] border-b border-white/5">
        <button
          onClick={() => {
            if (selectedAlbum) {
              setSelectedAlbum(null);
            } else {
              onClose();
            }
          }}
          aria-label="Go back to playlist"
          className="p-2 -ml-2 text-white hover:text-neutral-300 rounded-full hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-base sm:text-lg font-bold text-white text-center flex-1 px-2 truncate">
          {selectedAlbum
            ? selectedAlbum.title
            : isSearchActive
            ? 'Find'
            : 'Add to this playlist'}
        </h1>

        {/* Symmetrical placeholder */}
        <div className="w-10 flex-shrink-0" />
      </header>

      {/* 2. FILTER PILLS ROW */}
      {!selectedAlbum && (
        <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0 bg-[#121212]">
          {!isSearchActive ? (
            /* Screenshot 1: Songs (active green), Episodes (dark) */
            <>
              <button
                onClick={() => setActiveBrowseTab('songs')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeBrowseTab === 'songs'
                    ? 'bg-[#1ed760] text-black shadow-sm'
                    : 'bg-[#2a2a2a] text-white hover:bg-[#333]'
                }`}
              >
                Songs
              </button>
              <button
                onClick={() => setActiveBrowseTab('episodes')}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeBrowseTab === 'episodes'
                    ? 'bg-[#1ed760] text-black shadow-sm'
                    : 'bg-[#2a2a2a] text-white hover:bg-[#333]'
                }`}
              >
                Episodes
              </button>
            </>
          ) : (
            /* Screenshot 2: Songs, Albums, Playlists, Artists, Episodes */
            <>
              {(['songs', 'albums', 'playlists', 'artists', 'episodes'] as SearchTab[]).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSearchTab(tab)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all whitespace-nowrap cursor-pointer ${
                      activeSearchTab === tab
                        ? 'bg-[#2a2a2a] text-white ring-1 ring-white/20'
                        : 'bg-[#1c1c1c] text-neutral-400 hover:text-white hover:bg-[#252525]'
                    }`}
                  >
                    {tab}
                  </button>
                )
              )}
            </>
          )}
        </div>
      )}

      {/* 3. MAIN CONTENT LIST (Compact song rows) */}
      <main className="flex-1 overflow-y-auto px-4 pb-28 pt-1 no-scrollbar">
        {selectedAlbum ? (
          <div className="space-y-1">
            <div className="py-2 px-1 text-xs text-neutral-400">
              Songs from album <span className="text-white font-medium">{selectedAlbum.title}</span>
            </div>
            {isLoadingAlbumTracks ? (
              <div className="py-16 flex flex-col items-center justify-center text-neutral-400 gap-3">
                <Loader2 className="w-8 h-8 text-[#1ed760] animate-spin" />
                <span className="text-sm">Loading tracks...</span>
              </div>
            ) : selectedAlbum.tracks.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-sm">
                No tracks found for this album.
              </div>
            ) : (
              selectedAlbum.tracks.map((track) => renderTrackRow(track, 'prefixed'))
            )}
          </div>
        ) : isSearchActive ? (
          <div className="space-y-1">{renderSearchResults()}</div>
        ) : (
          <div className="space-y-1">{renderRecommendations()}</div>
        )}
      </main>

      {/* 4. FLOATING BOTTOM SEARCH BAR (Screenshot 1 & 2) */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-3 bg-gradient-to-t from-[#121212] via-[#121212]/95 to-transparent z-20 pointer-events-none flex justify-center">
        <div className="pointer-events-auto w-full max-w-lg bg-[#242424] hover:bg-[#282828] focus-within:bg-[#2a2a2a] focus-within:ring-1 focus-within:ring-white/20 border border-white/10 rounded-full px-4 py-3 sm:py-3.5 flex items-center gap-3 shadow-2xl transition-all">
          <Search className="w-5 h-5 text-white flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="What would you like to add?"
            className="flex-1 bg-transparent text-white text-[15px] placeholder-neutral-400 outline-none leading-normal"
          />
          {searchQuery.length > 0 && (
            <button
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
