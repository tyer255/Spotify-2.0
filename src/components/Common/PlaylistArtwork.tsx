import React, { useState } from 'react';
import { Playlist, Track } from '../../types';
import { Music } from 'lucide-react';

interface PlaylistArtworkProps {
  playlist?: Playlist | null;
  tracks?: Track[];
  className?: string;
  fallbackIconClassName?: string;
}

export const PlaylistArtwork: React.FC<PlaylistArtworkProps> = ({
  playlist,
  tracks,
  className = '',
  fallbackIconClassName = 'w-1/3 h-1/3 text-neutral-500',
}) => {
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const songs: Track[] = playlist?.tracks || tracks || [];
  const songsCount = songs.length;

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const getTrackImage = (track: Track): string => {
    const url = track.images?.large || track.images?.medium || track.images?.small || '';
    return (url && url.trim()) ? url.trim() : '';
  };

  // Case 0: 0 songs -> Normal empty playlist artwork (Spotify music note placeholder)
  if (songsCount === 0) {
    return (
      <div
        className={`relative w-full h-full bg-neutral-800/90 flex items-center justify-center select-none shadow-inner ${className}`}
      >
        <Music className={fallbackIconClassName} />
      </div>
    );
  }

  // Case 1: 1 song -> Show that song's artwork
  if (songsCount === 1) {
    const track = songs[0];
    const imgSrc = getTrackImage(track);

    if (!imgSrc || imageErrors[0]) {
      return (
        <div
          className={`relative w-full h-full bg-neutral-800 flex items-center justify-center select-none ${className}`}
        >
          <Music className={fallbackIconClassName} />
        </div>
      );
    }

    return (
      <div className={`relative w-full h-full overflow-hidden bg-neutral-800 ${className}`}>
        <img
          src={imgSrc}
          alt={track.title}
          loading="lazy"
          onError={() => handleImageError(0)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Case 2: 2 songs -> Combine their real artworks (split 2 columns)
  if (songsCount === 2) {
    return (
      <div className={`relative w-full h-full overflow-hidden grid grid-cols-2 bg-neutral-800 ${className}`}>
        {songs.slice(0, 2).map((track, idx) => {
          const imgSrc = getTrackImage(track);
          if (!imgSrc || imageErrors[idx]) {
            return (
              <div
                key={track.id || idx}
                className="w-full h-full bg-neutral-800 flex items-center justify-center border-r border-black/20 last:border-r-0"
              >
                <Music className="w-1/3 h-1/3 text-neutral-600" />
              </div>
            );
          }
          return (
            <img
              key={track.id || idx}
              src={imgSrc}
              alt={track.title}
              loading="lazy"
              onError={() => handleImageError(idx)}
              className="w-full h-full object-cover"
            />
          );
        })}
      </div>
    );
  }

  // Case 3: 3 songs -> Combine their real artworks (left: 1 song, right: 2 songs stacked)
  if (songsCount === 3) {
    const img0 = getTrackImage(songs[0]);
    const img1 = getTrackImage(songs[1]);
    const img2 = getTrackImage(songs[2]);

    return (
      <div className={`relative w-full h-full overflow-hidden grid grid-cols-2 bg-neutral-800 ${className}`}>
        {/* Left half */}
        {!img0 || imageErrors[0] ? (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center border-r border-black/20">
            <Music className="w-1/3 h-1/3 text-neutral-600" />
          </div>
        ) : (
          <img
            src={img0}
            alt={songs[0].title}
            loading="lazy"
            onError={() => handleImageError(0)}
            className="w-full h-full object-cover border-r border-black/20"
          />
        )}

        {/* Right half stacked */}
        <div className="grid grid-rows-2 w-full h-full">
          {!img1 || imageErrors[1] ? (
            <div className="w-full h-full bg-neutral-850 flex items-center justify-center border-b border-black/20">
              <Music className="w-1/4 h-1/4 text-neutral-600" />
            </div>
          ) : (
            <img
              src={img1}
              alt={songs[1].title}
              loading="lazy"
              onError={() => handleImageError(1)}
              className="w-full h-full object-cover border-b border-black/20"
            />
          )}

          {!img2 || imageErrors[2] ? (
            <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
              <Music className="w-1/4 h-1/4 text-neutral-600" />
            </div>
          ) : (
            <img
              src={img2}
              alt={songs[2].title}
              loading="lazy"
              onError={() => handleImageError(2)}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    );
  }

  // Case 4+: 4+ songs -> Spotify-style 2x2 grid with first 4 songs
  return (
    <div className={`relative w-full h-full overflow-hidden grid grid-cols-2 grid-rows-2 bg-neutral-800 ${className}`}>
      {songs.slice(0, 4).map((track, idx) => {
        const imgSrc = getTrackImage(track);
        if (!imgSrc || imageErrors[idx]) {
          return (
            <div
              key={track.id || idx}
              className="w-full h-full bg-neutral-800 flex items-center justify-center border border-black/10"
            >
              <Music className="w-1/3 h-1/3 text-neutral-600" />
            </div>
          );
        }
        return (
          <img
            key={track.id || idx}
            src={imgSrc}
            alt={track.title}
            loading="lazy"
            onError={() => handleImageError(idx)}
            className="w-full h-full object-cover border border-black/10"
          />
        );
      })}
    </div>
  );
};
