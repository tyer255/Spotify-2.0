import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Playlist, ViewState, Track } from '../types';
import { api } from '../services/apiClient';
import { db } from '../services/firebase';
import { usePlayer } from '../context/PlayerContext';
import { useUser } from '../context/UserContext';
import { TrackRow } from '../components/Common/TrackRow';
import { HeroSkeleton } from '../components/Common/SkeletonLoaders';
import { PlaylistArtwork } from '../components/Common/PlaylistArtwork';
import { AddToPlaylistPage } from '../components/Playlist/AddToPlaylistPage';
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
 MoreHorizontal, Menu, MinusCircle, PlusCircle, PenSquare,
 MoreVertical,
 SlidersHorizontal,
 RefreshCw,
 Flame,
 Radio,
 Heart,
 ExternalLink,
 Info,
 Loader2,
 Share,
} from 'lucide-react';

interface PlaylistViewProps {
 playlistId: string;
 onNavigate: (view: ViewState) => void;
 onGoBack?: () => void;
}

type SortOption = 'custom' | 'title' | 'artist' | 'album' | 'recently_added';

export const PlaylistView: React.FC<PlaylistViewProps> = ({ playlistId, onNavigate, onGoBack }) => {
 const [playlist, setPlaylist] = useState<Playlist | null>(null);
 const [loading, setLoading] = useState<boolean>(true);
 
 // Search & Filter within playlist
 const [playlistFilterQuery, setPlaylistFilterQuery] = useState('');
 const [sortOption, setSortOption] = useState<SortOption>('custom');

 // Modals & Menus
 const [isEditing, setIsEditing] = useState(false);
 const [showPlaylistMenuSheet, setShowPlaylistMenuSheet] = useState(false);
 const [showNameDetailsSheet, setShowNameDetailsSheet] = useState(false);
 const [showSortSheet, setShowSortSheet] = useState(false);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [showLeaveBlendModal, setShowLeaveBlendModal] = useState(false);
 const [showBlendStoryModal, setShowBlendStoryModal] = useState(false);
 const [showMoreMenu, setShowMoreMenu] = useState(false);
 const [blendStoryScene, setBlendStoryScene] = useState<1 | 2 | 3>(1);

 // Edit fields
 const [editTitle, setEditTitle] = useState('');
 const [editDesc, setEditDesc] = useState('');

 // Dedicated Add to Playlist Page
 const [isAddSongsPageOpen, setIsAddSongsPageOpen] = useState(false);

 const moreMenuRef = useRef<HTMLDivElement>(null);
 const coverFileInputRef = useRef<HTMLInputElement>(null);

 const { track: currentTrack, isPlaying, playTrack, togglePlay, setShuffleEnabled } = usePlayer();
 const {
  profile,
  firebaseUser,
  playlists,
  likedTracksList,
  downloadedTracksList,
  downloadedTrackIds,
  toggleDownloadTrack,
  downloadPlaylistTracks,
  playlistDownloadProgress,
  isTrackDownloaded,
  updatePlaylist,
  deletePlaylist,
  removeTrackFromPlaylist,
  addTrackToPlaylist,
  reorderPlaylist,
  showToast,
  isTrackHidden,
 } = useUser();

 // Prevent background scrolling when any bottom sheet or modal is open
 const isAnyModalOpen =
  isAddSongsPageOpen ||
  showPlaylistMenuSheet ||
  showNameDetailsSheet ||
  showSortSheet ||
  showDeleteModal ||
  showLeaveBlendModal ||
  showBlendStoryModal;

 useEffect(() => {
  if (isAnyModalOpen) {
   const originalOverflow = document.body.style.overflow;
   document.body.style.overflow = 'hidden';
   return () => {
    document.body.style.overflow = originalOverflow;
   };
  }
 }, [isAnyModalOpen]);

 // Instant scroll to top when entering edit mode so songs start from the very top
 const handleStartEditing = () => {
  setIsEditing(true);
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  const mainEl = document.querySelector('main');
  if (mainEl) {
   mainEl.scrollTop = 0;
  }
 };

 const handleStopEditing = () => {
  setIsEditing(false);
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  const mainEl = document.querySelector('main');
  if (mainEl) {
   mainEl.scrollTop = 0;
  }
 };

 useEffect(() => {
  if (isEditing) {
   window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
   const mainEl = document.querySelector('main');
   if (mainEl) {
    mainEl.scrollTop = 0;
   }
  }
 }, [isEditing]);

 const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
   showToast({ message: 'Please select an image file from your device', iconType: 'info' });
   return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
   const rawDataUrl = event.target?.result as string;
   const img = new Image();
   img.onload = async () => {
    try {
     const canvas = document.createElement('canvas');
     const MAX_SIZE = 600;
     let width = img.width;
     let height = img.height;
     if (width > height) {
      if (width > MAX_SIZE) {
       height = Math.round((height * MAX_SIZE) / width);
       width = MAX_SIZE;
      }
     } else {
      if (height > MAX_SIZE) {
       width = Math.round((width * MAX_SIZE) / height);
       height = MAX_SIZE;
      }
     }
     canvas.width = width;
     canvas.height = height;
     const ctx = canvas.getContext('2d');
     if (ctx && playlist) {
      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      setPlaylist((prev) => (prev ? { ...prev, coverImage: compressedDataUrl } : null));
      await updatePlaylist(playlist.id, { coverImage: compressedDataUrl });
      showToast({ message: 'Playlist thumbnail updated from gallery', iconType: 'playlist' });
     }
    } catch (err) {
     console.error('Error processing gallery image:', err);
     showToast({ message: 'Could not process selected image', iconType: 'info' });
    }
   };
   img.src = rawDataUrl;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
 };

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
  let list = [...playlist.tracks].filter(t => !isTrackHidden(t.id));

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
  } else if (sortOption === 'recently_added') {
   list.sort((a, b) => {
    const timeA = playlist.trackMetadata?.[a.id]?.addedAt || 0;
    const timeB = playlist.trackMetadata?.[b.id]?.addedAt || 0;
    return timeB - timeA;
   });
  }

  return list;
 }, [playlist, playlistFilterQuery, sortOption, isTrackHidden]);

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
  return playlist.tracks.every((t) => isTrackDownloaded(t.id));
 }, [playlist, downloadedTrackIds, isTrackDownloaded]);

 const isDownloadingThisPlaylist = useMemo(() => {
  return !!(playlistDownloadProgress?.isDownloading && playlistDownloadProgress?.playlistId === playlist?.id);
 }, [playlistDownloadProgress, playlist]);

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
  if (filteredAndSortedTracks.length > 0) {
   if (isPlayingThisPlaylist) {
    togglePlay();
   } else {
    playTrack(filteredAndSortedTracks[0], filteredAndSortedTracks);
   }
  }
 };

 const handleShufflePlaylist = () => {
  if (filteredAndSortedTracks.length > 0) {
   setShuffleEnabled(true);
   const randomIndex = Math.floor(Math.random() * filteredAndSortedTracks.length);
   playTrack(filteredAndSortedTracks[randomIndex], filteredAndSortedTracks);
  }
 };

 const handleDownloadAll = async () => {
  if (!filteredAndSortedTracks || filteredAndSortedTracks.length === 0 || !playlist) return;
  await downloadPlaylistTracks(filteredAndSortedTracks, playlist.id, playlist.title);
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
      ? `Check out our Blend"${playlist.title}" on Spotiz!`
      : `Listen to"${playlist.title}" on Spotiz!`,
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

 const handleSaveEdit = async (e: React.FormEvent | React.MouseEvent) => {
  e.preventDefault();
  if (!editTitle.trim()) return;
  await updatePlaylist(playlist.id, {
   title: editTitle.trim(),
   description: editDesc.trim(),
  });
  setPlaylist((prev) => (prev ? { ...prev, title: editTitle.trim(), description: editDesc.trim() } : null));
  setShowNameDetailsSheet(false);
  showToast({ message: 'Playlist details updated', iconType: 'playlist' });
 };

 const handleConfirmDelete = async () => {
  if (!playlist) return;
  const success = await deletePlaylist(playlist.id);
  setShowDeleteModal(false);
  if (success) {
   showToast({ message: playlist.isBlend ? 'Left Blend successfully' : 'Playlist removed from library', iconType: 'info' });
   onNavigate({ type: 'library' });
  }
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
  showToast({ message: `Added"${track.title}" to playlist`, thumbnail: track.images?.small });
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

 if (isEditing) {
  return (
   <div className=" text-white min-h-full bg-[#121212]">
    {/* Edit Top Navigation Bar */}
    <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#121212] border-b border-white/10">
     <button
      onClick={handleStopEditing}
      className="text-white hover:text-white/80 transition-colors p-2 -ml-2 cursor-pointer"
     >
      <ArrowLeft className="w-6 h-6" />
     </button>
     <span className="font-bold text-base">Edit playlist</span>
     <button
      onClick={handleStopEditing}
      className="text-white font-bold text-sm hover:text-neutral-300 transition-colors p-2 -mr-2 cursor-pointer"
     >
      Save
     </button>
    </div>
    
    {/* Editable Track List */}
    <div className="flex-1 px-4 py-4 space-y-4 max-w-5xl mx-auto">
     {playlist.tracks.map((track, idx) => (
      <div key={`${track.id}-${idx}`} className="flex items-center gap-3">
       <button
        onClick={() => handleRemoveTrack(track.id)}
        className="text-white hover:text-white/80 transition-colors flex-shrink-0"
       >
        <MinusCircle className="w-6 h-6 stroke-[1.5]" />
       </button>
       <div className="w-12 h-12 flex-shrink-0 bg-neutral-800 rounded overflow-hidden">
        <img src={track.images?.small || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'} alt="" className="w-full h-full object-cover" />
       </div>
       <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="text-white text-base font-medium truncate">{track.title}</div>
        <div className="text-neutral-400 text-sm truncate">{track.artist}</div>
       </div>
       
       <div className="flex items-center gap-1 flex-shrink-0">
        {idx > 0 && (
         <button onClick={() => handleMoveTrack(idx, idx - 1)} className="p-1.5 text-neutral-400 hover:text-white">
           <ArrowUp className="w-4 h-4" />
         </button>
        )}
        {idx < playlist.tracks.length - 1 && (
         <button onClick={() => handleMoveTrack(idx, idx + 1)} className="p-1.5 text-neutral-400 hover:text-white">
           <ArrowDown className="w-4 h-4" />
         </button>
        )}
        <div className="p-2 text-neutral-400">
         <Menu className="w-6 h-6 stroke-[1.5]" />
        </div>
       </div>
      </div>
     ))}
     
     <div className="pt-6">
      <button
        onClick={() => {
         handleStopEditing();
         setIsAddSongsPageOpen(true);
        }}
        className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 rounded-full font-bold text-white transition-colors text-sm cursor-pointer"
      >
       Add songs
      </button>
     </div>
    </div>
   </div>
  );
 }

 return (
  <div className="relative text-white min-h-full selection:bg-emerald-500 selection:text-black bg-[#121212]">
   {/* Top Navigation Bar with Back Button */}
   <div className="absolute top-0 left-0 right-0 z-30 px-4 sm:px-8 py-4 flex items-center bg-gradient-to-b from-black/60 to-transparent">
    <button
     onClick={handleBack}
     className="p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all active:scale-95 flex items-center justify-center cursor-pointer"
     title="Go Back"
    >
     <ArrowLeft className="w-5 h-5" />
    </button>
   </div>

   {/* Dynamic Background Gradient (Absolute Layer covering top) */}
   <div
    className="absolute top-0 left-0 right-0 h-96 sm:h-[450px] transition-colors duration-500 z-0 pointer-events-none"
    style={{
     background: playlist.isBlend
      ? 'linear-gradient(180deg, #6b1420 0%, #121212 100%)'
      : `linear-gradient(180deg, ${playlist.color || '#452A20'} 0%, #121212 100%)`,
    }}
   />

   {/* Content wrapper */}
   <div className="relative z-10 pt-24 pb-6">

    {/* 2."Find in playlist" Search Bar (Always visible) */}
    <div className="relative z-10 px-4 pt-1 pb-4 max-w-5xl mx-auto">
     <div className="bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-md flex items-center px-3 py-2.5 transition-colors">
      <Search className="w-5 h-5 text-white mr-3 opacity-90" />
      <input
       type="text"
       placeholder="Find in playlist"
       value={playlistFilterQuery}
       onChange={(e) => setPlaylistFilterQuery(e.target.value)}
       className="bg-transparent border-none outline-none text-white placeholder:text-white text-[15px] font-semibold w-full"
      />
      {playlistFilterQuery && (
       <button onClick={() => setPlaylistFilterQuery('')} className="ml-2">
        <X className="w-5 h-5 text-white/90 hover:text-white cursor-pointer" />
       </button>
      )}
     </div>
    </div>



    {/* 3. Artwork Section */}
    <div className="relative z-10 flex justify-center px-4 pt-2 pb-6">
     <div className="w-60 h-60 sm:w-64 sm:h-64 shadow-2xl relative">
      <PlaylistArtwork playlist={playlist} className="w-full h-full object-cover shadow-2xl rounded-none" />
      {playlist.isBlend && (
       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3 pointer-events-none">
        <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
         Shared Blend
        </span>
       </div>
      )}
     </div>
    </div>

    {/* 4. Title & Meta Section */}
    <div className="relative z-10 px-4 max-w-5xl mx-auto">
     <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight">
      {playlist.title}
     </h1>

     {playlist.description && (
      <p className="text-sm text-neutral-300 mb-3 line-clamp-2">
       {playlist.description}
      </p>
     )}

     {/* Creators & Participants */}
     <div className="flex items-center gap-2 mb-1 text-[13px] text-white font-semibold">
      {playlist.isBlend && blendInfo ? (
       <div className="flex items-center gap-2">
        <div className="flex items-center">
         {blendInfo.participants.map((p, i) => (
          <div
           key={p.id || i}
           className={`w-6 h-6 rounded-full border-2 border-[#121212] flex items-center justify-center text-[10px] font-bold overflow-hidden ${
            i === 0 ? 'bg-rose-500 text-white z-10' : '-ml-2 bg-emerald-500 text-black z-0'
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
        <span>{blendInfo.p1.name} + {blendInfo.p2.name}</span>
       </div>
      ) : (
       <div className="flex items-center gap-2">
        {creatorAvatar ? (
         <img
          src={creatorAvatar}
          alt={currentUserName}
          className="w-6 h-6 rounded-full object-cover"
         />
        ) : (
         <div className="w-6 h-6 rounded-full bg-[#E57A90] text-black text-xs font-bold flex items-center justify-center">
          {creatorInitial}
         </div>
        )}
        <span>{currentUserName}</span>
       </div>
      )}
     </div>

     {/* Duration & Globe icon */}
     <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-medium mb-5">
      <Globe className="w-3.5 h-3.5" />
      <span>{formattedTotalDuration}</span>
     </div>

     {/* 5. Action Controls Bar */}
     <div className="flex items-center justify-between pb-5">
      {/* Left Controls */}
      <div className="flex items-center gap-4 text-neutral-400">
       <button
        onClick={handleDownloadAll}
        disabled={playlist.tracks.length === 0 || isDownloadingThisPlaylist}
        className={`transition-all active:scale-95 cursor-pointer ${
         isAllDownloaded ? 'text-[#1ed760]' : 'hover:text-white'
        }`}
        title={
         isDownloadingThisPlaylist
          ? `Downloading (${playlistDownloadProgress?.current || 0}/${playlistDownloadProgress?.total || 0})`
          : isAllDownloaded
          ? 'Downloaded for offline'
          : 'Download Playlist'
        }
       >
        {isDownloadingThisPlaylist ? (
         <Loader2 className="w-7 h-7 text-[#1ed760] animate-spin" />
        ) : isAllDownloaded ? (
         <ArrowDownCircle className="w-7 h-7 text-[#1ed760] fill-[#1ed760]/20" />
        ) : (
         <ArrowDownCircle className="w-7 h-7 stroke-[1.5]" />
        )}
       </button>

       <button
        onClick={handleSharePlaylist}
        className="hover:text-white transition-colors cursor-pointer"
        title="Share Playlist"
       >
        <Share2 className="w-6 h-6 stroke-[1.5]" />
       </button>

       <button
        onClick={() => setShowPlaylistMenuSheet(true)}
        className="hover:text-white transition-colors cursor-pointer"
        title="More options"
       >
        <MoreHorizontal className="w-7 h-7" />
       </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-5">
       <button
        onClick={handleShufflePlaylist}
        disabled={playlist.tracks.length === 0}
        className="hover:text-white disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
        title="Shuffle Playlist"
       >
        <Shuffle className="w-7 h-7 text-[#1ed760]" />
       </button>
       <button
        onClick={handlePlayPlaylist}
        disabled={playlist.tracks.length === 0}
        className="w-14 h-14 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] disabled:opacity-40 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 flex-shrink-0 cursor-pointer"
        title="Play Playlist"
       >
        {isPlayingThisPlaylist ? (
         <Pause className="w-6 h-6 fill-black" />
        ) : (
         <Play className="w-6 h-6 fill-black ml-1" />
        )}
       </button>
      </div>
     </div>

     {/* 6. Chips Row (Add, Edit, Sort, Name...) */}
     {isUserCreatedPlaylist && (
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
       {!playlist.isBlend && (
        <button
         onClick={() => setIsAddSongsPageOpen(true)}
         className="flex flex-shrink-0 items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/30 hover:border-white text-white text-sm font-semibold whitespace-nowrap transition-colors bg-transparent cursor-pointer"
        >
         <Plus className="w-4 h-4" /> Add
        </button>
       )}
       {!playlist.isBlend && (
        <button
         onClick={handleStartEditing}
         className="flex flex-shrink-0 items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/30 hover:border-white text-white text-sm font-semibold whitespace-nowrap transition-colors bg-transparent cursor-pointer"
        >
         <Edit2 className="w-4 h-4" /> Edit
        </button>
       )}
       
       <div 
         onClick={() => setShowSortSheet(true)}
         className="flex flex-shrink-0 items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/30 hover:border-white text-white text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer bg-transparent"
       >
        <SlidersHorizontal className="w-4 h-4" /> 
        <span>Sort</span>
       </div>

       {!playlist.isBlend && (
        <button
         onClick={() => setShowNameDetailsSheet(true)}
         className="flex flex-shrink-0 items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/30 hover:border-white text-white text-sm font-semibold whitespace-nowrap transition-colors bg-transparent"
        >
         <Edit2 className="w-4 h-4" /> Name
        </button>
       )}
      </div>
     )}
    </div>
   </div>

   {/* 6. Song List (Tracks Rows) */}
   <div className="px-3 sm:px-6 md:px-8 max-w-5xl mx-auto">
    {filteredAndSortedTracks.length > 0 ? (
     <>
      {/* Desktop Table Header */}
      <div className="hidden sm:grid grid-cols-[minmax(0,6fr)_minmax(0,4fr)_84px_40px] items-center gap-4 text-xs font-semibold uppercase tracking-wider text-neutral-400 px-3 pb-2 border-b border-white/10 mb-2 select-none">
       <div className="flex items-center">
        <span className="ml-[52px]">Title</span>
       </div>
       <div className="flex items-center">
        <span>Album</span>
       </div>
       <div className="flex items-center justify-end pr-1">
        <Clock className="w-4 h-4" />
       </div>
       <div>{/* Action column placeholder */}</div>
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
        <div key={`${track.id}-${idx}`} className="group relative w-full">
         {/* Reorder Arrows on Desktop (Absolute overlay in left gutter so columns never shift) */}
         {isUserCreatedPlaylist && !playlist.isBlend && sortOption === 'custom' && (
          <div className="hidden sm:flex flex-col items-center justify-center absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
           {idx > 0 && (
            <button
             onClick={(e) => {
              e.stopPropagation();
              handleMoveTrack(idx, idx - 1);
             }}
             title="Move Up"
             className="p-0.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
             <ArrowUp className="w-3.5 h-3.5" />
            </button>
           )}
           {idx < playlist.tracks.length - 1 && (
            <button
             onClick={(e) => {
              e.stopPropagation();
              handleMoveTrack(idx, idx + 1);
             }}
             title="Move Down"
             className="p-0.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
             <ArrowDown className="w-3.5 h-3.5" />
            </button>
           )}
          </div>
         )}

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
       onClick={() => setIsAddSongsPageOpen(true)}
       className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all shadow-md cursor-pointer"
      >
       Find Songs to Add
      </button>
     </div>
    )}
   </div>

   {/* Hidden File Input for Device Gallery Cover Art Selection */}
   <input
    ref={coverFileInputRef}
    type="file"
    accept="image/*"
    className="hidden"
    onChange={handleCoverImageUpload}
   />

   {/* 8. NAME & DETAILS BOTTOM SHEET */}
   {showNameDetailsSheet && typeof document !== 'undefined' && createPortal(
    <div className="fixed inset-0 z-[1000] flex flex-col justify-end">
     <div className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer" onClick={() => setShowNameDetailsSheet(false)} />
     <div className="relative bg-[#121212] w-full max-w-md mx-auto sm:rounded-t-3xl rounded-t-2xl pt-2 pb-8 px-4 animate-in slide-in-from-bottom duration-300 shadow-2xl border-t border-white/10 max-h-[85vh] overflow-y-auto">
      {/* Handle */}
      <div className="w-12 h-1.5 bg-neutral-600 rounded-full mx-auto mb-4" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <button onClick={() => setShowNameDetailsSheet(false)} className="text-[15px] font-semibold text-white hover:text-white/80 cursor-pointer">Cancel</button>
        <h3 className="text-base font-bold text-white">Name & details</h3>
        <button onClick={handleSaveEdit} className="text-[15px] font-bold text-[#1ed760] hover:text-[#1fdf64] cursor-pointer">Save</button>
      </div>

      <form onSubmit={handleSaveEdit} className="flex flex-col gap-6 px-1">
        {/* Artwork + Inputs row */}
        <div className="flex gap-4 items-start">
         <div 
          onClick={() => coverFileInputRef.current?.click()}
          className="w-28 h-28 flex-shrink-0 rounded-sm overflow-hidden relative shadow-md bg-neutral-800 cursor-pointer group"
          title="Change cover from gallery"
         >
           <PlaylistArtwork playlist={playlist} className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center cursor-pointer group-hover:bg-black/40 transition-colors">
            <Edit2 className="w-6 h-6 text-white opacity-90 mb-1" />
            <span className="text-[11px] text-white/90 font-medium">Change image</span>
           </div>
         </div>
         
         <div className="flex-1 flex flex-col gap-3 min-w-0">
           <input
            type="text"
            value={editTitle || ''}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Playlist name"
            className="w-full bg-[#282828] text-white text-sm rounded-md px-3 py-3 font-semibold placeholder:text-neutral-500 border-none outline-none focus:ring-1 focus:ring-white/30"
           />
           <textarea
            value={editDesc || ''}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="Add description"
            rows={2}
            className="w-full bg-[#282828] text-white text-sm rounded-md px-3 py-3 font-medium placeholder:text-neutral-500 border-none outline-none focus:ring-1 focus:ring-white/30 resize-none leading-relaxed"
           />
         </div>
        </div>

        <div className="h-px bg-white/10 w-full my-2" />

        {/* Make Public */}
        <button type="button" className="flex items-center gap-4 w-full group py-2 hover:bg-white/5 rounded-md px-2 -mx-2 transition-colors cursor-pointer">
         <Globe className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
         <span className="text-base font-medium text-white">Make public</span>
        </button>

        {/* Delete Playlist */}
        {isUserCreatedPlaylist && !playlist.isBlend && (
         <button type="button" onClick={() => {
           setShowNameDetailsSheet(false);
           setShowDeleteModal(true);
         }} className="flex items-center gap-4 w-full group py-2 hover:bg-white/5 rounded-md px-2 -mx-2 transition-colors cursor-pointer mt-1">
          <Trash2 className="w-6 h-6 text-red-500 group-hover:text-red-400 transition-colors" />
          <span className="text-base font-medium text-red-500 group-hover:text-red-400">Delete playlist</span>
         </button>
        )}
      </form>
     </div>
    </div>,
    document.body
   )}

   {/* 9. DELETE CONFIRMATION MODAL */}
   {showDeleteModal && typeof document !== 'undefined' && createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
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
    </div>,
    document.body
   )}

   {/* 10. BLEND TASTE MATCH STORY MODAL */}
   {showBlendStoryModal && blendInfo && typeof document !== 'undefined' && createPortal(
    <div className="fixed inset-0 z-[1000] bg-[#121212] flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-200">
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
    </div>,
    document.body
   )}

   {/* SORT BOTTOM SHEET */}
   {showSortSheet && typeof document !== 'undefined' && createPortal(
    <div className="fixed inset-0 z-[1000] flex flex-col justify-end">
     <div className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer" onClick={() => setShowSortSheet(false)} />
     <div className="relative bg-[#282828] w-full max-w-md mx-auto sm:rounded-t-3xl rounded-t-2xl pt-2 pb-8 px-4 animate-in slide-in-from-bottom duration-300 shadow-2xl border-t border-white/10 max-h-[85vh] overflow-y-auto">
      <div className="w-12 h-1.5 bg-neutral-600 rounded-full mx-auto mb-6" />
      <h3 className="text-lg font-bold text-white mb-2 px-2">Sort by</h3>
      <div className="flex flex-col">
        {(['custom', 'title', 'artist', 'album', 'recently_added'] as SortOption[]).map((option) => (
         <button
           key={option}
           onClick={() => {
            setSortOption(option);
            setShowSortSheet(false);
           }}
           className="flex items-center justify-between w-full py-4 px-2 hover:bg-white/5 transition-colors cursor-pointer"
         >
           <span className={`text-base font-medium ${sortOption === option ? 'text-[#1ed760]' : 'text-white'}`}>
            {option === 'custom' ? 'Custom order' : 
             option === 'title' ? 'Title' : 
             option === 'artist' ? 'Artist' : 
             option === 'album' ? 'Album' : 'Recently added'}
           </span>
           {sortOption === option && (
            <CheckCircle2 className="w-5 h-5 text-[#1ed760]" />
           )}
         </button>
        ))}
      </div>
      <button onClick={() => setShowSortSheet(false)} className="w-full mt-4 py-4 text-center font-bold text-white hover:text-neutral-300 cursor-pointer">
        Cancel
      </button>
     </div>
    </div>,
    document.body
   )}

   {/* PLAYLIST MENU BOTTOM SHEET */}
   {showPlaylistMenuSheet && typeof document !== 'undefined' && createPortal(
    <div className="fixed inset-0 z-[1000] flex flex-col justify-end">
     <div className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer" onClick={() => setShowPlaylistMenuSheet(false)} />
     <div className="relative bg-[#282828] w-full max-w-md mx-auto sm:rounded-t-3xl rounded-t-2xl pt-2 pb-8 px-4 animate-in slide-in-from-bottom duration-300 shadow-2xl border-t border-white/10 max-h-[85vh] overflow-y-auto">
      <div className="w-12 h-1.5 bg-neutral-600 rounded-full mx-auto mb-6" />
      
      {/* Menu Header */}
      <div className="flex items-center gap-4 px-2 pb-4 mb-2 border-b border-white/10">
        <div className="w-14 h-14 flex-shrink-0 bg-neutral-800 rounded-sm overflow-hidden">
         <PlaylistArtwork playlist={playlist} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
         <h3 className="text-lg font-bold text-white truncate">{playlist.title}</h3>
         <p className="text-sm text-neutral-400 truncate">
           by {currentUserName} • {playlist.isPublic ? 'Public' : 'Private'} playlist
         </p>
        </div>
      </div>

      <div className="flex flex-col">
        <button onClick={() => {
          setShowPlaylistMenuSheet(false);
          handleSharePlaylist();
        }} className="flex items-center gap-4 w-full py-4 px-2 hover:bg-white/5 transition-colors cursor-pointer">
         <Share2 className="w-6 h-6 text-neutral-400" />
         <span className="text-base font-medium text-white">Share</span>
        </button>

        <button onClick={() => {
          setShowPlaylistMenuSheet(false);
          handleDownloadAll();
        }} disabled={isDownloadingThisPlaylist} className="flex items-center gap-4 w-full py-4 px-2 hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50">
         {isDownloadingThisPlaylist ? (
          <Loader2 className="w-6 h-6 text-[#1ed760] animate-spin" />
         ) : (
          <ArrowDownCircle className="w-6 h-6 text-neutral-400" />
         )}
         <span className="text-base font-medium text-white">
          {isDownloadingThisPlaylist
           ? `Downloading (${playlistDownloadProgress?.current || 0}/${playlistDownloadProgress?.total || 0})...`
           : 'Download'}
         </span>
        </button>

        {isUserCreatedPlaylist && !playlist.isBlend && (
         <button onClick={() => {
           setShowPlaylistMenuSheet(false);
           setIsAddSongsPageOpen(true);
         }} className="flex items-center gap-4 w-full py-4 px-2 hover:bg-white/5 transition-colors cursor-pointer">
          <PlusCircle className="w-6 h-6 text-neutral-400" />
          <span className="text-base font-medium text-white">Add to this playlist</span>
         </button>
        )}

        {isUserCreatedPlaylist && !playlist.isBlend && (
         <button onClick={() => {
           setShowPlaylistMenuSheet(false);
           handleStartEditing();
         }} className="flex items-center gap-4 w-full py-4 px-2 hover:bg-white/5 transition-colors cursor-pointer">
          <Menu className="w-6 h-6 text-neutral-400" />
          <span className="text-base font-medium text-white">Edit playlist</span>
         </button>
        )}

        {isUserCreatedPlaylist && !playlist.isBlend && (
         <button onClick={() => {
           setShowPlaylistMenuSheet(false);
           setShowNameDetailsSheet(true);
         }} className="flex items-center gap-4 w-full py-4 px-2 hover:bg-white/5 transition-colors cursor-pointer">
          <Edit2 className="w-6 h-6 text-neutral-400" />
          <span className="text-base font-medium text-white">Name and details</span>
         </button>
        )}

        <button onClick={() => {
          setShowPlaylistMenuSheet(false);
          coverFileInputRef.current?.click();
        }} className="flex items-center gap-4 w-full py-4 px-2 hover:bg-white/5 transition-colors cursor-pointer">
         <PenSquare className="w-6 h-6 text-neutral-400" />
         <span className="text-base font-medium text-white">Create cover art</span>
        </button>

        {isUserCreatedPlaylist && (
         <button onClick={() => {
           setShowPlaylistMenuSheet(false);
           setShowDeleteModal(true);
         }} className="flex items-center gap-4 w-full py-4 px-2 hover:bg-white/5 transition-colors cursor-pointer">
          <Trash2 className="w-6 h-6 text-neutral-400" />
          <span className="text-base font-medium text-white">
           {playlist.isBlend ? 'Leave Blend' : 'Delete playlist'}
          </span>
         </button>
        )}

        <button onClick={() => {
          setShowPlaylistMenuSheet(false);
          showToast({ message: 'Select a playlist from library.', iconType: 'info' });
        }} className="flex items-center gap-4 w-full py-4 px-2 hover:bg-white/5 transition-colors cursor-pointer">
         <PlusCircle className="w-6 h-6 text-neutral-400" />
         <span className="text-base font-medium text-white">Add to other playlist</span>
        </button>
      </div>
      
      <button onClick={() => setShowPlaylistMenuSheet(false)} className="w-full mt-2 py-4 text-center font-bold text-white hover:text-neutral-300 cursor-pointer">
        Close
      </button>
     </div>
    </div>,
    document.body
   )}

   {/* Dedicated Fullscreen Add to Playlist Page */}
   {isAddSongsPageOpen && playlist && (
    <AddToPlaylistPage
     playlist={playlist}
     onClose={() => setIsAddSongsPageOpen(false)}
     onAddTrack={handleAddTrack}
    />
   )}
  </div>
 );
};
