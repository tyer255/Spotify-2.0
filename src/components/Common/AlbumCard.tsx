import React from 'react';
import { Album, ViewState } from '../../types';
import { Play, Disc3 } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useUser } from '../../context/UserContext';

interface AlbumCardProps {
  album: Album;
  onNavigate?: (view: ViewState) => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, onNavigate }) => {
  const { playTrack } = usePlayer();
  const { isTrackHidden } = useUser();

  const handleClick = () => {
    if (onNavigate) {
      onNavigate({ type: 'album', albumId: album.id });
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const visibleTracks = album.tracks ? album.tracks.filter(t => !isTrackHidden(t.id)) : [];
    if (visibleTracks.length > 0) {
      playTrack(visibleTracks[0], visibleTracks);
    } else {
      handleClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex-shrink-0 w-[140px] xs:w-[150px] sm:w-[176px] p-3 rounded-2xl liquid-glass-card transition-all duration-300 cursor-pointer flex flex-col"
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-neutral-800 shadow-md flex items-center justify-center">
        {album.images?.large || album.images?.medium || album.images?.small || (album as any).coverImage || (album as any).coverImage ? (
          <img
            src={
              album.images?.large ||
              album.images?.medium ||
              album.images?.small || (album as any).coverImage
            }
            alt={album.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = 'none';
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Disc3 className="w-12 h-12 text-neutral-600" />
        )}

        <button
          onClick={handlePlay}
          className="absolute right-2.5 bottom-2.5 w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110 active:scale-95 transition-all duration-200"
        >
          <Play className="w-5 h-5 fill-black ml-0.5" />
        </button>
      </div>

      <div className="min-w-0">
        <h4 className="font-semibold text-sm truncate text-neutral-100 group-hover:text-white">
          {album.name}
        </h4>
        <p className="text-xs text-neutral-400 truncate mt-0.5">
          {album.year} • {album.artist}
        </p>
      </div>
    </div>
  );
};
