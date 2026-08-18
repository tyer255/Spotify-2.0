import React, { useState } from 'react';
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
  X,
  Check,
  Plus
} from 'lucide-react';

interface ContextMenuProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: ViewState) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ track, isOpen, onClose, onNavigate }) => {
  const { addToQueue } = usePlayer();
  const {
    isTrackLiked,
    toggleLikeTrack,
    isTrackDownloaded,
    toggleDownloadTrack,
    isDownloadingTrack,
    getTrackDownloadProgress,
    playlists,
    addTrackToPlaylist,
    showToast,
  } = useUser();
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);

  if (!track || !isOpen) return null;

  const isLiked = isTrackLiked(track.id);
  const isDownloaded = isTrackDownloaded(track.id);
  const isDownloading = isDownloadingTrack(track.id);
  const downloadProgress = getTrackDownloadProgress(track.id);

  const handleAddToQueue = () => {
    addToQueue(track);
    showToast(`Added "${track.title}" to Queue`);
    onClose();
  };

  const handleToggleLike = async () => {
    await toggleLikeTrack(track);
    onClose();
  };

  const handleToggleDownload = async () => {
    if (isDownloading) return;
    await toggleDownloadTrack(track);
    onClose();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/#track=${track.id}`);
      showToast(`Link copied to clipboard!`);
    } else {
      showToast(`Track: ${track.title} by ${track.artist}`);
    }
    onClose();
  };

  const handleGoToArtist = () => {
    if (onNavigate) {
      onNavigate({ type: 'artist', artistId: track.artistId });
    }
    onClose();
  };

  const handleGoToAlbum = () => {
    if (onNavigate) {
      onNavigate({ type: 'album', albumId: track.albumId });
    }
    onClose();
  };

  const handleSelectPlaylist = async (playlistId: string) => {
    await addTrackToPlaylist(playlistId, track);
    setShowPlaylistPicker(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-neutral-900 dark:bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-2xl p-5 text-white shadow-2xl overflow-hidden"
        >
          {/* Header Track Info */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={track.images?.small || track.images?.medium || track.images?.large || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'}
                alt={track.title}
                className="w-12 h-12 rounded-lg object-cover shadow-md flex-shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate text-white">{track.title}</h4>
                <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Options or Playlist Submenu */}
          {!showPlaylistPicker ? (
            <div className="py-2 space-y-1">
              <button
                onClick={handleToggleLike}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neutral-800/70 text-left text-sm transition-colors text-neutral-200 hover:text-white"
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-neutral-400'}`} />
                <span>{isLiked ? 'Remove from Liked Songs' : 'Save to your Liked Songs'}</span>
              </button>

              <button
                onClick={handleAddToQueue}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neutral-800/70 text-left text-sm transition-colors text-neutral-200 hover:text-white"
              >
                <ListPlus className="w-5 h-5 text-neutral-400" />
                <span>Add to Queue</span>
              </button>

              <button
                onClick={() => setShowPlaylistPicker(true)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neutral-800/70 text-left text-sm transition-colors text-neutral-200 hover:text-white"
              >
                <Plus className="w-5 h-5 text-neutral-400" />
                <span>Add to Playlist</span>
              </button>

              <button
                onClick={handleToggleDownload}
                disabled={isDownloading}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neutral-800/70 text-left text-sm transition-colors text-neutral-200 hover:text-white disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"
              >
                <Download className={`w-5 h-5 ${isDownloading ? 'text-emerald-400 animate-bounce' : isDownloaded ? 'text-emerald-500' : 'text-neutral-400'}`} />
                <div className="flex-1 flex items-center justify-between">
                  <span>{isDownloading ? 'Caching Offline...' : isDownloaded ? 'Remove Download' : 'Download Offline'}</span>
                  {isDownloading && (
                    <span className="text-xs font-mono text-emerald-400 font-bold">{downloadProgress}%</span>
                  )}
                </div>
              </button>

              <button
                onClick={handleGoToArtist}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neutral-800/70 text-left text-sm transition-colors text-neutral-200 hover:text-white"
              >
                <User className="w-5 h-5 text-neutral-400" />
                <span>Go to Artist ({track.artist})</span>
              </button>

              <button
                onClick={handleGoToAlbum}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neutral-800/70 text-left text-sm transition-colors text-neutral-200 hover:text-white"
              >
                <Disc3 className="w-5 h-5 text-neutral-400" />
                <span>Go to Album ({track.album})</span>
              </button>

              <button
                onClick={handleShare}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-neutral-800/70 text-left text-sm transition-colors text-neutral-200 hover:text-white"
              >
                <Share2 className="w-5 h-5 text-neutral-400" />
                <span>Share Track</span>
              </button>
            </div>
          ) : (
            <div className="py-3">
              <div className="flex items-center justify-between mb-3 px-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Select Playlist</span>
                <button
                  onClick={() => setShowPlaylistPicker(false)}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Back
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                {playlists.map((pl) => {
                  const alreadyInPlaylist = pl.tracks.some((t) => t.id === track.id);
                  return (
                    <button
                      key={pl.id}
                      onClick={() => handleSelectPlaylist(pl.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-neutral-800 text-left text-sm transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded overflow-hidden flex-shrink-0 bg-neutral-850">
                          <PlaylistArtwork playlist={pl} className="w-full h-full" />
                        </div>
                        <span className="truncate font-medium text-neutral-200">{pl.title}</span>
                      </div>
                      {alreadyInPlaylist && <Check className="w-4 h-4 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
