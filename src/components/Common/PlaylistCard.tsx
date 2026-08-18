import React from 'react';
import { Playlist, ViewState } from '../../types';
import { Play } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { PlaylistArtwork } from './PlaylistArtwork';

interface PlaylistCardProps {
  playlist: Playlist;
  onNavigate?: (view: ViewState) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onNavigate }) => {
  const { playTrack } = usePlayer();

  const handleClick = () => {
    if (onNavigate) {
      onNavigate({ type: 'playlist', playlistId: playlist.id });
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.tracks && playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
    } else {
      handleClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex-shrink-0 w-40 sm:w-44 p-3 rounded-2xl liquid-glass-card transition-all duration-300 cursor-pointer flex flex-col"
    >
      <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-neutral-800 shadow-md">
        <PlaylistArtwork
          playlist={playlist}
          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
        />

        <button
          onClick={handlePlay}
          className="absolute right-2.5 bottom-2.5 w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110 active:scale-95 transition-all duration-200 z-10"
        >
          <Play className="w-5 h-5 fill-black ml-0.5" />
        </button>
      </div>

      <div className="min-w-0">
        <h4 className="font-semibold text-sm truncate text-neutral-100 group-hover:text-white">
          {playlist.title}
        </h4>
        <p className="text-xs text-neutral-400 line-clamp-2 mt-0.5 leading-relaxed">
          {playlist.description || `${playlist.tracks?.length || 0} tracks`}
        </p>
      </div>
    </div>
  );
};
