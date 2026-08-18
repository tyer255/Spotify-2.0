import React, { useState } from 'react';
import { Track, ViewState } from '../../types';
import { usePlayer } from '../../context/PlayerContext';
import { useUser } from '../../context/UserContext';
import { Play, Pause, Heart, MoreHorizontal, ArrowDownCircle, CheckCircle2, Download } from 'lucide-react';
import { ContextMenu } from './ContextMenu';

interface TrackRowProps {
  track: Track;
  index: number;
  queueContext?: Track[];
  showAlbum?: boolean;
  showCover?: boolean;
  onNavigate?: (view: ViewState) => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  queueContext,
  showAlbum = true,
  showCover = true,
  onNavigate,
}) => {
  const { track: currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isTrackLiked, toggleLikeTrack, isTrackDownloaded, getTrackDownloadProgress } = useUser();
  const [showMenu, setShowMenu] = useState(false);

  const isCurrent = currentTrack?.id === track.id;
  const isLiked = isTrackLiked(track.id);
  const isDownloaded = isTrackDownloaded(track.id);
  const downloadProgress = getTrackDownloadProgress(track.id);
  const isDownloading = downloadProgress !== undefined;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, queueContext || [track]);
    }
  };

  return (
    <>
      <div
        onClick={handleRowClick}
        className={`group relative flex flex-col px-3 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer ${
          isCurrent ? 'bg-white/10' : ''
        }`}
      >
        <div className="flex items-center justify-between min-w-0 w-full">
          {/* Left: Index / Play Icon & Track Details */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Index or Animated Sound Waves */}
            <div className="w-6 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-neutral-400">
              {isCurrent && isPlaying ? (
                <div className="flex items-end gap-0.5 h-3.5">
                  <span className="w-0.5 bg-emerald-500 rounded-full h-full animate-pulse" />
                  <span className="w-0.5 bg-emerald-500 rounded-full h-2 animate-pulse delay-75" />
                  <span className="w-0.5 bg-emerald-500 rounded-full h-3 animate-pulse delay-150" />
                </div>
              ) : (
                <>
                  <span className="group-hover:hidden">{index + 1}</span>
                  <Play className="w-3.5 h-3.5 fill-white text-white hidden group-hover:block ml-0.5" />
                </>
              )}
            </div>

            {/* Cover thumbnail */}
            {showCover && (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow bg-neutral-800">
                <img
                  src={
                    track.images?.small ||
                    track.images?.medium ||
                    track.images?.large ||
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'
                  }
                  alt={track.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80';
                  }}
                  className="w-full h-full object-cover"
                />
                {isDownloading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Download className="w-4 h-4 text-emerald-400 animate-bounce" />
                  </div>
                )}
              </div>
            )}

            {/* Title & Artist */}
            <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h4
                  className={`text-sm font-medium truncate ${
                    isCurrent ? 'text-emerald-400' : 'text-neutral-100 group-hover:text-white'
                  }`}
                >
                  {track.title}
                </h4>
                {isDownloaded && !isDownloading && (
                  <span title="Downloaded for offline playback" className="flex-shrink-0">
                    <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-500/20" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 truncate">
                {track.explicit && (
                  <span className="px-1 py-0.2 bg-neutral-700 text-[10px] rounded font-semibold text-neutral-300">
                    E
                  </span>
                )}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigate) onNavigate({ type: 'artist', artistId: track.artistId });
                  }}
                  className="hover:text-white hover:underline truncate"
                >
                  {track.artist}
                </span>
                {isDownloading && (
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 ml-1 animate-pulse">
                    <span>Downloading</span>
                    <span>{downloadProgress}%</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Middle: Album Name (Desktop) */}
          {showAlbum && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigate) onNavigate({ type: 'album', albumId: track.albumId });
              }}
              className="hidden md:block w-1/3 text-xs text-neutral-400 truncate hover:text-white hover:underline px-4"
            >
              {track.album}
            </div>
          )}

          {/* Right: Actions & Duration */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLikeTrack(track);
              }}
              className={`p-1.5 transition-colors ${
                isLiked
                  ? 'text-red-500'
                  : 'text-neutral-400 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
            </button>

            <span className="text-xs text-neutral-400 font-mono w-10 text-right">
              {formatDuration(track.duration)}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(true);
              }}
              className="p-1.5 text-neutral-400 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:text-white transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Visual Download Progress Bar */}
        {isDownloading && (
          <div className="w-full mt-2 pt-1">
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

      <ContextMenu
        track={track}
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onNavigate={onNavigate}
      />
    </>
  );
};
