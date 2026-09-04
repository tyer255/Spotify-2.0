import React, { useState, useEffect } from 'react';
import { resolveArtist } from '../../utils/artistAliases';
import { getValidImageUrl } from '../../utils/imageHelper';
import { getArtistPortrait, cacheArtistPortrait, fetchArtistPortraitLive } from '../../utils/artistPortraits';

interface ArtistAvatarProps {
  name: string;
  id?: string;
  image?: string | null;
  className?: string;
  imageClassName?: string;
  iconClassName?: string;
  sizeClassName?: string;
  alt?: string;
  onClick?: () => void;
  showHoverEffect?: boolean;
}

export const ArtistAvatar: React.FC<ArtistAvatarProps> = ({
  name,
  id,
  image,
  className = '',
  imageClassName = '',
  iconClassName = '',
  sizeClassName = 'w-full h-full',
  alt,
  onClick,
  showHoverEffect = false,
}) => {
  const getResolvedImage = (): string => {
    const validImg = getValidImageUrl(image || undefined);
    if (validImg && !validImg.includes('unsplash.com') && !validImg.includes('placeholder') && !validImg.includes('d41d8cd98f00b204e9800998ecf8427e')) {
      cacheArtistPortrait(id || name, validImg);
      return validImg;
    }
    const fromPortraitCatalog = getArtistPortrait(id) || getArtistPortrait(name);
    if (fromPortraitCatalog) {
      cacheArtistPortrait(id || name, fromPortraitCatalog);
      return fromPortraitCatalog;
    }
    const resolved = resolveArtist(name);
    if (resolved && resolved.entry.portraitUrl && !resolved.entry.portraitUrl.includes('unsplash.com') && !resolved.entry.portraitUrl.includes('placeholder')) {
      cacheArtistPortrait(id || name, resolved.entry.portraitUrl);
      return resolved.entry.portraitUrl;
    }
    return '';
  };

  const [currentSrc, setCurrentSrc] = useState<string>(getResolvedImage);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const directUrl = getResolvedImage();
    if (directUrl) {
      setCurrentSrc(directUrl);
      setHasError(false);
      return;
    }

    // Dynamic live HD portrait fetch from Deezer/Wiki backend
    let active = true;
    const query = name.trim();
    if (query) {
      fetchArtistPortraitLive(id || query).then((liveUrl) => {
        if (active && liveUrl) {
          setCurrentSrc(liveUrl);
          setHasError(false);
        }
      });
    }

    return () => {
      active = false;
    };
  }, [name, id, image]);

  const handleImageError = () => {
    // If the image fails to load, try catalog or live portrait fetch once before showing initial
    const catalogFallback = getArtistPortrait(name);
    if (catalogFallback && catalogFallback !== currentSrc) {
      setCurrentSrc(catalogFallback);
      setHasError(false);
    } else {
      // Attempt live fetch if not already done
      fetchArtistPortraitLive(name).then((liveUrl) => {
        if (liveUrl && liveUrl !== currentSrc) {
          setCurrentSrc(liveUrl);
          setHasError(false);
        } else {
          setHasError(true);
        }
      }).catch(() => {
        setHasError(true);
      });
    }
  };

  const initialLetter = name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'A';

  return (
    <div
      onClick={onClick}
      className={`relative rounded-full overflow-hidden flex-shrink-0 bg-[#242424] flex items-center justify-center select-none ${sizeClassName} ${className}`}
    >
      {currentSrc && !hasError ? (
        <img
          src={currentSrc}
          alt={alt || name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleImageError}
          className={`w-full h-full object-cover ${showHoverEffect ? 'group-hover:scale-105 transition-transform duration-500' : ''} ${imageClassName}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#383842] to-[#1f1f23] text-neutral-300 font-bold">
          <span className="text-sm sm:text-base select-none">{initialLetter}</span>
        </div>
      )}
    </div>
  );
};
