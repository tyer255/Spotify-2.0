import React from 'react';
import { Track } from '../../types';

interface SongShareCardProps {
  track: Track;
  style: string;
  background: string;
  isPeeking?: boolean;
  onClick?: () => void;
}

export const SongShareCard: React.FC<SongShareCardProps> = ({
  track,
  style,
  background,
  isPeeking = false,
  onClick,
}) => {
  const artworkUrl = track.images?.large || track.images?.medium || track.images?.small || '';

  return (
    <div
      onClick={onClick}
      className={`w-[245px] sm:w-[270px] h-[330px] sm:h-[360px] rounded-[22px] overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.7)] relative flex flex-col p-4 sm:p-5 select-none transition-all duration-300 ${
        isPeeking ? 'cursor-pointer hover:opacity-75' : ''
      }`}
      style={{ background }}
    >
      {/* Top / Main Cover Artwork */}
      <div className="w-full flex-1 flex flex-col items-center justify-start pt-1">
        <div className="w-[180px] h-[180px] sm:w-[195px] sm:h-[195px] rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-black/40">
          <img
            src={artworkUrl}
            alt={track.title}
            className="w-full h-full object-cover"
            loading="eager"
            crossOrigin="anonymous"
          />
        </div>

        {/* Track Details */}
        <div className="w-full flex flex-col items-start mt-2.5 sm:mt-3 px-0.5">
          <h3 className="text-[17px] sm:text-[18px] font-bold text-white tracking-tight line-clamp-1 w-full text-left leading-snug">
            {track.title}
          </h3>
          <p className="text-[#a7a7a7] font-medium text-[12px] sm:text-[13px] truncate w-full text-left mt-0.5">
            {track.artist}
          </p>
        </div>
      </div>

      {/* Spotify Signature Branding */}
      <div className="w-full flex items-center gap-1.5 pt-1.5 pb-0.5 px-0.5 mt-auto">
        <svg viewBox="0 0 24 24" className="w-[17px] h-[17px] text-white fill-current shrink-0">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.303c-.215.353-.674.464-1.027.249-2.812-1.718-6.353-2.107-10.522-1.155-.403.092-.803-.16-.895-.563-.092-.403.16-.803.563-.895 4.568-1.044 8.487-.604 11.632 1.317.353.215.464.674.249 1.027zm1.467-3.26c-.27.44-.848.578-1.288.308-3.218-1.978-8.125-2.55-11.932-1.394-.494.15-1.022-.132-1.172-.626-.15-.494.132-1.022.626-1.172 4.354-1.321 9.775-.683 13.458 1.576.44.27.578.848.308 1.288zm.126-3.41c-3.859-2.292-10.228-2.503-13.908-1.386-.59.179-1.217-.16-1.396-.75-.179-.59.16-1.217.75-1.396 4.227-1.284 11.264-1.038 15.688 1.587.531.315.704 1.002.389 1.533-.315.531-1.002.704-1.533.389z" />
        </svg>
        <span className="text-[12px] sm:text-[13px] font-bold text-white tracking-tight">Spotify</span>
      </div>
    </div>
  );
};
