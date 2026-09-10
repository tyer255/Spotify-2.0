import React from 'react';
import { Track } from '../../types';

interface LyricsShareCardProps {
  track: Track;
  lyrics: string;
  style: string;
  background: string;
  hasLyrics: boolean;
  isPeeking?: boolean;
  onClick?: () => void;
}

export const LyricsShareCard: React.FC<LyricsShareCardProps> = ({
  track,
  lyrics,
  style,
  background,
  hasLyrics,
  isPeeking = false,
  onClick,
}) => {
  const artworkUrl = track.images?.medium || track.images?.small || track.images?.large || '';

  return (
    <div
      onClick={onClick}
      className={`w-[245px] sm:w-[270px] h-[330px] sm:h-[360px] rounded-[22px] overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.7)] relative p-4 sm:p-5 flex flex-col justify-between select-none transition-all duration-300 ${
        isPeeking ? 'cursor-pointer hover:opacity-75' : ''
      }`}
      style={{ background }}
    >
      {/* Mini Track Header */}
      <div className="flex items-center gap-2 w-full shrink-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-md overflow-hidden shadow-md shrink-0 bg-black/40">
          <img
            src={artworkUrl}
            alt={track.title}
            className="w-full h-full object-cover"
            loading="eager"
            crossOrigin="anonymous"
          />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <h4 className="text-[12px] sm:text-[13px] font-bold text-white leading-tight truncate">
            {track.title}
          </h4>
          <span className="text-[10px] sm:text-[11px] text-[#a7a7a7] font-medium leading-tight truncate mt-0.5">
            Song · {track.artist}
          </span>
        </div>
      </div>

      {/* Primary Lyrics Typography */}
      <div className="flex-1 flex flex-col justify-center my-2 sm:my-3 overflow-hidden">
        {hasLyrics ? (
          <p className="text-[20px] sm:text-[23px] font-black text-white leading-[1.22] tracking-tight whitespace-pre-line line-clamp-5 drop-shadow-sm font-sans">
            {lyrics || 'Loading lyrics...'}
          </p>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-4">
            <p className="text-[14px] font-medium text-white/50">
              Lyrics unavailable for this song
            </p>
          </div>
        )}
      </div>

      {/* Spotify Signature Branding */}
      <div className="w-full flex items-center gap-1.5 pt-1.5 pb-0.5 px-0.5 mt-auto shrink-0">
        <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] text-white fill-current shrink-0">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.303c-.215.353-.674.464-1.027.249-2.812-1.718-6.353-2.107-10.522-1.155-.403.092-.803-.16-.895-.563-.092-.403.16-.803.563-.895 4.568-1.044 8.487-.604 11.632 1.317.353.215.464.674.249 1.027zm1.467-3.26c-.27.44-.848.578-1.288.308-3.218-1.978-8.125-2.55-11.932-1.394-.494.15-1.022-.132-1.172-.626-.15-.494.132-1.022.626-1.172 4.354-1.321 9.775-.683 13.458 1.576.44.27.578.848.308 1.288zm.126-3.41c-3.859-2.292-10.228-2.503-13.908-1.386-.59.179-1.217-.16-1.396-.75-.179-.59.16-1.217.75-1.396 4.227-1.284 11.264-1.038 15.688 1.587.531.315.704 1.002.389 1.533-.315.531-1.002.704-1.533.389z" />
        </svg>
        <span className="text-[12px] sm:text-[13px] font-bold text-white tracking-tight">Spotify</span>
      </div>
    </div>
  );
};
