import React from 'react';
import { Track, ViewState } from '../../types';
import { usePlayer } from '../../context/PlayerContext';
import { useUser } from '../../context/UserContext';
import { Play, Radio } from 'lucide-react';
import { SpotifyLogo } from './SpotifyLogo';
import { ArtistAvatar } from './ArtistAvatar';

export interface StationData {
  id: string;
  title: string;
  supportingText: string;
  themeColor: string;
  accentColor?: string;
  artists: {
    name: string;
    image: string;
  }[];
  tracks?: Track[];
}

interface StationCardProps {
  station: StationData;
  onNavigate?: (view: ViewState) => void;
}

export const StationCard: React.FC<StationCardProps> = ({ station, onNavigate }) => {
  const { showComingSoon } = useUser();

  const handlePlayStation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigate) {
      onNavigate({ type: 'radio-station', stationId: station.id, stationTitle: station.title });
    }
  };

  const handleClick = () => {
    if (onNavigate) {
      onNavigate({ type: 'radio-station', stationId: station.id, stationTitle: station.title });
    }
  };

  const artist0 = station.artists[0];
  const artist1 = station.artists[1] || artist0;
  const artist2 = station.artists[2] || artist0;

  const useArtistImage = (artistName: string, initialImage: string) => {
    const [imgSrc, setImgSrc] = React.useState(initialImage || '');

    React.useEffect(() => {
      // If initial image is already a valid URL, preserve it
      if (initialImage && !initialImage.includes('d41d8cd98f00b204e9800998ecf8427e') && !initialImage.includes('placeholder')) {
        setImgSrc(initialImage);
        return;
      }
      if (artistName) {
        fetch(`/api/spotify/thumbnail?query=${encodeURIComponent(artistName)}&type=artist`)
          .then(res => res.json())
          .then(data => {
            if (data?.data?.thumbnailUrl) {
              setImgSrc(data.data.thumbnailUrl);
            }
          })
          .catch(() => {});
      }
    }, [artistName, initialImage]);

    return imgSrc || initialImage;
  };

  const img0 = useArtistImage(artist0.name, artist0.image);
  const img1 = useArtistImage(artist1.name, artist1.image);
  const img2 = useArtistImage(artist2.name, artist2.image);

  return (
    <div
      onClick={handleClick}
      className="group relative flex-shrink-0 w-44 sm:w-52 cursor-pointer flex flex-col select-none"
    >
      {/* Station Poster Card */}
      <div
        className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-lg p-3.5 flex flex-col justify-between transition-all duration-300 group-hover:scale-[1.02] border border-white/10"
        style={{
          background: `linear-gradient(145deg, ${station.themeColor} 0%, #121212 100%)`,
        }}
      >
        {/* Subtle glass reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/10 pointer-events-none" />

        {/* Top Header: Spotiz Logo + RADIO Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 opacity-90">
            <SpotifyLogo size={16} variant="monochrome" />
            <span className="text-[10px] font-black tracking-widest text-black/80 uppercase px-1 py-0.5 rounded bg-white/70">
              RADIO
            </span>
          </div>
        </div>

        {/* Center: Spotiz 3-Artist Circle Composition */}
        <div className="relative z-10 flex items-center justify-center my-auto py-1">
          {/* Left Supporting Artist */}
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-black/30 shadow-md -mr-4.5 z-0 opacity-85 transform -translate-y-1">
            <ArtistAvatar
              name={artist1?.name || 'Artist'}
              image={img1}
              sizeClassName="w-full h-full"
            />
          </div>

          {/* Center Main Artist (Larger) */}
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl z-10 bg-neutral-900">
            <ArtistAvatar
              name={artist0?.name || station.title}
              image={img0}
              sizeClassName="w-full h-full"
              showHoverEffect={true}
            />
          </div>

          {/* Right Supporting Artist */}
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-black/30 shadow-md -ml-4.5 z-0 opacity-85 transform -translate-y-1">
            <ArtistAvatar
              name={artist2?.name || 'Artist'}
              image={img2}
              sizeClassName="w-full h-full"
            />
          </div>
        </div>

        {/* Bottom Station Title inside Card */}
        <div className="relative z-10 mt-auto">
          <h3 className="font-extrabold text-lg sm:text-xl text-white tracking-tight truncate drop-shadow-md">
            {station.title}
          </h3>
        </div>

        {/* Hover / Active Floating Green Play Button */}
        <button
          onClick={handlePlayStation}
          className="absolute right-3 bottom-3 z-20 w-10 h-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
          title={`Play ${station.title} Radio`}
        >
          <Play className="w-5 h-5 fill-black ml-0.5" />
        </button>
      </div>

      {/* Supporting artist information below card (matches Spotiz layout) */}
      <div className="mt-2 px-1">
        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed font-normal">
          {station.supportingText}
        </p>
      </div>
    </div>
  );
};
