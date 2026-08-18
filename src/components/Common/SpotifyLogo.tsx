import React from 'react';

interface SpotifyLogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  textClassName?: string;
  variant?: 'green' | 'white' | 'monochrome' | 'full' | 'icon' | 'badge';
  animated?: boolean;
}

export const SpotifyLogo: React.FC<SpotifyLogoProps> = ({
  size = 24,
  className = '',
  showText = false,
  textClassName = '',
  variant = 'green',
  animated = false,
}) => {
  const numericSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 24;

  // Determine circle and waves color based on variant
  let circleFill = '#1ED760'; // Official Spotify Green
  let waveFill = '#000000'; // Authentic black acoustic wave cutouts

  if (variant === 'white') {
    circleFill = '#FFFFFF';
    waveFill = '#000000';
  } else if (variant === 'monochrome') {
    circleFill = '#FFFFFF';
    waveFill = '#000000';
  }

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <div
        className={`relative flex-shrink-0 flex items-center justify-center ${
          animated ? 'animate-pulse' : ''
        }`}
        style={{ width: numericSize, height: numericSize }}
      >
        <svg
          viewBox="0 0 24 24"
          width={numericSize}
          height={numericSize}
          className="w-full h-full block flex-shrink-0"
          style={{ minWidth: numericSize, minHeight: numericSize }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Official Solid Spotify Circular Backdrop */}
          <circle cx="12" cy="12" r="12" fill={circleFill} />

          {/* Official Mathematical Spotify 3 Soundwave Acoustic Arcs */}
          <path
            d="M17.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
            fill={waveFill}
          />
        </svg>
      </div>

      {/* Brand Typography (when requested) */}
      {(showText || variant === 'full') && (
        <div className="flex items-baseline gap-1.5 leading-none">
          <span
            className={`font-black tracking-tight text-white ${
              textClassName || 'text-xl sm:text-2xl font-sans'
            }`}
          >
            Spotify
          </span>
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Premium
          </span>
        </div>
      )}
    </div>
  );
};


