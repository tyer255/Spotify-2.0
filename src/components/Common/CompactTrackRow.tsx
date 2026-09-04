import React, { useState } from 'react';
import { Track, ViewState } from '../../types';
import { usePlayer } from '../../context/PlayerContext';
import { useUser } from '../../context/UserContext';
import { MoreVertical, Play, Pause, Trash2 } from 'lucide-react';
import { ContextMenu } from './ContextMenu';

interface CompactTrackRowProps {
  track: Track;
  queueContext?: Track[];
  onNavigate?: (view: ViewState) => void;
  onDelete?: () => void;
  onDeleteFromHistory?: () => void;
  showDelete?: boolean;
}

export const CompactTrackRow: React.FC<CompactTrackRowProps> = ({
  track,
  queueContext,
  onNavigate,
  onDelete,
  onDeleteFromHistory,
  showDelete,
}) => {
  const { track: currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const [showMenu, setShowMenu] = useState(false);

  const rawImage = track.images?.small || track.images?.medium || track.images?.large || '';
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

  const handleClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, queueContext || [track]);
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(true);
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`group flex items-center justify-between p-2 rounded-xl transition-all duration-200 cursor-pointer select-none ${
          isCurrent
            ? 'bg-white/10 shadow-sm'
            : 'hover:bg-white/5 active:bg-white/10'
        }`}
      >
        {/* Left: Thumbnail and Track Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800 shadow-md">
            <img
              src={artworkSrc || undefined}
              alt={track.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isCurrent && isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="flex items-end gap-[2px] h-3.5">
                  <span className="w-0.5 bg-emerald-400 rounded-full h-full animate-pulse" />
                  <span className="w-0.5 bg-emerald-400 rounded-full h-2 animate-pulse delay-75" />
                  <span className="w-0.5 bg-emerald-400 rounded-full h-3 animate-pulse delay-150" />
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className={`font-semibold text-sm sm:text-base truncate transition-colors ${
                isCurrent ? 'text-emerald-400' : 'text-neutral-100 group-hover:text-white'
              }`}
            >
              {track.title}
            </h4>
            <p className="text-xs text-neutral-400 truncate mt-0.5 font-normal">
              {track.artist}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {(showDelete || onDelete || onDeleteFromHistory) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete();
                else if (onDeleteFromHistory) onDeleteFromHistory();
              }}
              className="p-2 text-neutral-400 hover:text-red-400 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleMenuClick}
            className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="More options"
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
        onDeleteFromHistory={onDeleteFromHistory || onDelete}
        showRemoveFromHistory={showDelete}
      />
    </>
  );
};
