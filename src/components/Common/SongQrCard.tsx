import React, { useEffect, useState } from 'react';
import { Track } from '../../types';
import { generateSongQrDataUrl, getSongDeepLink } from '../../utils/qrUtils';
import { X, QrCode } from 'lucide-react';

interface SongQrCardProps {
  track: Track;
  onClose?: () => void;
}

export const SongQrCard: React.FC<SongQrCardProps> = ({ track, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    generateSongQrDataUrl(track)
      .then((dataUrl) => {
        if (isMounted) {
          setQrDataUrl(dataUrl);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to generate Song QR code:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [track]);

  const coverUrl =
    track.images?.large || track.images?.medium || track.images?.small || '';

  return (
    <div className="fixed inset-0 z-[1000000] flex flex-col bg-neutral-900 overflow-hidden animate-in fade-in duration-200">
      {/* Ambient background glow from artwork (simulated with emerald) */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-emerald-900/30 to-transparent pointer-events-none" />
      
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 sm:p-6 mt-safe z-10">
        <button
          type="button"
          onClick={onClose}
          className="p-3 text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          title="Close QR Code"
        >
          <X className="w-7 h-7" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 -mt-10 z-10">
        {/* Artwork */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-xl overflow-hidden shadow-2xl mb-6 bg-neutral-800">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={track.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500">
              <QrCode className="w-16 h-16" />
            </div>
          )}
        </div>

        {/* Title & Artist */}
        <div className="text-center max-w-sm mb-10">
          <h2 className="text-2xl font-bold text-white tracking-tight line-clamp-1 mb-1">
            {track.title}
          </h2>
          <p className="text-base font-medium text-neutral-400 line-clamp-1">
            {track.artist}
          </p>
        </div>

        {/* The QR Code Card */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col items-center justify-center border border-neutral-200 mb-6">
          {isGenerating ? (
            <div className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] flex items-center justify-center text-neutral-400">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Spotiz Song QR Code"
              className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] object-contain rounded-lg"
            />
          ) : (
            <div className="w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] flex items-center justify-center text-neutral-500 text-xs">
              Unable to generate QR
            </div>
          )}
        </div>

        {/* Branding & Instruction */}
        <div className="flex flex-col items-center mt-2">
          <div className="flex items-center gap-1.5 text-white font-bold tracking-wider uppercase mb-2">
            <QrCode className="w-4 h-4" />
            <span>Spotiz Song Code</span>
          </div>
          <p className="text-[13px] text-neutral-400 font-medium">
            Scan this code with Spotiz to open this song
          </p>
        </div>
      </div>
    </div>
  );
};
