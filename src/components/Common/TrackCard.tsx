import React, { useState } from 'react';
import { Track, ViewState } from '../../types';
import { usePlayer } from '../../context/PlayerContext';
import { useUser } from '../../context/UserContext';
import { Play, Pause, MoreVertical, Heart, ArrowDownCircle, Download } from 'lucide-react';
import { ContextMenu } from './ContextMenu';

interface TrackCardProps {
  track: Track;
  queueContext?: Track[];
  onNavigate?: (view: ViewState) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, queueContext, onNavigate }) => {
  const { track: currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isTrackLiked, toggleLikeTrack, isTrackDownloaded, getTrackDownloadProgress } = useUser();
  const [showMenu, setShowMenu] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isLiked = isTrackLiked(track.id);
  const isDownloaded = isTrackDownloaded(track.id);
  const downloadProgress = getTrackDownloadProgress(track.id);
  const isDownloading = downloadProgress !== undefined;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, queueContext || [track]);
    }
  };

  return (
    <>
      <div
        onClick={() => playTrack(track, queueContext || [track])}
        className="group relative flex-shrink-0 w-40 sm:w-44 p-3 rounded-2xl liquid-glass-card transition-all duration-300 cursor-pointer flex flex-col"
      >
        {/* Cover Artwork */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-neutral-800 shadow-md">
          <img
            src={
              track.images?.large ||
              track.images?.medium ||
              track.images?.small ||
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80'
            }
            alt={track.title}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80';
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Downloaded Offline Badge */}
          {isDownloaded && !isDownloading && (
            <div
              title="Available offline"
              className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-emerald-500/30 flex items-center gap-1 text-[10px] font-semibold text-emerald-400 shadow-md"
            >
              <ArrowDownCircle className="w-3 h-3 fill-emerald-500/20 text-emerald-400" />
              <span>Offline</span>
            </div>
          )}

          {/* Active Download Overlay on Artwork */}
          {isDownloading && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center">
              <Download className="w-6 h-6 text-emerald-400 animate-bounce mb-1" />
              <span className="text-[11px] font-bold text-white mb-1.5">Downloading</span>
              <div className="w-full h-1.5 bg-neutral-700 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-200"
                  style={{ width: `${Math.max(5, downloadProgress || 0)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold mt-1">
                {downloadProgress}%
              </span>
            </div>
          )}

          {/* Glowing Play Button on Hover / Playing */}
          {!isDownloading && (
            <button
              onClick={handlePlayClick}
              className={`absolute right-2.5 bottom-2.5 w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 ${
                isCurrent && isPlaying
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
              }`}
            >
              {isCurrent && isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </button>
          )}
        </div>

        {/* Title & Artist */}
        <div className="min-w-0 flex-1 flex flex-col justify-between">
          <div>
            <h4
              className={`font-semibold text-sm truncate ${
                isCurrent ? 'text-emerald-400' : 'text-neutral-100'
              }`}
            >
              {track.title}
            </h4>
            <p
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigate) onNavigate({ type: 'artist', artistId: track.artistId });
              }}
              className="text-xs text-neutral-400 truncate hover:text-white hover:underline mt-0.5"
            >
              {track.artist}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLikeTrack(track);
              }}
              className="p-1 text-neutral-400 hover:text-white transition-colors"
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(true);
              }}
              className="p-1 text-neutral-400 hover:text-white transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ContextMenu
        track={track}
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onNavigate={onNavigate}
      />
    </>
  );
};
