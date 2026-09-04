import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../../context/UserContext';
import { ViewState } from '../../types';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: ViewState) => void;
  type?: 'playlist' | 'collaborative' | 'blend';
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  type = 'playlist',
}) => {
  const { playlists, createPlaylist } = useUser();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize title when opening
  useEffect(() => {
    if (isOpen) {
      let defaultName = `My playlist #${playlists.length + 1}`;
      if (type === 'collaborative') {
        defaultName = `Collaborative playlist #${playlists.length + 1}`;
      } else if (type === 'blend') {
        defaultName = `My Blend #${playlists.length + 1}`;
      }

      setTitle(defaultName);
      setLoading(false);

      // Auto-focus and select text for immediate seamless typing
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen, playlists.length]);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim();
    if (!finalTitle || loading) return;

    setLoading(true);
    const newPlaylist = await createPlaylist(finalTitle, '', '', [], {
      isCollaborative: type === 'collaborative',
      isBlend: type === 'blend'
    });
    setLoading(false);

    if (newPlaylist) {
      onClose();
      if (onNavigate) {
        onNavigate({ type: 'playlist', playlistId: newPlaylist.id });
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="create-playlist-fullscreen-screen"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex flex-col justify-center items-center px-6 sm:px-10 bg-gradient-to-b from-[#404040] via-[#242424] to-[#121212] select-none overflow-hidden"
        >
          {/* Subtle top ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <form
            onSubmit={handleSubmit}
            className="relative z-10 w-full max-w-lg flex flex-col items-center text-center"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-8 sm:mb-12">
              {type === 'collaborative' ? 'Name your collaborative playlist' : 'Give your playlist a name'}
            </h1>
            
            <div className="w-full max-w-md mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={title || ''}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'collaborative' ? 'Collaborative playlist' : 'My playlist'}
                required
                className="w-full text-2xl sm:text-3xl md:text-4xl font-extrabold text-white text-center bg-transparent border-none outline-none focus:outline-none focus:ring-0 placeholder:text-neutral-500 px-2 py-1 tracking-tight"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleClose();
                  }
                }}
              />
              <div className="w-full h-[1.5px] bg-neutral-500/80 mt-3 mx-auto transition-colors" />
            </div>

            {/* Buttons: Cancel & Create */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-10 sm:mt-14 w-full max-w-xs sm:max-w-sm mx-auto">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-3 sm:py-3.5 px-6 rounded-full border border-neutral-500 bg-neutral-900/40 hover:bg-neutral-800/80 active:scale-95 text-white font-bold text-sm sm:text-base transition-all shadow-md cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || loading}
                className="flex-1 py-3 sm:py-3.5 px-6 rounded-full bg-[#1db954] hover:bg-[#1ed760] active:scale-95 text-black font-bold text-sm sm:text-base transition-all shadow-[0_4px_24px_rgba(29,185,84,0.35)] cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
