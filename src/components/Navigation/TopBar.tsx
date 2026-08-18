import React from 'react';
import { ViewState } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { SpotifyLogo } from '../Common/SpotifyLogo';
import { PWAInstallButton } from '../Common/PWAInstallButton';
import { UserAvatar } from '../Common/UserAvatar';
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Search,
  Settings,
  X,
} from 'lucide-react';

interface TopBarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onNavigate,
  onGoBack,
  onGoForward,
  canGoBack,
  canGoForward,
  searchQuery = '',
  onSearchChange,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { profile } = useUser();

  const isSearch = currentView.type === 'search';
  const isLibrary = currentView.type === 'library';

  return (
    <header className={`sticky top-0 z-30 items-center justify-between px-3 sm:px-6 md:px-8 py-3 liquid-glass-topbar select-none ${
      isSearch || isLibrary ? 'hidden md:flex' : 'flex'
    }`}>
      {/* Left: Mobile Brand Logo + Navigation Buttons */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {/* Mobile-only Logo */}
        <div
          onClick={() => onNavigate({ type: 'home' })}
          className="md:hidden flex items-center flex-shrink-0 cursor-pointer pr-1"
        >
          <SpotifyLogo size={28} />
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          <button
            onClick={onGoBack}
            disabled={!canGoBack}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 disabled:opacity-30 disabled:hover:bg-black/40 text-neutral-200 flex items-center justify-center transition-colors cursor-pointer"
            title="Go back"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={onGoForward}
            disabled={!canGoForward}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/70 disabled:opacity-30 disabled:hover:bg-black/40 text-neutral-200 flex items-center justify-center transition-colors cursor-pointer hidden xs:flex"
            title="Go forward"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Search bar is ONLY inside the Search tab (Never shown on Home, Library, Premium, Create) */}
      </div>

      {/* Right: PWA Install Button, Theme Toggle, Settings & Profile Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 ml-2">
        {/* PWA Install Button */}
        <PWAInstallButton variant="compact" />

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/5 transition-colors cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Settings button */}
        <button
          onClick={() => onNavigate({ type: 'settings' })}
          className="p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/5 transition-colors hidden sm:block cursor-pointer"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Profile Avatar */}
        <button
          onClick={() => onNavigate({ type: 'profile' })}
          className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 transition-colors cursor-pointer"
        >
          <UserAvatar
            avatarUrl={profile?.avatar}
            name={profile?.name || 'Your Name'}
            sizeClassName="w-7 h-7"
            iconClassName="w-4 h-4"
          />
          <span className="hidden sm:inline text-xs font-semibold text-neutral-200 truncate max-w-[90px]">
            {profile?.name || 'Your Name'}
          </span>
        </button>
      </div>
    </header>
  );
};
