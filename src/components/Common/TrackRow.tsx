import React, { useState } from 'react';
import { Track, ViewState } from '../../types';
import { usePlayer } from '../../context/PlayerContext';
import { useUser } from '../../context/UserContext';
import { Play, Pause, Heart, MoreVertical, ArrowDownCircle, CheckCircle2, Download, Music } from 'lucide-react';
import { ContextMenu } from './ContextMenu';

export interface TrackRowProps {
  track: Track;
  index: number;
  queueContext?: Track[];
  showAlbum?: boolean;
  showCover?: boolean;
  onNavigate?: (view: ViewState) => void;
  variant?: 'standard' | 'artist-popular';
  onRemoveFromPlaylist?: () => void;
  influenceBadge?: React.ReactNode;
  allowHidden?: boolean;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  queueContext,
  showAlbum = true,
  showCover = true,
  onNavigate,
  variant = 'standard',
  onRemoveFromPlaylist,
  influenceBadge,
  allowHidden = false,
}) => {
  const { track: currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isTrackLiked, toggleLikeTrack, isTrackDownloaded, getTrackDownloadProgress, isTrackHidden } = useUser();
  const [showMenu, setShowMenu] = useState(false);

  const isHidden = isTrackHidden(track.id);
  const isCurrent = currentTrack?.id === track.id;
  const isLiked = isTrackLiked(track.id);
  const isDownloaded = isTrackDownloaded(track.id);
  const downloadProgress = getTrackDownloadProgress(track.id);
  const isDownloading = downloadProgress !== undefined;

  if (isHidden && !allowHidden) {
    return showMenu ? (
      <ContextMenu
        track={track}
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onNavigate={onNavigate}
        onRemoveFromPlaylist={onRemoveFromPlaylist}
      />
    ) : null;
  }

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getPlayCount = () => {
    if (track.play_count) return track.play_count.toLocaleString();
    if (track.plays) return track.plays.toLocaleString();
    
    let hash = 0;
    for (let i = 0; i < track.id.length; i++) {
      hash = (hash << 5) - hash + track.id.charCodeAt(i);
      hash = hash & hash;
    }
    const plays = Math.abs(hash) % 800000000 + 10000000;
    return plays.toLocaleString();
  };

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, queueContext || [track]);
    }
  };

  const gridClass = showAlbum
    ? 'grid-cols-[minmax(0,1fr)_40px] sm:grid-cols-[minmax(0,6fr)_minmax(0,4fr)_84px_40px]'
    : 'grid-cols-[minmax(0,1fr)_40px] sm:grid-cols-[minmax(0,1fr)_84px_40px]';

  return (
    <>
      <div
        onClick={handleRowClick}
        className={`group relative grid ${gridClass} items-center gap-4 px-3 py-1.5 hover:bg-white/5 transition-colors cursor-pointer ${
          isCurrent ? 'bg-white/10' : ''
        }`}
      >
        {/* Column 1: Thumbnail + Title & Artist (Flexible) */}
        <div className="flex items-center gap-3 min-w-0 pr-2">
          {/* Cover thumbnail */}
          {showCover && (
            <div className="relative w-11 h-11 sm:w-10 sm:h-10 rounded-sm overflow-hidden flex-shrink-0 bg-neutral-800 flex items-center justify-center">
              {track.images?.small || track.images?.medium || track.images?.large ? (
                <img
                  src={
                    track.images?.small ||
                    track.images?.medium ||
                    track.images?.large
                  }
                  alt={track.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = 'none';
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-4 h-4 text-neutral-500" />
              )}
              {isDownloading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Download className="w-4 h-4 text-emerald-400 animate-bounce" />
                </div>
              )}
            </div>
          )}

          {/* Title & Artist */}
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-1.5 min-w-0">
              <h4
                className={`text-[15px] sm:text-sm truncate block ${
                  isCurrent ? 'text-[#1ed760] font-semibold' : 'text-white font-medium group-hover:text-white'
                }`}
                title={track.title}
              >
                {track.title}
              </h4>
            </div>
            <div className="flex items-center gap-1.5 text-[13px] sm:text-xs text-neutral-400 mt-0.5 min-w-0">
              {isDownloaded && !isDownloading && (
                <span title="Downloaded for offline playback" className="flex-shrink-0">
                  <ArrowDownCircle className="w-3 h-3 text-[#1ed760] fill-[#1ed760]/20" />
                </span>
              )}
              {track.explicit && (
                <span className="px-1 py-[1px] bg-neutral-500/30 text-[9px] rounded-sm font-semibold text-neutral-300 flex-shrink-0">
                  E
                </span>
              )}
              {variant === 'artist-popular' ? (
                <span className="truncate block">{getPlayCount()}</span>
              ) : (
                <span className="truncate block">
                  {track.artist.split(/,\s*|\s*&\s*|\s*\|\s*/).map((artistName, i, arr) => {
                    const cleanName = artistName.trim();
                    const resolvedId = (arr.length === 1 && track.artistId) 
                      ? track.artistId 
                      : `artist-${encodeURIComponent(cleanName)}`;
                    return (
                      <React.Fragment key={i}>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigate) {
                              onNavigate({ 
                                type: 'artist', 
                                artistId: resolvedId, 
                                expectedName: cleanName 
                              });
                            }
                          }}
                          className="hover:text-white hover:underline cursor-pointer"
                        >
                          {cleanName}
                        </span>
                        {i < arr.length - 1 && <span className="text-neutral-500">, </span>}
                      </React.Fragment>
                    );
                  })}
                </span>
              )}
              {influenceBadge && (
                <span className="flex-shrink-0 ml-1">
                  {influenceBadge}
                </span>
              )}
              {isDownloading && (
                <span className="text-[11px] text-[#1ed760] font-semibold flex items-center gap-1 ml-1 animate-pulse flex-shrink-0">
                  <span>Downloading {downloadProgress}%</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Album Name (Starts at exact fixed horizontal position) */}
        {showAlbum && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onNavigate && track.albumId) onNavigate({ type: 'album', albumId: track.albumId });
            }}
            className="hidden sm:block text-[13px] text-neutral-400 truncate hover:text-white hover:underline cursor-pointer select-none pr-4"
            title={track.album}
          >
            {track.album}
          </div>
        )}

        {/* Column 3: Duration & Like (Fixed 84px column, right-aligned) */}
        <div className="hidden sm:flex items-center justify-end gap-2 w-full select-none">
          {(isLiked || variant === 'standard') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLikeTrack(track);
              }}
              title={isLiked ? "Unlike" : "Like"}
              className={`p-1.5 transition-colors cursor-pointer rounded-full ${
                isLiked
                  ? 'text-[#1ed760] opacity-100'
                  : 'text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 transition-transform ${isLiked ? 'text-[#1ed760] fill-[#1ed760] scale-105' : ''}`} />
            </button>
          )}

          {variant !== 'artist-popular' && (
            <span className="text-[13px] text-neutral-400 font-mono tabular-nums text-right w-10 flex-shrink-0">
              {formatDuration(track.duration)}
            </span>
          )}
        </div>

        {/* Column 4: Three-dot Action Menu (Fixed 40px column) */}
        <div className="flex items-center justify-end w-full">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(true);
            }}
            title="More options"
            className="p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-white/10 flex items-center justify-center"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <ContextMenu
        track={track}
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onNavigate={onNavigate}
        onRemoveFromPlaylist={onRemoveFromPlaylist}
      />
    </>
  );
};
