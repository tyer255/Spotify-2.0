import React, { useState } from 'react';
import { Track, ViewState } from '../../types';
import { usePlayer } from '../../context/PlayerContext';
import { useUser } from '../../context/UserContext';
import { Play, Pause, MoreVertical, Heart, ArrowDownCircle, Download, Trash2 } from 'lucide-react';
import { ContextMenu } from './ContextMenu';

interface TrackCardProps {
  track: Track;
  queueContext?: Track[];
  onNavigate?: (view: ViewState) => void;
  contentType?: string;
  subtitle?: string;
  hideFooter?: boolean;
  onDeleteFromHistory?: () => void;
  showDeleteFromHistory?: boolean;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  queueContext,
  onNavigate,
  contentType,
  subtitle,
  hideFooter = false,
  onDeleteFromHistory,
  showDeleteFromHistory,
}) => {
  const { track: currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { isTrackLiked, toggleLikeTrack, isTrackDownloaded, getTrackDownloadProgress } = useUser();
  const [showMenu, setShowMenu] = useState(false);

  const rawImage = track.images?.large || track.images?.medium || track.images?.small || '';
  const [artworkSrc, setArtworkSrc] = useState<string>(rawImage || 'https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96');

  React.useEffect(() => {
    if (!rawImage || rawImage.includes('placeholder') || rawImage.includes('d41d8cd98f00b204e9800998ecf8427e')) {
      fetch(`/api/spotify/thumbnail?query=${encodeURIComponent(`${track.title} ${track.artist}`)}&type=track`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data?.thumbnailUrl) {
            setArtworkSrc(data.data.thumbnailUrl);
          }
        })
        .catch(() => {});
    } else {
      setArtworkSrc(rawImage);
    }
  }, [rawImage, track.title, track.artist]);

  const handleImageError = () => {
    fetch(`/api/spotify/thumbnail?query=${encodeURIComponent(`${track.title} ${track.artist}`)}&type=track`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.thumbnailUrl) {
          setArtworkSrc(data.data.thumbnailUrl);
        } else {
          setArtworkSrc('https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96');
        }
      })
      .catch(() => {
        setArtworkSrc('https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96');
      });
  };

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
            src={artworkSrc || undefined}
            alt={track.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={handleImageError}
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
            {contentType && (
              <p className="text-[11px] text-neutral-400 font-medium tracking-wide mb-0.5">
                {contentType}
              </p>
            )}
            <h4
              className={`font-semibold text-sm truncate ${
                isCurrent ? 'text-emerald-400' : 'text-neutral-100 group-hover:text-white'
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
              {subtitle || track.artist}
            </p>
          </div>

          {!hideFooter && (
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLikeTrack(track);
                  }}
                  className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={isLiked ? "Unlike" : "Like"}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} />
                </button>
                {(showDeleteFromHistory || onDeleteFromHistory) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDeleteFromHistory) onDeleteFromHistory();
                    }}
                    className="p-1 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Remove from history"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(true);
                }}
                className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="More"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <ContextMenu
        track={track}
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onNavigate={onNavigate}
        onDeleteFromHistory={onDeleteFromHistory}
        showRemoveFromHistory={showDeleteFromHistory}
      />
    </>
  );
};
