import React from 'react';
import { Artist, ViewState } from '../../types';
import { useUser } from '../../context/UserContext';
import { Check, Plus } from 'lucide-react';
import { ArtistAvatar } from './ArtistAvatar';

interface ArtistCardProps {
  artist: Artist;
  onNavigate?: (view: ViewState) => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onNavigate }) => {
  const { isArtistFollowed, toggleFollowArtist } = useUser();
  const isFollowed = isArtistFollowed(artist.id) || isArtistFollowed(artist.name);

  const handleClick = () => {
    if (onNavigate) {
      onNavigate({ 
        type: 'artist', 
        artistId: artist.id,
        expectedName: artist.name,
        initialImage: artist.image 
      });
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex-shrink-0 w-36 sm:w-40 p-3 rounded-2xl liquid-glass-card transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
    >
      <div className="relative aspect-square w-28 sm:w-32 rounded-full overflow-hidden mb-3 shadow-lg bg-neutral-800 flex items-center justify-center">
        <ArtistAvatar
          id={artist.id}
          name={artist.name}
          image={artist.image}
          sizeClassName="w-full h-full"
          showHoverEffect={true}
        />
      </div>

      <h4 className="font-semibold text-sm truncate w-full text-neutral-100 group-hover:text-white">
        {artist.name}
      </h4>
      <p className="text-xs text-neutral-400 capitalize mt-0.5">Artist</p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFollowArtist(artist);
        }}
        className={`mt-2 px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 transition-all ${
          isFollowed
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'border-white/20 text-neutral-300 hover:border-white hover:text-white'
        }`}
      >
        {isFollowed ? (
          <>
            <Check className="w-3 h-3" />
            <span>Following</span>
          </>
        ) : (
          <>
            <Plus className="w-3 h-3" />
            <span>Follow</span>
          </>
        )}
      </button>
    </div>
  );
};


