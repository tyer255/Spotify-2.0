import React from 'react';
import { ViewState } from '../../types';
import { useUser } from '../../context/UserContext';
import { SpotifyLogo } from '../Common/SpotifyLogo';
import { PWAInstallButton } from '../Common/PWAInstallButton';
import {
  Home,
  Search,
  Library,
  Sparkles,
  Plus,
  Heart,
  Download,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onOpenCreatePlaylist: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onOpenCreatePlaylist }) => {
  const { playlists, likedTrackIds, downloadedTrackIds } = useUser();

  const isHome = currentView.type === 'home';
  const isSearch = currentView.type === 'search';
  const isLibrary = currentView.type === 'library' && currentView.subTab !== 'liked' && currentView.subTab !== 'downloaded';
  const isPremium = currentView.type === 'premium';
  const isLiked = currentView.type === 'library' && currentView.subTab === 'liked';
  const isDownloaded = currentView.type === 'library' && currentView.subTab === 'downloaded';
  const isSettings = currentView.type === 'settings';

  return (
    <aside className="hidden md:flex flex-col w-64 h-full liquid-glass-sidebar p-4 text-neutral-300 select-none flex-shrink-0 relative z-20">
      {/* Brand Logo - Custom Spotify Sonic Wave Emblem */}
      <div
        onClick={() => onNavigate({ type: 'home' })}
        className="flex items-center px-2 py-3 mb-3 cursor-pointer group"
      >
        <SpotifyLogo size={36} showText={true} />
      </div>

      {/* Main Nav Links */}
      <nav className="space-y-1.5">
        <button
          onClick={() => onNavigate({ type: 'home' })}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
            isHome
              ? 'liquid-glass-pill-active text-white font-bold'
              : 'hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Home className={`w-5 h-5 ${isHome ? 'text-emerald-400' : ''}`} />
          <span>Home</span>
        </button>

        <button
          onClick={() => onNavigate({ type: 'search' })}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
            isSearch
              ? 'liquid-glass-pill-active text-white font-bold'
              : 'hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Search className={`w-5 h-5 ${isSearch ? 'text-emerald-400' : ''}`} />
          <span>Search</span>
        </button>

        <button
          onClick={() => onNavigate({ type: 'library' })}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
            isLibrary
              ? 'liquid-glass-pill-active text-white font-bold'
              : 'hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Library className={`w-5 h-5 ${isLibrary ? 'text-emerald-400' : ''}`} />
          <span>Your Library</span>
        </button>

        <button
          onClick={() => onNavigate({ type: 'premium' })}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
            isPremium
              ? 'liquid-glass-pill-active text-white font-bold'
              : 'hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <SpotifyLogo size={20} />
          </div>
          <div className="flex items-center justify-between flex-1">
            <span>Premium</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
              ACTIVE
            </span>
          </div>
        </button>
      </nav>

      {/* Divider */}
      <div className="my-3.5 border-t border-white/10" />

      {/* Quick Playlists & Collections */}
      <div className="space-y-1.5">
        <button
          onClick={onOpenCreatePlaylist}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-all group cursor-pointer border border-transparent hover:border-white/10"
        >
          <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black group-hover:border-emerald-400 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
          </div>
          <span>Create Playlist</span>
        </button>

        <button
          onClick={() => onNavigate({ type: 'library', subTab: 'liked' })}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            isLiked
              ? 'liquid-glass-pill text-white font-semibold'
              : 'text-neutral-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10'
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-700 to-indigo-500 flex items-center justify-center text-white shadow-sm">
            <Heart className="w-3.5 h-3.5 fill-white" />
          </div>
          <div className="flex items-center justify-between flex-1">
            <span>Liked Songs</span>
            <span className="text-xs text-neutral-400">{likedTrackIds.size}</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate({ type: 'playlist', playlistId: 'downloaded-tracks' })}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
            currentView.type === 'playlist' && currentView.playlistId === 'downloaded-tracks'
              ? 'liquid-glass-pill text-white font-semibold'
              : 'text-neutral-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10'
          }`}
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-900/60 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-sm">
            <Download className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center justify-between flex-1">
            <span>Downloaded</span>
            <span className="text-xs text-neutral-400">{downloadedTrackIds.size}</span>
          </div>
        </button>
      </div>

      {/* Divider */}
      <div className="my-3.5 border-t border-white/10" />

      {/* User Playlists Scrollable List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-3">
          Playlists
        </span>
        {playlists.map((pl) => {
          const isSelected = currentView.type === 'playlist' && currentView.playlistId === pl.id;
          return (
            <button
              key={pl.id}
              onClick={() => onNavigate({ type: 'playlist', playlistId: pl.id })}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-all cursor-pointer ${
                isSelected
                  ? 'text-emerald-400 font-semibold bg-white/10 border border-white/10'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {pl.title}
            </button>
          );
        })}
      </div>

      {/* PWA App Install Banner & Settings Footer */}
      <div className="pt-3 space-y-2 border-t border-white/10">
        <PWAInstallButton variant="sidebar" />
        
        <button
          onClick={() => onNavigate({ type: 'settings' })}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            isSettings
              ? 'liquid-glass-pill text-white font-semibold'
              : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>App Settings</span>
        </button>
      </div>
    </aside>
  );
};
