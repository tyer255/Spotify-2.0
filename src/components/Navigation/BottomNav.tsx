import React from 'react';
import { ViewState } from '../../types';
import { Home, Search, Plus, X } from 'lucide-react';
import { SpotifyLogo } from '../Common/SpotifyLogo';
import { usePlayer } from '../../context/PlayerContext';
import { motion, AnimatePresence } from 'motion/react';

interface BottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onOpenCreatePlaylist?: () => void;
  isCreateMenuOpen?: boolean;
  onToggleCreateMenu?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenCreatePlaylist,
  isCreateMenuOpen = false,
  onToggleCreateMenu,
}) => {
  const { track: currentTrack } = usePlayer();
  const hasTrack = !!currentTrack;

  const isHome = currentView.type === 'home';
  const isSearch = currentView.type === 'search';
  const isLibrary = currentView.type === 'library';
  const isPremium = currentView.type === 'premium';

  const handleCreateClick = () => {
    if (onToggleCreateMenu) {
      onToggleCreateMenu();
    } else if (onOpenCreatePlaylist) {
      onOpenCreatePlaylist();
    } else {
      onNavigate({ type: 'library', subTab: 'playlists' });
    }
  };

  return (
    <div 
      className={`fixed z-40 liquid-glass-dock flex items-center justify-around px-2 select-none transition-all duration-500 ease-in-out bottom-0 left-0 right-0 w-full rounded-t-2xl border-t border-white/10 md:bottom-8 md:rounded-full md:border md:border-white/10 md:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] md:px-4 md:py-1 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] md:h-[72px] md:pb-0 md:w-[400px] md:max-w-[90vw] md:mx-auto ${hasTrack ? 'md:left-0 md:right-[50vw] lg:right-[450px] md:translate-x-0' : 'md:left-0 md:right-0'}`}
      
    >
      {/* 1. Home */}
      <button
        onClick={() => onNavigate({ type: 'home' })}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-300 cursor-pointer ${
          isHome
            ? 'text-white font-bold'
            : 'text-neutral-400 hover:text-white'
        }`}
      >
        {isHome && (
          <div className="absolute inset-0 bg-white/10 rounded-xl blur-[1px] -z-10 transition-all" />
        )}
        <Home className={`w-5 h-5 transition-transform ${isHome ? 'text-white fill-white scale-110' : 'scale-100'}`} />
        <span className={`text-[10px] mt-1 font-medium tracking-tight ${isHome ? 'text-white font-bold' : ''}`}>Home</span>
      </button>

      {/* 2. Search */}
      <button
        onClick={() => onNavigate({ type: 'search' })}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-300 cursor-pointer ${
          isSearch
            ? 'text-white font-bold'
            : 'text-neutral-400 hover:text-white'
        }`}
      >
        {isSearch && (
          <div className="absolute inset-0 bg-white/10 rounded-xl blur-[1px] -z-10 transition-all" />
        )}
        <Search className={`w-5 h-5 transition-transform ${isSearch ? 'stroke-[2.5] scale-110 text-white' : 'scale-100'}`} />
        <span className={`text-[10px] mt-1 font-medium tracking-tight ${isSearch ? 'text-white font-bold' : ''}`}>Search</span>
      </button>

      {/* 3. Your Library (Spotiz Style 3-bar icon) */}
      <button
        onClick={() => onNavigate({ type: 'library' })}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-300 cursor-pointer ${
          isLibrary
            ? 'text-white font-bold'
            : 'text-neutral-400 hover:text-white'
        }`}
      >
        {isLibrary && (
          <div className="absolute inset-0 bg-white/10 rounded-xl blur-[1px] -z-10 transition-all" />
        )}
        <svg
          viewBox="0 0 24 24"
          className={`w-5 h-5 fill-current transition-transform ${isLibrary ? 'text-white scale-110' : 'text-neutral-400 scale-100'}`}
        >
          <path d="M4 4h2.5v16H4V4zm6 0h2.5v16H10V4zm6.5.6l2.3-.9 5.5 14.8-2.3.9-5.5-14.8z" />
        </svg>
        <span className={`text-[10px] mt-1 font-medium truncate tracking-tight ${isLibrary ? 'text-white font-bold' : ''}`}>Your Library</span>
      </button>

      {/* 4. Premium (Spotiz Logo icon as shown in Spotiz mobile screenshot) */}
      <button
        onClick={() => onNavigate({ type: 'premium' })}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-300 cursor-pointer ${
          isPremium
            ? 'text-white font-bold'
            : 'text-neutral-400 hover:text-white'
        }`}
      >
        {isPremium && (
          <div className="absolute inset-0 bg-emerald-500/15 rounded-xl blur-[1px] -z-10 transition-all" />
        )}
        <div className={`transition-transform flex items-center justify-center ${isPremium ? 'scale-115' : 'opacity-80 hover:opacity-100'}`}>
          <SpotifyLogo size={22} variant="green" />
        </div>
        <span className={`text-[10px] mt-1 font-medium tracking-tight ${isPremium ? 'text-emerald-400 font-bold' : ''}`}>
          Premium
        </span>
      </button>

      {/* 5. Create (+ / X morphing button) */}
      <button
        onClick={handleCreateClick}
        className="relative flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-300 cursor-pointer"
        title={isCreateMenuOpen ? "Close menu" : "Create"}
      >
        <div className="relative w-6 h-6 flex items-center justify-center">
          <motion.div
            animate={{
              rotate: isCreateMenuOpen ? 90 : 0,
              scale: isCreateMenuOpen ? 1.05 : 1,
            }}
            transition={{ type: 'spring', damping: 24, stiffness: 360 }}
            className={`flex items-center justify-center transition-colors ${
              isCreateMenuOpen
                ? 'w-6 h-6 rounded-full bg-white text-black shadow-[0_0_14px_rgba(255,255,255,0.45)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {isCreateMenuOpen ? (
              <X className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Plus className="w-5 h-5 stroke-[2.2]" />
            )}
          </motion.div>
        </div>
        <span className={`text-[10px] mt-1 font-medium tracking-tight transition-colors ${
          isCreateMenuOpen ? 'text-white font-semibold' : 'text-neutral-400'
        }`}>
          Create
        </span>
      </button>
    </div>
  );
};


