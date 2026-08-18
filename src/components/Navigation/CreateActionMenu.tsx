import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music2, Users, Disc, Layers } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { ViewState } from '../../types';

interface CreateActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCreatePlaylist: () => void;
  onNavigate?: (view: ViewState) => void;
}

export const CreateActionMenu: React.FC<CreateActionMenuProps> = ({
  isOpen,
  onClose,
  onSelectCreatePlaylist,
}) => {
  const { showToast } = useUser();

  const handleSelect = (action: 'playlist' | 'collaborative' | 'blend') => {
    if (action === 'playlist') {
      onClose();
      onSelectCreatePlaylist();
    } else if (action === 'collaborative') {
      showToast('Collaborative playlist feature is coming soon!');
    } else if (action === 'blend') {
      showToast('Blend playlist feature is coming soon!');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="create-action-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
          />

          {/* Floating Menu Card positioned above bottom nav / + button */}
          <motion.div
            key="create-action-menu-card"
            initial={{ opacity: 0, scale: 0.88, y: 35 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 25 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            style={{ transformOrigin: 'bottom right' }}
            className="fixed bottom-[74px] right-3 sm:right-6 left-3 sm:left-auto sm:w-[380px] z-50 rounded-3xl bg-[#1c1c1e] border border-white/10 p-3 shadow-2xl backdrop-blur-2xl space-y-1.5 select-none overflow-hidden"
          >
            {/* 1. Playlist Option (Fully functional) */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04, duration: 0.2 }}
              onClick={() => handleSelect('playlist')}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/10 active:bg-white/15 transition-all text-left group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-800/90 border border-white/10 flex items-center justify-center text-neutral-200 group-hover:text-emerald-400 group-hover:border-emerald-500/30 group-hover:bg-neutral-800 transition-all flex-shrink-0 shadow-md">
                <Music2 className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Playlist
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5 leading-snug truncate">
                  Create a playlist with songs or episodes
                </p>
              </div>
            </motion.button>

            {/* 2. Collaborative Playlist Option (Disabled / Soon) */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.2 }}
              onClick={() => handleSelect('collaborative')}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all text-left group cursor-pointer opacity-90 hover:opacity-100"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-800/90 border border-white/10 flex items-center justify-center text-neutral-300 group-hover:text-white transition-all flex-shrink-0 shadow-md">
                <Users className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-base font-bold text-white group-hover:text-neutral-200 transition-colors truncate">
                    Collaborative playlist
                  </h4>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/10 flex-shrink-0">
                    Soon
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5 leading-snug truncate">
                  Create a playlist together with friends
                </p>
              </div>
            </motion.button>

            {/* 3. Blend Option (Disabled / Soon) */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.2 }}
              onClick={() => handleSelect('blend')}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/5 active:bg-white/10 transition-all text-left group cursor-pointer opacity-90 hover:opacity-100"
            >
              <div className="w-12 h-12 rounded-full bg-neutral-800/90 border border-white/10 flex items-center justify-center text-neutral-300 group-hover:text-white transition-all flex-shrink-0 shadow-md">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-neutral-300 group-hover:text-white">
                  <circle cx="9" cy="12" r="6" fillOpacity="0.8" />
                  <circle cx="15" cy="12" r="6" fillOpacity="0.8" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-base font-bold text-white group-hover:text-neutral-200 transition-colors truncate">
                    Blend
                  </h4>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/10 flex-shrink-0">
                    Soon
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5 leading-snug truncate">
                  Combine your friends’ tastes into a playlist
                </p>
              </div>
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
