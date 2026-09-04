import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Playlist, ViewState, Track } from '../types';
import { api } from '../services/apiClient';
import { db } from '../services/firebase';
import { usePlayer } from '../context/PlayerContext';
import { useUser } from '../context/UserContext';
import { TrackRow } from '../components/Common/TrackRow';
import { HeroSkeleton } from '../components/Common/SkeletonLoaders';
import { PlaylistArtwork } from '../components/Common/PlaylistArtwork';
import {
  Play,
  Pause,
  Shuffle,
  Edit2,
  Trash2,
  Plus,
  Clock,
  Music,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  ArrowLeft,
  ArrowDownCircle,
  CheckCircle2,
  Share2,
  Globe,
  Users,
  UserPlus,
  Sparkles,
  MoreHorizontal,
  SlidersHorizontal,
  RefreshCw,
  Flame,
  Radio,
  Heart,
  ExternalLink,
  Info,
} from 'lucide-react';

interface PlaylistViewProps {
  playlistId: string;
  onNavigate: (view: ViewState) => void;
  onGoBack?: () => void;
}

type SortOption = 'custom' | 'title' | 'artist' | 'album' | 'duration';

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlistId, onNavigate, onGoBack }) => {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Search & Filter within playlist
  const [playlistFilterQuery, setPlaylistFilterQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('custom');

  // Modals & Menus
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveBlendModal, setShowLeaveBlendModal] = useState(false);
  const [showBlendStoryModal, setShowBlendStoryModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [blendStoryScene, setBlendStoryScene] = useState<1 | 2 | 3>(1);

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Add Songs / Recommended Section
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [activeMoodCategory, setActiveMoodCategory] = useState<string>('trending');
  const [suggestedSongs, setSuggestedSongs] = useState<Track[]>([]);
  const [isRefreshingSuggestions, setIsRefreshingSuggestions] = useState(false);

  const moreMenuRef = useRef<HTMLDivElement>(null);

  const { track: currentTrack, isPlaying, playTrack, togglePlay, setShuffleEnabled } = usePlayer();
  const {
    profile,
    firebaseUser,
    playlists,
    likedTracksList,
    downloadedTracksList,
    downloadedTrackIds,
    toggleDownloadTrack,
    updatePlaylist,
    deletePlaylist,
    removeTrackFromPlaylist,
    addTrackToPlaylist,
    reorderPlaylist,
    showToast,
  } = useUser();

  // Close more menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showMoreMenu]);

  const loadPlaylist = async () => {
    // Special: Downloaded Songs playlist
    if (playlistId === 'downloaded-tracks') {
      setPlaylist({
        id: 'downloaded-tracks',
        title: 'Downloaded Songs',
        description: 'Your offline available tracks',
        coverImage: '',
        userId: 'user',
        isPublic: false,
        tracks: downloadedTracksList,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likesCount: downloadedTracksList.length,
        color: '#1e3a8a',
      });
      setEditTitle('Downloaded Songs');
      setEditDesc('Your offline available tracks');
      setLoading(false);
      return;
    }

    // Special: Liked Songs playlist
    if (playlistId === 'liked-songs') {
      setPlaylist({
        id: 'liked-songs',
        title: 'Liked Songs',
        description: 'Your favorite saved songs',
        coverImage: '',
        userId: 'user',
        isPublic: false,
        tracks: likedTracksList,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likesCount: likedTracksList.length,
        color: '#5b21b6',
      });
      setEditTitle('Liked Songs');
      setEditDesc('Your favorite saved songs');
      setLoading(false);
      return;
    }

    // Special: New Episodes
    if (playlistId === 'new-episodes') {
      try {
        const feed = await api.getHomeFeed();
        const pool = feed.data?.popularSongs || [];
        setPlaylist({
          id: 'new-episodes',
          title: 'New Episodes',
          description: 'Updated podcast episodes and fresh audio',
          coverImage: '',
          userId: 'spotify',
          isPublic: true,
          tracks: pool.slice(0, 8),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          likesCount: 1420,
          color: '#542c75',
        });
        setEditTitle('New Episodes');
        setEditDesc('Updated podcast episodes');
        setLoading(false);
        return;
      } catch (e) {}
    }

    // Check context playlists first
    const fromCtx = playlists.find((p) => p.id === playlistId);
    if (fromCtx) {
      setPlaylist(fromCtx);
      setEditTitle(fromCtx.title || '');
      setEditDesc(fromCtx.description || '');
      setLoading(false);
      return;
    }

    // Try fetching from Firestore directly for shared Blends or external playlists
    if (db) {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const plRef = doc(db, 'playlists', playlistId);
        const plSnap = await getDoc(plRef);
        if (plSnap.exists()) {
          const data = plSnap.data() as Playlist;
          setPlaylist({ ...data, id: plSnap.id });
          setEditTitle(data.title || '');
          setEditDesc(data.description || '');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Failed to load playlist from Firestore:', err);
      }
    }

    // Immediate check from local storage
    try {
      const saved = localStorage.getItem('spotify_user_playlists');
      if (saved) {
        const parsed: Playlist[] = JSON.parse(saved);
        const localFound = parsed.find((p) => p.id === playlistId);
        if (localFound) {
          setPlaylist(localFound);
          setEditTitle(localFound.title || '');
          setEditDesc(localFound.description || '');
          setLoading(false);
          return;
        }
      }
    } catch (e) {}

    try {
      const res = await api.getPlaylist(playlistId);
      if (res.success && res.data) {
        setPlaylist(res.data);
        setEditTitle(res.data.title || '');
        setEditDesc(res.data.description || '');
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Failed to load playlist from API:', e);
    }

    setPlaylist(null);
    setLoading(false);
  };

  useEffect(() => {
    loadPlaylist();
  }, [playlistId, likedTracksList, downloadedTracksList, playlists]);

  // Load recommended / search songs
  const fetchSuggestedSongs = async (queryText?: string) => {
    setIsRefreshingSuggestions(true);
    try {
      let query = queryText;
      if (!query) {
        if (songSearchQuery.trim()) {
          query = songSearchQuery.trim();
        } else if (activeMoodCategory === 'trending') {
          query = 'trending hits viral';
        } else if (activeMoodCategory === 'pop') {
          query = 'pop hits chart toppers';
        } else if (activeMoodCategory === 'hindi') {
          query = 'hindi arijit bollywood trending';
        } else if (activeMoodCategory === 'chill') {
          query = 'lofi chill acoustic relax';
        } else if (activeMoodCategory === 'energy') {
          query = 'electronic dance edm workout';
        } else {
          query = playlist?.title || 'trending hits';
        }
      }

      const res = await api.search(query);
      if (res.success && res.data && res.data.songs) {
        setSuggestedSongs(res.data.songs.slice(0, 12));
      }
    } catch (err) {
      console.warn('Failed to fetch suggested songs:', err);
    } finally {
      setIsRefreshingSuggestions(false);
    }
  };

  useEffect(() => {
    if (showAddSongs) {
      fetchSuggestedSongs();
    }
  }, [showAddSongs, songSearchQuery, activeMoodCategory]);

  // Calculated Creator Name & Avatar
  const currentUserName = useMemo(() => {
    return profile?.name || (firebaseUser?.displayName || (firebaseUser?.email ? firebaseUser.email.split('@')[0] : 'You'));
  }, [profile, firebaseUser]);

  const creatorInitial = useMemo(() => {
    return (currentUserName.charAt(0) || 'U').toUpperCase();
  }, [currentUserName]);

  const creatorAvatar = useMemo(() => {
    return profile?.avatar || firebaseUser?.photoURL || '';
  }, [profile, firebaseUser]);

  // Calculate Blend participants and real track attribution counts
  const blendInfo = useMemo(() => {
    if (!playlist?.isBlend) return null;
    const participants = playlist.blendParticipants || playlist.collaborators || [
      { id: 'creator', name: currentUserName, avatar: creatorAvatar },
      { id: 'friend', name: 'Friend', avatar: '' }
    ];

    const p1: { id?: string; name: string; avatar?: string; initial?: string } = participants[0] || { name: currentUserName, initial: creatorInitial, avatar: creatorAvatar };
    const p2: { id?: string; name: string; avatar?: string; initial?: string } = participants[1] || { name: 'Invited Friend', initial: 'F', avatar: undefined };

    // Real count calculation of each participant's tracks
    let p1TracksCount = 0;
    let p2TracksCount = 0;
    let bothTracksCount = 0;

    const tracks = playlist.tracks || [];
    tracks.forEach((t) => {
      const meta = playlist.trackMetadata?.[t.id];
      const influencers = meta?.influencedBy || [];
      const addedBy = meta?.addedBy || '';

      const matchP1 = influencers.some((n: string) => n.toLowerCase() === p1.name.toLowerCase()) || (addedBy && addedBy.toLowerCase() === p1.name.toLowerCase());
      const matchP2 = influencers.some((n: string) => n.toLowerCase() === p2.name.toLowerCase()) || (addedBy && addedBy.toLowerCase() === p2.name.toLowerCase());

      if (matchP1 && matchP2) {
        bothTracksCount++;
      } else if (matchP2) {
        p2TracksCount++;
      } else {
        p1TracksCount++;
      }
    });

    const combined = p1.name + p2.name + playlist.id;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash) + combined.charCodeAt(i);
      hash |= 0;
    }
    const matchPercentage = 78 + (Math.abs(hash) % 18); // 78% to 95%

    return {
      participants,
      p1,
      p2,
      matchPercentage,
      p1TracksCount,
      p2TracksCount,
      bothTracksCount,
      totalTracks: tracks.length,
    };
  }, [playlist, currentUserName, creatorInitial, creatorAvatar]);

  // Duration in readable format
  const formattedTotalDuration = useMemo(() => {
    if (!playlist?.tracks || playlist.tracks.length === 0) return '';
    const totalSec = playlist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
    if (totalSec === 0) return '';
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (hours > 0) {
      return `${hours} hr ${mins} min`;
    }
    return `${mins} min`;
  }, [playlist]);

  // Filtered & Sorted Tracks
  const filteredAndSortedTracks = useMemo(() => {
    if (!playlist?.tracks) return [];
    let list = [...playlist.tracks];

    // Filter by query
    if (playlistFilterQuery.trim()) {
      const q = playlistFilterQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          (t.album && t.album.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortOption === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === 'artist') {
      list.sort((a, b) => a.artist.localeCompare(b.artist));
    } else if (sortOption === 'album') {
      list.sort((a, b) => (a.album || '').localeCompare(b.album || ''));
    } else if (sortOption === 'duration') {
      list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    }

    return list;
  }, [playlist, playlistFilterQuery, sortOption]);

  const isPlayingThisPlaylist = useMemo(() => {
    return !!playlist?.tracks.some((t) => t.id === currentTrack?.id) && isPlaying;
  }, [playlist, currentTrack, isPlaying]);

  const isUserCreatedPlaylist = useMemo(() => {
    return (
      playlistId !== 'liked-songs' &&
      playlistId !== 'downloaded-tracks' &&
      playlistId !== 'new-episodes'
    );
  }, [playlistId]);

  const isAllDownloaded = useMemo(() => {
    if (!playlist?.tracks || playlist.tracks.length === 0) return false;
    return playlist.tracks.every((t) => downloadedTrackIds.has(t.id));
  }, [playlist, downloadedTrackIds]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <HeroSkeleton />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-8 text-center space-y-6 max-w-md mx-auto my-12 text-white">
        <div className="w-20 h-20 mx-auto rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
          <Music className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Playlist Not Found</h2>
          <p className="text-sm text-neutral-400">
            This playlist may have been removed or is temporarily unavailable.
          </p>
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => onNavigate({ type: 'home' })}
            className="px-6 py-2.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-bold text-sm transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            Go to Home
          </button>
          <button
            onClick={() => onNavigate({ type: 'library', subTab: 'playlists' })}
            className="px-6 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm transition-all cursor-pointer"
          >
            Your Library
          </button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    if (onGoBack) {
      onGoBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      onNavigate({ type: 'library' });
    }
  };

  const handlePlayPlaylist = () => {
    if (playlist.tracks.length > 0) {
      if (isPlayingThisPlaylist) {
        togglePlay();
      } else {
        playTrack(filteredAndSortedTracks[0] || playlist.tracks[0], filteredAndSortedTracks);
      }
    }
  };

  const handleShufflePlaylist = () => {
    if (playlist.tracks.length > 0) {
      setShuffleEnabled(true);
      const randomIndex = Math.floor(Math.random() * playlist.tracks.length);
      playTrack(playlist.tracks[randomIndex], playlist.tracks);
    }
  };

  const handleDownloadAll = async () => {
    if (!playlist.tracks || playlist.tracks.length === 0) return;
    for (const tr of playlist.tracks) {
      if (!downloadedTrackIds.has(tr.id)) {
        await toggleDownloadTrack(tr);
      }
    }
    showToast({
      message: `Downloading ${playlist.tracks.length} songs for offline playback`,
      iconType: 'download',
    });
  };

  const handleSharePlaylist = () => {
    const inviteLink = playlist.isBlend
      ? `${window.location.origin}?blend=${playlist.id}`
      : window.location.href;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink).catch(() => {});
    }

    if (navigator.share) {
      navigator
        .share({
          title: playlist.title,
          text: playlist.isBlend
            ? `Check out our Blend "${playlist.title}" on Spotiz!`
            : `Listen to "${playlist.title}" on Spotiz!`,
          url: inviteLink,
        })
        .catch(() => {});
    } else {
      showToast({
        message: playlist.isBlend ? 'Blend invite link copied!' : 'Playlist link copied!',
        iconType: 'info',
      });
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    await updatePlaylist(playlist.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
    });
    setPlaylist((prev) => (prev ? { ...prev, title: editTitle.trim(), description: editDesc.trim() } : null));
    setIsEditing(false);
    showToast({ message: 'Playlist details updated', iconType: 'playlist' });
  };

  const handleConfirmDelete = async () => {
    if (!playlist) return;
    await deletePlaylist(playlist.id);
    setShowDeleteModal(false);
    showToast({ message: 'Playlist removed from library', iconType: 'info' });
    onNavigate({ type: 'library' });
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!playlist) return;
    await removeTrackFromPlaylist(playlist.id, trackId);
    setPlaylist((prev) =>
      prev ? { ...prev, tracks: prev.tracks.filter((t) => t.id !== trackId) } : null
    );
  };

  const handleAddTrack = async (track: Track) => {
    if (!playlist) return;
    await addTrackToPlaylist(playlist.id, track);
    setPlaylist((prev) =>
      prev
        ? {
            ...prev,
            tracks: prev.tracks.some((t) => t.id === track.id) ? prev.tracks : [...prev.tracks, track],
          }
        : null
    );
    showToast({ message: `Added "${track.title}" to playlist`, thumbnail: track.images?.small });
  };

  const handleMoveTrack = async (fromIdx: number, toIdx: number) => {
    if (!playlist || toIdx < 0 || toIdx >= playlist.tracks.length) return;
    const newTracks = [...playlist.tracks];
    const [moved] = newTracks.splice(fromIdx, 1);
    newTracks.splice(toIdx, 0, moved);
    setPlaylist({ ...playlist, tracks: newTracks });
    await reorderPlaylist(playlist.id, newTracks.map((t) => t.id));
  };

  const startBlendStory = () => {
    setBlendStoryScene(1);
    setShowBlendStoryModal(true);
  };

  return (
    <div className="pb-36 sm:pb-40 text-white min-h-full selection:bg-emerald-500 selection:text-black">
      {/* 1. Immersive Top Navigation Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-3 sm:px-6 py-3 bg-neutral-950/85 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button
            onClick={handleBack}
            className="p-2 rounded-full bg-black/40 hover:bg-neutral-800 text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer border border-white/5"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-[180px] sm:max-w-md">
              {playlist.title}
            </h2>
            <p className="text-[11px] text-neutral-400 truncate hidden xs:block">
              {playlist.tracks.length} songs {formattedTotalDuration ? `• ${formattedTotalDuration}` : ''}
            </p>
          </div>
        </div>

        {/* Top Header Right Controls */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Toggle Find in Playlist */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isSearchOpen || playlistFilterQuery
                ? 'bg-emerald-500 text-black font-bold'
                : 'hover:bg-white/10 text-neutral-300 hover:text-white'
            }`}
            title="Search in playlist"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Share button */}
          <button
            onClick={handleSharePlaylist}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Share Playlist"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* 3-Dots More Options Menu */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {isUserCreatedPlaylist && !playlist.isBlend && (
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      setIsEditing(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-neutral-200 hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4 text-neutral-400" />
                    <span>Edit details</span>
                  </button>
                )}

                {playlist.isBlend && (
                  <button
                    onClick={() => {
                      setShowMoreMenu(false);
                      startBlendStory();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-3 transition-colors cursor-pointer font-medium"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>View Taste Match Story</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleDownloadAll();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-neutral-200 hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <ArrowDownCircle className="w-4 h-4 text-neutral-400" />
                  <span>Download all songs</span>
                </button>

                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleSharePlaylist();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-neutral-200 hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-neutral-400" />
                  <span>Share link</span>
                </button>

                {isUserCreatedPlaylist && (
                  <>
                    <div className="h-px bg-neutral-800 my-1.5" />
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowDeleteModal(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors cursor-pointer font-medium"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span>{playlist.isBlend ? 'Leave / Delete Blend' : 'Delete playlist'}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Playlist Hero Banner Section */}
      <div
        className="px-4 sm:px-8 pt-6 pb-8 flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8 rounded-b-3xl relative overflow-hidden"
        style={{
          background: playlist.isBlend
            ? 'linear-gradient(180deg, #6b1420 0%, #20080c 60%, #121212 100%)'
            : `linear-gradient(180deg, ${playlist.color || '#10B981'}44 0%, #121212 100%)`,
        }}
      >
        {/* Cover Artwork (Collage or Blend disc artwork) */}
        <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-2xl overflow-hidden shadow-2xl bg-neutral-900 border border-white/10 flex-shrink-0 transition-transform duration-300 hover:scale-[1.02] relative group">
          <PlaylistArtwork playlist={playlist} className="w-full h-full object-cover" />
          {playlist.isBlend && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3 pointer-events-none">
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                Shared Blend
              </span>
            </div>
          )}
        </div>

        {/* Hero Meta Info */}
        <div className="flex-1 text-center md:text-left space-y-2.5 min-w-0">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className={`text-[11px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full ${
              playlist.isBlend
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : playlist.isCollaborative
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {playlist.isBlend ? 'BLEND' : playlist.isCollaborative ? 'COLLABORATIVE' : 'PLAYLIST'}
            </span>
            {playlist.isBlend && blendInfo && (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                {blendInfo.matchPercentage}% Taste Match
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md leading-tight">
            {playlist.title}
          </h1>

          {playlist.description && (
            <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 max-w-xl mx-auto md:mx-0 font-medium">
              {playlist.description}
            </p>
          )}

          {/* Creators & Participants Pill + Blend Song Contribution Breakdown */}
          <div className="flex flex-col md:items-start items-center gap-1.5 pt-1 text-xs text-neutral-300 font-medium">
            {playlist.isBlend && blendInfo ? (
              <>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <div className="flex items-center">
                    {blendInfo.participants.map((p, i) => (
                      <div
                        key={p.id || i}
                        className={`w-6 h-6 rounded-full border-2 border-neutral-900 flex items-center justify-center text-[10px] font-bold overflow-hidden ${
                          i === 0 ? 'bg-rose-500 text-white' : '-ml-2 bg-emerald-500 text-black'
                        }`}
                      >
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          (p.name.charAt(0) || 'U').toUpperCase()
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="font-bold text-white">
                    {blendInfo.p1.name} + {blendInfo.p2.name}
                  </span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-neutral-200 font-semibold">{playlist.tracks.length} songs</span>
                  {formattedTotalDuration && (
                    <>
                      <span className="text-neutral-500">•</span>
                      <span className="text-neutral-400">{formattedTotalDuration}</span>
                    </>
                  )}
                </div>

                {/* Real Contribution Breakdown Pill */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1 text-[11px] sm:text-xs">
                  <span className="text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md font-semibold">
                    {blendInfo.p1TracksCount} by {blendInfo.p1.name}
                  </span>
                  <span className="text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-semibold">
                    {blendInfo.p2TracksCount} by {blendInfo.p2.name}
                  </span>
                  {blendInfo.bothTracksCount > 0 && (
                    <span className="text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-semibold">
                      {blendInfo.bothTracksCount} by Both
                    </span>
                  )}
                </div>

                {/* Minimal Balance Bar */}
                {playlist.tracks.length > 0 && (
                  <div className="w-48 sm:w-60 h-1.5 rounded-full bg-neutral-800 overflow-hidden flex mt-1">
                    <div
                      style={{ width: `${Math.round((blendInfo.p1TracksCount / playlist.tracks.length) * 100)}%` }}
                      className="bg-rose-500 h-full transition-all"
                      title={`${blendInfo.p1.name}: ${blendInfo.p1TracksCount} songs`}
                    />
                    {blendInfo.bothTracksCount > 0 && (
                      <div
                        style={{ width: `${Math.round((blendInfo.bothTracksCount / playlist.tracks.length) * 100)}%` }}
                        className="bg-amber-400 h-full transition-all"
                        title={`Both: ${blendInfo.bothTracksCount} songs`}
                      />
                    )}
                    <div
                      style={{ width: `${Math.round((blendInfo.p2TracksCount / playlist.tracks.length) * 100)}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`${blendInfo.p2.name}: ${blendInfo.p2TracksCount} songs`}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <div className="flex items-center gap-1.5">
                  {creatorAvatar ? (
                    <img
                      src={creatorAvatar}
                      alt={currentUserName}
                      className="w-5 h-5 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                      {creatorInitial}
                    </div>
                  )}
                  <span className="font-semibold text-white">{currentUserName}</span>
                </div>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-200 font-semibold">{playlist.tracks.length} songs</span>
                {formattedTotalDuration && (
                  <>
                    <span className="text-neutral-500">•</span>
                    <span className="text-neutral-400 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-neutral-400 inline" />
                      <span>{formattedTotalDuration}</span>
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Action Controls Bar (Clean Spotify Layout) */}
      <div className="px-3 sm:px-6 md:px-8 py-4 max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Left Primary Controls */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* Big Green Play / Pause Button */}
          <button
            onClick={handlePlayPlaylist}
            disabled={playlist.tracks.length === 0}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] disabled:opacity-40 text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex-shrink-0 cursor-pointer"
            title="Play Playlist"
          >
            {isPlayingThisPlaylist ? (
              <Pause className="w-7 h-7 fill-black text-black" />
            ) : (
              <Play className="w-7 h-7 fill-black text-black ml-1" />
            )}
          </button>

          {/* Shuffle Toggle */}
          <button
            onClick={handleShufflePlaylist}
            disabled={playlist.tracks.length === 0}
            className="p-3 rounded-full hover:bg-white/10 disabled:opacity-40 text-neutral-300 hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Shuffle Playlist"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Blend Action: Story & Taste */}
          {playlist.isBlend && blendInfo && (
            <button
              onClick={startBlendStory}
              className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="View Taste Story"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Taste Story</span>
            </button>
          )}

          {/* Blend Action: Invite Friend */}
          {playlist.isBlend && (
            <button
              onClick={handleSharePlaylist}
              className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-200 border border-white/10 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Invite Friends"
            >
              <UserPlus className="w-3.5 h-3.5 text-neutral-300" />
              <span>Invite</span>
            </button>
          )}

          {/* Download Control */}
          <button
            onClick={handleDownloadAll}
            disabled={playlist.tracks.length === 0}
            className={`p-3 rounded-full hover:bg-white/10 disabled:opacity-40 transition-all active:scale-95 cursor-pointer ${
              isAllDownloaded ? 'text-emerald-400' : 'text-neutral-300 hover:text-white'
            }`}
            title={isAllDownloaded ? 'Downloaded for offline' : 'Download Playlist'}
          >
            {isAllDownloaded ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <ArrowDownCircle className="w-5 h-5" />
            )}
          </button>

          {/* Add Songs Quick Button for regular playlists */}
          {isUserCreatedPlaylist && !playlist.isBlend && (
            <button
              onClick={() => setShowAddSongs(!showAddSongs)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                showAddSongs
                  ? 'bg-emerald-500 text-black border-emerald-500'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-200 border-white/10'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Songs</span>
            </button>
          )}
        </div>

        {/* Right Secondary Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Sort dropdown on desktop */}
          <div className="hidden sm:flex items-center gap-1.5 bg-neutral-900/80 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-neutral-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              aria-label="Sort tracks by"
              className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="custom" className="bg-neutral-900">Custom Order</option>
              <option value="title" className="bg-neutral-900">Title (A-Z)</option>
              <option value="artist" className="bg-neutral-900">Artist</option>
              <option value="duration" className="bg-neutral-900">Duration</option>
            </select>
          </div>

          {/* Mobile Search button if search bar is closed */}
          {!isSearchOpen && (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer sm:hidden"
              title="Find in playlist"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 5. "FIND IN PLAYLIST" SEARCH & FILTER BOX (Placed cleanly above tracks) */}
      {(isSearchOpen || playlistFilterQuery) && (
        <div className="px-3 sm:px-6 md:px-8 max-w-5xl mx-auto mb-4 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="bg-neutral-900/90 border border-white/10 rounded-2xl p-2.5 flex items-center gap-2 shadow-lg backdrop-blur-md">
            <Search className="w-4 h-4 text-emerald-400 ml-2 flex-shrink-0" />
            <input
              type="text"
              value={playlistFilterQuery}
              onChange={(e) => setPlaylistFilterQuery(e.target.value)}
              placeholder="Filter by title, artist, or album..."
              className="flex-1 bg-transparent text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none px-2"
              autoFocus
            />
            {playlistFilterQuery && (
              <span className="text-[11px] text-neutral-400 font-mono px-2 hidden xs:inline">
                {filteredAndSortedTracks.length} found
              </span>
            )}
            {playlistFilterQuery && (
              <button
                onClick={() => setPlaylistFilterQuery('')}
                className="p-1 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                setPlaylistFilterQuery('');
                setIsSearchOpen(false);
              }}
              className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 6. Song List (Tracks Rows) */}
      <div className="px-3 sm:px-6 md:px-8 max-w-5xl mx-auto space-y-1">
        {filteredAndSortedTracks.length > 0 ? (
          <>
            {/* Desktop Table Header */}
            <div className="hidden sm:flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400 px-3 pb-2 border-b border-white/10 mb-2">
              <div className="flex items-center gap-4">
                <span className="w-6 text-center">#</span>
                <span>Title</span>
              </div>
              <div className="flex items-center gap-8 pr-4">
                <span>Album</span>
                <Clock className="w-4 h-4" />
              </div>
            </div>

            {/* Track Rows */}
            {filteredAndSortedTracks.map((track, idx) => {
              let badge: React.ReactNode = undefined;
              if (playlist.isBlend) {
                const meta = playlist.trackMetadata?.[track.id];
                const influencers = meta?.influencedBy || [];
                const addedBy = meta?.addedBy || '';

                const p1Name = blendInfo?.p1.name || currentUserName;
                const p2Name = blendInfo?.p2.name || 'Friend';

                const matchP1 = influencers.some((n: string) => n.toLowerCase() === p1Name.toLowerCase()) || (addedBy && addedBy.toLowerCase() === p1Name.toLowerCase());
                const matchP2 = influencers.some((n: string) => n.toLowerCase() === p2Name.toLowerCase()) || (addedBy && addedBy.toLowerCase() === p2Name.toLowerCase());

                if (matchP1 && matchP2) {
                  badge = (
                    <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full" title={`Shared taste: ${p1Name} & ${p2Name}`}>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-300">Both</span>
                    </div>
                  );
                } else if (matchP2) {
                  badge = (
                    <div className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full" title={`From ${p2Name}'s taste`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-300">{p2Name}</span>
                    </div>
                  );
                } else {
                  badge = (
                    <div className="flex items-center gap-1 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full" title={`From ${p1Name}'s taste`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <span className="text-[10px] font-bold text-rose-300">{p1Name}</span>
                    </div>
                  );
                }
              } else if (playlist.isCollaborative && playlist.trackMetadata?.[track.id]?.addedBy) {
                const addedBy = playlist.trackMetadata[track.id].addedBy;
                badge = (
                  <div className="flex items-center gap-1 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-full" title={`Added by ${addedBy}`}>
                    <Users className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-300">
                      {addedBy}
                    </span>
                  </div>
                );
              }

              return (
                <div key={`${track.id}-${idx}`} className="group relative flex items-center min-w-0">
                  <div className="flex-1 min-w-0">
                    <TrackRow
                      track={track}
                      index={idx}
                      queueContext={filteredAndSortedTracks}
                      onNavigate={onNavigate}
                      influenceBadge={badge}
                      onRemoveFromPlaylist={
                        isUserCreatedPlaylist && !playlist.isBlend ? () => handleRemoveTrack(track.id) : undefined
                      }
                    />
                  </div>

                  {/* Reorder Arrows on Desktop */}
                  {isUserCreatedPlaylist && !playlist.isBlend && sortOption === 'custom' && (
                    <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-1 pr-2 flex-shrink-0">
                      {idx > 0 && (
                        <button
                          onClick={() => handleMoveTrack(idx, idx - 1)}
                          title="Move Up"
                          className="p-1 text-neutral-400 hover:text-white"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx < playlist.tracks.length - 1 && (
                        <button
                          onClick={() => handleMoveTrack(idx, idx + 1)}
                          title="Move Down"
                          className="p-1 text-neutral-400 hover:text-white"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : playlistFilterQuery ? (
          <div className="py-12 text-center space-y-3 bg-neutral-900/40 rounded-2xl border border-white/5 p-6">
            <Search className="w-10 h-10 mx-auto text-neutral-500" />
            <p className="text-sm text-neutral-300">
              No songs found in this playlist matching &ldquo;<span className="text-white font-semibold">{playlistFilterQuery}</span>&rdquo;
            </p>
            <button
              onClick={() => setPlaylistFilterQuery('')}
              className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Clear Filter
            </button>
          </div>
        ) : (
          <div className="p-10 text-center border border-dashed border-white/10 rounded-3xl space-y-4 bg-neutral-900/30 my-4">
            <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
              <Music className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {playlist.isBlend ? 'Your Blend is getting ready' : 'Your playlist is empty'}
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
                {playlist.isBlend
                  ? 'Blend will automatically match songs as both of you stream music. You can also explore suggestions below!'
                  : 'Start adding your favorite songs from the suggestions below to bring this playlist to life.'}
              </p>
            </div>
            <button
              onClick={() => setShowAddSongs(true)}
              className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              Find Songs to Add
            </button>
          </div>
        )}

        {/* 7. RECOMMENDED SONGS & QUICK ADD BOX (Large, visual cards/boxes!) */}
        {isUserCreatedPlaylist && (
          <section className="pt-8 mt-6 border-t border-white/10 space-y-5">
            {/* Header & Categories */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-emerald-400" />
                  <span>Recommended for this playlist</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Based on what&apos;s in this playlist and current trends
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchSuggestedSongs()}
                  disabled={isRefreshingSuggestions}
                  className="p-2 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  title="Refresh recommendations"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingSuggestions ? 'animate-spin text-emerald-400' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <button
                  onClick={() => setShowAddSongs(!showAddSongs)}
                  className="text-xs text-emerald-400 hover:underline font-bold cursor-pointer"
                >
                  {showAddSongs ? 'Hide Box' : 'Expand Search'}
                </button>
              </div>
            </div>

            {/* Mood Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'trending', label: '🔥 Trending' },
                { id: 'pop', label: '🎵 Pop Hits' },
                { id: 'hindi', label: '🇮🇳 Bollywood & Hindi' },
                { id: 'chill', label: '🎧 Chill & Lofi' },
                { id: 'energy', label: '⚡ Workout & EDM' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveMoodCategory(cat.id);
                    setSongSearchQuery('');
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeMoodCategory === cat.id && !songSearchQuery
                      ? 'bg-white text-black shadow-md'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input for Quick Discovery */}
            {showAddSongs && (
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={songSearchQuery}
                  onChange={(e) => setSongSearchQuery(e.target.value)}
                  placeholder="Search any artist, song, or genre..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>
            )}

            {/* Large Visual Song Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {suggestedSongs.map((track) => {
                const alreadyIn = playlist.tracks.some((t) => t.id === track.id);
                const isThisTrackPlaying = currentTrack?.id === track.id && isPlaying;
                return (
                  <div
                    key={track.id}
                    className="bg-neutral-900/90 hover:bg-neutral-850 border border-white/5 hover:border-white/15 rounded-2xl p-3 flex items-center justify-between gap-3 transition-all group shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Image with Play Overlay */}
                      <div
                        onClick={() => playTrack(track, [track])}
                        className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0 cursor-pointer"
                      >
                        <img
                          src={
                            track.images?.small ||
                            track.images?.medium ||
                            track.images?.large ||
                            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'
                          }
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          {isThisTrackPlaying ? (
                            <Pause className="w-5 h-5 fill-white text-white" />
                          ) : (
                            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-emerald-400 transition-colors">
                          {track.title}
                        </h4>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {track.artist}
                        </p>
                      </div>
                    </div>

                    {/* 1-Tap Add Button */}
                    <button
                      onClick={() => handleAddTrack(track)}
                      disabled={alreadyIn}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 transition-all flex-shrink-0 cursor-pointer ${
                        alreadyIn
                          ? 'bg-neutral-800/80 text-emerald-400 border-emerald-500/30'
                          : 'bg-white/5 hover:bg-white text-white hover:text-black border-white/20'
                      }`}
                      title={alreadyIn ? 'Added to playlist' : 'Add to playlist'}
                    >
                      {alreadyIn ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* 8. EDIT DETAILS MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="text-lg font-bold">Edit Playlist Details</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">
                  Playlist Title
                </label>
                <input
                  type="text"
                  value={editTitle || ''}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">
                  Description
                </label>
                <textarea
                  value={editDesc || ''}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  placeholder="Give your playlist a lovely description..."
                  className="w-full px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] text-black font-semibold text-sm cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-white shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">
              {playlist.isBlend ? 'Leave this Blend?' : 'Delete from Your Library?'}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              This will remove <span className="text-white font-medium">&ldquo;{playlist.title}&rdquo;</span> from Your Library.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 rounded-full bg-neutral-800 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-full bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors cursor-pointer"
              >
                {playlist.isBlend ? 'Leave Blend' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. BLEND TASTE MATCH STORY MODAL */}
      {showBlendStoryModal && blendInfo && (
        <div className="fixed inset-0 z-50 bg-[#121212] flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-200">
          <button
            onClick={() => setShowBlendStoryModal(false)}
            className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Scene 1: Taste Match % */}
          {blendStoryScene === 1 && (
            <div className="text-center space-y-6 max-w-md animate-in zoom-in-95 duration-300">
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-500 via-purple-500 to-emerald-500 animate-spin blur-lg opacity-70" />
                <div className="relative w-32 h-32 rounded-full bg-neutral-950 border-4 border-emerald-400 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-emerald-400">{blendInfo.matchPercentage}%</span>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">MATCH</span>
                </div>
              </div>
              <h2 className="text-3xl font-black">
                {blendInfo.p1.name} + {blendInfo.p2.name}
              </h2>
              <p className="text-base text-neutral-300">
                You two have an extraordinary musical connection! You share overlapping love for trending hits and favorite genres.
              </p>
              <button
                onClick={() => setBlendStoryScene(2)}
                className="px-8 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-base transition-all cursor-pointer shadow-xl"
              >
                See Taste Breakdown →
              </button>
            </div>
          )}

          {/* Scene 2: Taste Breakdown */}
          {blendStoryScene === 2 && (
            <div className="text-center space-y-6 max-w-md animate-in zoom-in-95 duration-300">
              <Sparkles className="w-12 h-12 text-emerald-400 mx-auto" />
              <h2 className="text-2xl sm:text-3xl font-black">
                How Your Blend is Made
              </h2>
              <div className="space-y-4 bg-neutral-900/80 border border-white/10 p-5 rounded-2xl text-left">
                <div>
                  <div className="flex justify-between text-xs font-bold text-neutral-300 mb-1">
                    <span>{blendInfo.p1.name}&apos;s Songs</span>
                    <span className="text-rose-400">
                      {blendInfo.p1TracksCount} songs ({Math.round((blendInfo.p1TracksCount / (blendInfo.totalTracks || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.round((blendInfo.p1TracksCount / (blendInfo.totalTracks || 1)) * 100)}%` }}
                      className="bg-rose-500 h-full rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-neutral-300 mb-1">
                    <span>{blendInfo.p2.name}&apos;s Songs</span>
                    <span className="text-emerald-400">
                      {blendInfo.p2TracksCount} songs ({Math.round((blendInfo.p2TracksCount / (blendInfo.totalTracks || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.round((blendInfo.p2TracksCount / (blendInfo.totalTracks || 1)) * 100)}%` }}
                      className="bg-emerald-500 h-full rounded-full"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowBlendStoryModal(false)}
                className="px-8 py-3 rounded-full bg-white text-black font-bold text-base transition-all cursor-pointer shadow-xl"
              >
                Back to Playlist
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
