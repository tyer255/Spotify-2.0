cat << 'INNER_EOF' > src/components/Common/ContextMenu.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Track, ViewState } from '../../types';
import { usePlayer } from '../../context/PlayerContext';
import { useUser } from '../../context/UserContext';
import { PlaylistArtwork } from './PlaylistArtwork';
import {
  ListPlus,
  Heart,
  Download,
  Share2,
  User,
  Disc3,
  Check,
  PlusCircle,
  Menu,
  Users,
  XCircle,
  Radio,
  FileMusic,
  AudioLines,
  Trash2,
} from 'lucide-react';

interface ContextMenuProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: ViewState) => void;
  onDeleteFromHistory?: () => void;
  showRemoveFromHistory?: boolean;
  onRemoveFromPlaylist?: () => void;
}

type MenuTab = 'main' | 'playlist' | 'credits' | 'code';

export const ContextMenu: React.FC<ContextMenuProps> = ({
  track,
  isOpen,
  onClose,
  onNavigate,
  onDeleteFromHistory,
  showRemoveFromHistory,
  onRemoveFromPlaylist,
}) => {
  const { addToQueue, setIsQueueOpen } = usePlayer();
  const {
    profile,
    isTrackLiked,
    toggleLikeTrack,
    isTrackDownloaded,
    toggleDownloadTrack,
    isDownloadingTrack,
    getTrackDownloadProgress,
    playlists,
    addTrackToPlaylist,
    removeTrackFromHistory,
    showToast,
  } = useUser();

  const [activeTab, setActiveTab] = useState<MenuTab>('main');

  // Reset tab when modal closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setActiveTab('main'), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const isLiked = track ? isTrackLiked(track.id) : false;
  const isDownloaded = track ? isTrackDownloaded(track.id) : false;
  const isDownloading = track ? isDownloadingTrack(track.id) : false;
  const downloadProgress = track ? getTrackDownloadProgress(track.id) : undefined;

  const isTrackInHistory = track ? Boolean(profile?.recentHistory?.some((h) => h.track.id === track.id)) : false;
  const canRemoveFromHistory = Boolean(showRemoveFromHistory || isTrackInHistory || onDeleteFromHistory);

  const handleRemoveFromHistory = () => {
    if (!track) return;
    if (onDeleteFromHistory) {
      onDeleteFromHistory();
    } else {
      removeTrackFromHistory(track.id);
    }
    handleClose();
  };

  const handleAddToQueue = () => {
    if (!track) return;
    addToQueue(track);
    showToast(`Added "${track.title}" to Queue`);
    handleClose();
  };

  const handleGoToQueue = () => {
    setIsQueueOpen(true);
    handleClose();
  };

  const handleToggleLike = async () => {
    if (!track) return;
    await toggleLikeTrack(track);
    handleClose();
  };

  const handleToggleDownload = async () => {
    if (!track || isDownloading) return;
    await toggleDownloadTrack(track);
    handleClose();
  };

  const handleShare = async () => {
    if (!track) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${track.title} by ${track.artist}`,
          text: `Check out ${track.title} by ${track.artist}`,
          url: `${window.location.origin}/#track=${track.id}`
        });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(`${window.location.origin}/#track=${track.id}`);
        showToast(`Link copied to clipboard!`);
      } else {
        showToast(`Track: ${track.title} by ${track.artist}`);
      }
    } catch (err) {
      console.warn('Share failed:', err);
    }
    handleClose();
  };

  const handleGoToArtist = () => {
    if (!track) return;
    if (onNavigate) {
      onNavigate({ type: 'artist', artistId: track.artistId });
    }
    handleClose();
  };

  const handleGoToAlbum = () => {
    if (!track) return;
    if (onNavigate) {
      onNavigate({ type: 'album', albumId: track.albumId });
    }
    handleClose();
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    if (!track) return;
    await addTrackToPlaylist(playlistId, track);
    handleClose();
  };

  const handleExcludeTaste = () => {
    showToast('Track excluded from your taste profile.');
    handleClose();
  };

  const handleSongRadio = () => {
    if (!track) return;
    showToast(`Starting Radio for ${track.artist}...`);
    if (onNavigate) {
      onNavigate({ type: 'search', initialQuery: track.artist });
    }
    handleClose();
  };

  const showComingSoonToast = (featureName: string) => {
    showToast(`"${featureName}" is a premium feature, coming soon!`, { iconType: 'info' });
    handleClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && track && (
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden pointer-events-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm -z-10 cursor-pointer"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 340, mass: 0.8 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) {
                handleClose();
              }
            }}
            className="relative w-full max-w-lg bg-[#181818] sm:border border-white/5 rounded-t-3xl sm:rounded-3xl p-5 pb-8 sm:pb-5 text-white shadow-[0_-15px_50px_rgba(0,0,0,0.9)] max-h-[85vh] flex flex-col z-10 touch-pan-y select-none will-change-transform transform-gpu"
          >
            {/* Grabber handle bar */}
            <div className="w-12 h-1.5 bg-neutral-600 rounded-full mx-auto mb-5 cursor-grab active:cursor-grabbing flex-shrink-0" />

            {/* Header Track Info */}
            <div className="flex items-center gap-4 pb-4 border-b border-white/10 flex-shrink-0">
              <img
                src={track.images?.medium || track.images?.small || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'}
                alt={track.title}
                className="w-14 h-14 rounded object-cover flex-shrink-0 shadow-lg"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-[17px] truncate text-white leading-tight">{track.title}</h4>
                <p className="text-[14px] text-neutral-400 truncate mt-0.5">
                  {track.artist} {track.album && `• ${track.album}`}
                </p>
              </div>
            </div>

            {/* MAIN MENU */}
            {activeTab === 'main' && (
              <div className="py-2 space-y-0 overflow-y-auto max-h-[62vh] sm:max-h-[58vh] no-scrollbar pr-0.5 mt-1">
                
                <button onClick={handleToggleLike} className="w-full flex items-center gap-4 px-2 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors cursor-pointer group">
                  {isLiked ? (
                    <div className="w-6 h-6 flex-shrink-0 rounded flex items-center justify-center bg-emerald-500">
                      <Heart className="w-4 h-4 text-neutral-900 fill-neutral-900" strokeWidth={2} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 flex-shrink-0 rounded flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-400">
                      <Heart className="w-4 h-4 text-white fill-white" strokeWidth={2} />
                    </div>
                  )}
                  <span className="text-base font-medium text-neutral-100 group-hover:text-white">
                    {isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
                  </span>
                </button>
                
                <button onClick={() => setActiveTab('playlist')} className="w-full flex items-center gap-4 px-2 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors cursor-pointer group">
                  <PlusCircle className="w-6 h-6 flex-shrink-0 text-neutral-300 group-hover:text-white" strokeWidth={1.5} />
                  <span className="text-base font-medium text-neutral-100 group-hover:text-white">Add to playlist</span>
                </button>

                <button onClick={handleAddToQueue} className="w-full flex items-center gap-4 px-2 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors cursor-pointer group">
                  <ListPlus className="w-6 h-6 flex-shrink-0 text-neutral-300 group-hover:text-white" strokeWidth={1.5} />
                  <span className="text-base font-medium text-neutral-100 group-hover:text-white">Add to Queue</span>
                </button>

                <button onClick={handleGoToQueue} className="w-full flex items-center gap-4 px-2 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors cursor-pointer group">
                  <Menu className="w-6 h-6 flex-shrink-0 text-neutral-300 group-hover:text-white" strokeWidth={1.5} />
                  <span className="text-base font-medium text-neutral-100 group-hover:text-white">Go to Queue</span>
                </button>

                {track.album && (
                  <button onClick={handleGoToAlbum} className="w-full flex items-center gap-4 px-2 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors cursor-pointer group">
                    <Disc3 className="w-6 h-6 flex-shrink-0 text-neutral-300 group-hover:text-white" strokeWidth={1.5} />
                    <span className="text-base font-medium text-neutral-100 group-hover:text-white">Go to album</span>
                  </button>
                )}

                <button onClick={handleGoToArtist} className="w-full flex items-center gap-4 px-2 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors cursor-pointer group">
                  <User className="w-6 h-6 flex-shrink-0 text-neutral-300 group-hover:text-white" strokeWidth={1.5} />
                  <span className="text-base font-medium text-neutral-100 group-hover:text-white">Go to artists</span>
                </button>

                <button onClick={() => showComingSoonToast('Start a Jam')} className="w-full flex items-center justify-between px-2 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <Users className="w-6 h-6 flex-shrink-0 text-neutral-300 group-hover:text-white" strokeWidth={1.5} />
                    <span className="text-base font-medium text-neutral-100 group-hover:text-white">Start a Jam</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-500 fill-emerald-500">
                      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.745 3.805-.87 7.076-.496 9.714 1.114.293.18.386.56.208.855zm1.226-2.736c-.225.368-.705.483-1.072.257-2.686-1.65-6.785-2.13-9.965-1.166-.413.127-.854-.108-.98-.52-.126-.413.108-.854.52-.98 3.63-1.102 8.147-.568 11.24 1.335.367.226.482.704.257 1.074zm.106-2.852C14.73 9.006 8.54 8.775 4.977 9.862c-.494.15-.99-.126-1.14-.62-.15-.494.127-.99.62-1.14 4.07-1.244 10.87-1.002 14.62 1.22.443.262.59.84.327 1.282-.26.442-.838.59-1.28.332z" />
                    </svg>
                    <span className="text-xs font-bold text-emerald-500">Premium</span>
                  </div>
                </button>

                <button onClick={handleExcludeTaste} className="w-full flex items-center gap-4 px-2 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors cursor-pointer group">
                  <XCircle className="w-6 h-6 flex-shrink-0 text-neutral-300 group-hover:text-white" strokeWidth={1.5} />
                  <span className="text-base font-medium text-neutral-100 group-hover:text-white">Exclude track from your taste profile</span>
                </button>

                <button onClick={handleSongRadio} className="w-full flex items-center gap-4 px-2 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors cursor-pointer group">
                  <Radio className="w-6 h-6 flex-shrink-0 text-neutral-300 group-hover:text-white" strokeWidth={1.5} />
                  <span className="text-base font-medium text-neutral-100 group-hover:text-white">Go to song radio</span>
                </button>

                <button onClick={() => setActiveTab('credits')} className="w-full flex items-center gap-4 px-2 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors cursor-pointer group">
                  <FileMusic className="w-6 h-6 flex-shrink-0 text-neutral-300 group-hover:text-white" strokeWidth={1.5} />
                  <span className="text-base font-medium text-neutral-100 group-hover:text-white">View song credits</span>
                </button>

                <button onClick={() => setActiveTab('code')} className="w-full flex items-center gap-4 px-2 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors cursor-pointer group">
                  <AudioLines className="w-6 h-6 flex-shrink-0 text-neutral-300 group-hover:text-white" strokeWidth={1.5} />
                  <span className="text-base font-medium text-neutral-100 group-hover:text-white">Show Spotify Code</span>
                </button>

                {/* Offline, Share, Trash */}
                <button onClick={handleToggleDownload} disabled={isDownloading} className="w-full flex items-center gap-4 px-2 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed group">
                  <Download className={`w-6 h-6 flex-shrink-0 ${isDownloading ? 'text-emerald-400 animate-bounce' : isDownloaded ? 'text-emerald-500' : 'text-neutral-300 group-hover:text-white'}`} strokeWidth={1.5} />
                  <div className="flex-1 flex items-center justify-between">
                    <span className={`text-base font-medium ${isDownloaded || isDownloading ? 'text-emerald-500' : 'text-neutral-100 group-hover:text-white'}`}>
                      {isDownloading ? 'Caching Offline...' : isDownloaded ? 'Remove Download' : 'Download Offline'}
                    </span>
                    {isDownloading && (
                      <span className="text-xs font-mono text-emerald-400 font-bold">{downloadProgress}%</span>
                    )}
                  </div>
                </button>

                <button onClick={handleShare} className="w-full flex items-center gap-4 px-2 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors cursor-pointer group">
                  <Share2 className="w-6 h-6 flex-shrink-0 text-neutral-300 group-hover:text-white" strokeWidth={1.5} />
                  <span className="text-base font-medium text-neutral-100 group-hover:text-white">Share Track</span>
                </button>
                
                {onRemoveFromPlaylist && (
                  <button onClick={() => { onRemoveFromPlaylist(); handleClose(); }} className="w-full flex items-center gap-4 px-2 py-3 hover:bg-white/5 active:bg-white/10 transition-colors text-left text-neutral-200 hover:text-white group cursor-pointer">
                    <Trash2 className="w-6 h-6 flex-shrink-0 text-neutral-400 group-hover:text-white" strokeWidth={1.5} />
                    <span className="text-base font-medium">Remove from this playlist</span>
                  </button>
                )}

                {canRemoveFromHistory && (
                  <button onClick={handleRemoveFromHistory} className="w-full flex items-center gap-4 px-2 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors text-neutral-200 hover:text-white cursor-pointer group">
                    <Trash2 className="w-6 h-6 flex-shrink-0 text-neutral-400 group-hover:text-white" strokeWidth={1.5} />
                    <span className="text-base font-medium">Remove from recent history</span>
                  </button>
                )}
              </div>
            )}

            {/* PLAYLIST PICKER */}
            {activeTab === 'playlist' && (
              <div className="py-2 mt-2">
                <div className="flex items-center justify-between mb-4 px-2">
                  <span className="text-sm font-bold text-white">Select Playlist</span>
                  <button onClick={() => setActiveTab('main')} className="text-sm text-emerald-400 hover:underline font-semibold cursor-pointer">
                    Back
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1 no-scrollbar">
                  {playlists.length === 0 ? (
                    <div className="p-4 text-center text-sm text-neutral-400">
                      No playlists created yet. Create one from the library!
                    </div>
                  ) : (
                    playlists.map((pl) => {
                      const alreadyInPlaylist = pl.tracks.some((t) => t.id === track.id);
                      return (
                        <button key={pl.id} onClick={() => handleSelectPlaylist(pl.id)} className="w-full flex items-center justify-between px-2 py-3 hover:bg-white/5 active:bg-white/10 text-left transition-colors cursor-pointer rounded-lg">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-neutral-800 border border-white/10">
                              <PlaylistArtwork playlist={pl} className="w-full h-full object-cover" />
                            </div>
                            <span className="truncate font-semibold text-neutral-200 text-base">{pl.title}</span>
                          </div>
                          {alreadyInPlaylist && <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* CREDITS VIEW */}
            {activeTab === 'credits' && (
              <div className="py-2 mt-2">
                <div className="flex items-center justify-between mb-4 px-2">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">Song Credits</span>
                  <button onClick={() => setActiveTab('main')} className="text-sm text-emerald-400 hover:underline font-semibold cursor-pointer">
                    Back
                  </button>
                </div>
                <div className="px-2 space-y-5 mt-4 max-h-[50vh] overflow-y-auto no-scrollbar pb-6">
                  <div>
                    <h4 className="text-white font-bold text-lg">{track.title}</h4>
                    <p className="text-neutral-400 text-sm mt-1">Performed by {track.artist}</p>
                  </div>
                  {track.album && (
                    <div>
                      <h4 className="text-white font-bold text-base">Album</h4>
                      <p className="text-neutral-400 text-sm mt-1">{track.album}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-white font-bold text-base">Source</h4>
                    <p className="text-neutral-400 text-sm mt-1">{track.provider || 'Provided by Platform'}</p>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base">Audio Quality</h4>
                    <p className="text-neutral-400 text-sm mt-1">High (320kbps equivalent)</p>
                  </div>
                </div>
              </div>
            )}

            {/* SPOTIFY CODE VIEW */}
            {activeTab === 'code' && (
              <div className="py-2 mt-2 flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-2 px-2">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">Spotify Code</span>
                  <button onClick={() => setActiveTab('main')} className="text-sm text-emerald-400 hover:underline font-semibold cursor-pointer">
                    Back
                  </button>
                </div>
                <div className="bg-emerald-500 p-8 rounded-xl flex flex-col items-center justify-center gap-6 w-full max-w-[280px] aspect-square shadow-2xl mt-4 border-2 border-emerald-400">
                  <img src={track.images?.medium || track.images?.small} className="w-32 h-32 shadow-lg rounded object-cover" alt="Artwork" />
                  <div className="flex items-center justify-center gap-1.5 w-full">
                    <div className="w-4 h-4 bg-black rounded-full" />
                    {[3, 8, 4, 10, 6, 12, 5, 9, 3, 7].map((h, i) => (
                      <div key={i} className="w-1.5 bg-black rounded-full" style={{ height: `${h * 2.5}px` }} />
                    ))}
                    <div className="w-4 h-4 bg-black rounded-full" />
                  </div>
                </div>
                <p className="text-center text-neutral-400 text-sm mt-6">Scan this code to share the track.</p>
              </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
INNER_EOF
