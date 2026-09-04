import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, Music } from 'lucide-react';

interface VoiceSearchOverlayProps {
  isOpen: boolean;
  isListening: boolean;
  onClose: () => void;
  transcript: string;
  onToggleListening?: () => void;
  onSelectSuggestion?: (suggestion: string) => void;
}

const SPOTIFY_VOICE_SUGGESTIONS = [
  'Arijit Singh',
  'Diljit Dosanjh',
  'Kesariya',
  'Trending Hindi Hits',
  'Sidhu Moose Wala',
  'Romantic Bollywood',
];

export function VoiceSearchOverlay({
  isOpen,
  isListening,
  onClose,
  transcript,
  onToggleListening,
  onSelectSuggestion,
}: VoiceSearchOverlayProps) {
  const [suggestionIdx, setSuggestionIdx] = useState(0);

  // Rotate sample voice queries smoothly if user is idle
  useEffect(() => {
    if (!transcript && isOpen) {
      const interval = setInterval(() => {
        setSuggestionIdx((prev) => (prev + 1) % SPOTIFY_VOICE_SUGGESTIONS.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [transcript, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="voice-search-overlay-container"
        className="fixed inset-0 z-[200] bg-[#121212] flex flex-col justify-between p-5 sm:p-8 select-none overflow-hidden"
        style={{
          paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
      >
        {/* Top Bar: Clean Spotify header with prominent Close (X) button */}
        <div className="flex items-center justify-between w-full max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isListening ? 'bg-[#1DB954] animate-pulse' : 'bg-neutral-500'
              }`}
            />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-neutral-400">
              {isListening ? 'Listening' : 'Ready'}
            </span>
          </div>

          {/* Close button with large touch target */}
          <button
            id="voice-search-close-button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            type="button"
            aria-label="Close voice search"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
          >
            <X className="w-6 h-6 stroke-[2.2]" />
          </button>
        </div>

        {/* Center Section: Authentic Spotify Voice Interface */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full mx-auto px-2 text-center my-auto">
          {/* Pulsing Mic Graphic */}
          <div className="relative mb-8 flex items-center justify-center">
            {isListening && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1.4, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
                  className="absolute w-28 h-28 rounded-full bg-[#1DB954]/30 pointer-events-none"
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0.6 }}
                  animate={{ scale: 1.25, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.6, delay: 0.4, ease: 'easeOut' }}
                  className="absolute w-24 h-24 rounded-full bg-[#1DB954]/25 pointer-events-none"
                />
              </>
            )}

            <div
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-[#1DB954] text-black shadow-[0_0_40px_rgba(29,185,84,0.45)]'
                  : 'bg-neutral-800 text-neutral-400 border border-white/10'
              }`}
            >
              <Mic className="w-11 h-11 sm:w-12 sm:h-12 stroke-[2.2]" />
            </div>
          </div>

          {/* Transcript / Spoken Text Display */}
          <div className="w-full min-h-[90px] flex flex-col items-center justify-center">
            {transcript ? (
              <div className="space-y-2 w-full animate-in fade-in zoom-in-95 duration-200">
                <p className="text-xs uppercase font-bold tracking-widest text-[#1DB954]">
                  Searching for
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug break-words px-2">
                  "{transcript}"
                </h2>
              </div>
            ) : (
              <div className="space-y-2.5 w-full">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {isListening ? 'Listening for music...' : 'Tap mic to speak'}
                </h2>
                <p className="text-neutral-400 text-sm sm:text-base font-normal">
                  Try saying: <span className="text-white font-medium">"{SPOTIFY_VOICE_SUGGESTIONS[suggestionIdx]}"</span>
                </p>
              </div>
            )}
          </div>

          {/* Quick Voice Suggestion Pills */}
          <div className="mt-8 w-full">
            <div className="flex flex-wrap justify-center gap-2">
              {SPOTIFY_VOICE_SUGGESTIONS.slice(0, 4).map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  onClick={() => {
                    if (onSelectSuggestion) {
                      onSelectSuggestion(sugg);
                    }
                  }}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-neutral-200 hover:text-white border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Music className="w-3.5 h-3.5 text-[#1DB954]" />
                  <span>{sugg}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Action Helper & Manual Mic Toggle */}
        <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-2">
          {onToggleListening && (
            <button
              type="button"
              onClick={onToggleListening}
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-bold tracking-wide uppercase flex items-center gap-2 transition-all cursor-pointer border border-white/10"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 text-neutral-300" />
                  <span>Pause Listening</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-[#1DB954]" />
                  <span>Start Listening</span>
                </>
              )}
            </button>
          )}

          <p className="text-[11px] text-neutral-500 font-medium text-center">
            Tap the X above or choose a suggestion to dismiss
          </p>
        </div>
      </div>
    </AnimatePresence>
  );
}
