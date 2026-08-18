/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ViewState } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider, useUser } from './context/UserContext';
import { PlayerProvider } from './context/PlayerContext';

import { Sidebar } from './components/Navigation/Sidebar';
import { TopBar } from './components/Navigation/TopBar';
import { BottomNav } from './components/Navigation/BottomNav';
import { MiniPlayer } from './components/Player/MiniPlayer';
import { FullscreenPlayer } from './components/Player/FullscreenPlayer';
import { LyricsDrawer } from './components/Player/LyricsDrawer';
import { QueueDrawer } from './components/Player/QueueDrawer';
import { OfflineBanner } from './components/Common/OfflineBanner';
import { Toast } from './components/Common/Toast';
import { CreatePlaylistModal } from './components/Common/CreatePlaylistModal';
import { CreateActionMenu } from './components/Navigation/CreateActionMenu';

import { HomeView } from './views/HomeView';
import { SearchView } from './views/SearchView';
import { ArtistView } from './views/ArtistView';
import { AlbumView } from './views/AlbumView';
import { PlaylistView } from './views/PlaylistView';
import { LibraryView } from './views/LibraryView';
import { ProfileView } from './views/ProfileView';
import { SettingsView } from './views/SettingsView';
import { PremiumView } from './views/PremiumView';

function AppContent() {
  // Navigation stack state
  const [history, setHistory] = useState<ViewState[]>([{ type: 'home' }]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  const currentView = history[historyIndex] || { type: 'home' };
  const mainRef = useRef<HTMLElement>(null);
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const prevViewKeyRef = useRef<string>('home');

  const getViewKey = (view: ViewState): string => {
    if (view.type === 'album') return `album-${view.albumId}`;
    if (view.type === 'artist') return `artist-${view.artistId}`;
    if (view.type === 'playlist') return `playlist-${view.playlistId}`;
    if (view.type === 'library') return `library-${view.subTab || 'all'}`;
    return view.type;
  };

  // Save previous scroll position and restore or reset scroll on view change
  useEffect(() => {
    const currentKey = getViewKey(currentView);
    
    // Save scroll of previous view before switching
    if (mainRef.current && prevViewKeyRef.current) {
      // (Saved during scroll or view transition)
    }

    // Restore saved scroll position for current view if exists, otherwise scroll to top (0)
    const targetScroll = scrollPositionsRef.current[currentKey] ?? 0;
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: targetScroll, behavior: 'instant' });
    }

    prevViewKeyRef.current = currentKey;
  }, [currentView]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const currentKey = getViewKey(currentView);
    scrollPositionsRef.current[currentKey] = target.scrollTop;
  };

  const navigateTo = (newView: ViewState) => {
    // If it's the exact same view, ignore
    if (JSON.stringify(newView) === JSON.stringify(currentView)) return;

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newView);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    if (newView.type === 'search' && newView.initialQuery) {
      setSearchQuery(newView.initialQuery);
    }
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.altKey && e.key === 'ArrowLeft') {
        handleGoBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        handleGoForward();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history.length]);

  return (
    <div className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans select-none antialiased relative">
      {/* Dynamic Ambient Background & Refraction Orbs for Liquid Glass Depth */}
      <div className="ambient-bg pointer-events-none -z-10" aria-hidden="true">
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
      </div>
      <div className="noise-overlay pointer-events-none -z-10" aria-hidden="true" />

      {/* Top Workspace Area: Sidebar + Scrollable View */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Sidebar for Desktop & Tablet */}
        <Sidebar
          currentView={currentView}
          onNavigate={navigateTo}
          onOpenCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden relative">
          {/* Offline notification banner if user loses network */}
          <OfflineBanner />

          {/* Sticky TopBar */}
          <TopBar
            currentView={currentView}
            onNavigate={navigateTo}
            onGoBack={handleGoBack}
            onGoForward={handleGoForward}
            canGoBack={historyIndex > 0}
            canGoForward={historyIndex < history.length - 1}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Scrollable View Container with Liquid Glass Transparency */}
          <main
            ref={mainRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden relative bg-black/20 backdrop-blur-[1px] pb-28 md:pb-6"
          >
            {currentView.type === 'home' && <HomeView onNavigate={navigateTo} />}
            {currentView.type === 'search' && (
              <SearchView
                searchQuery={searchQuery || currentView.initialQuery}
                onSearchChange={setSearchQuery}
                onNavigate={navigateTo}
              />
            )}
            {currentView.type === 'artist' && (
              <ArtistView artistId={currentView.artistId} onNavigate={navigateTo} />
            )}
            {currentView.type === 'album' && (
              <AlbumView albumId={currentView.albumId} onNavigate={navigateTo} />
            )}
            {currentView.type === 'playlist' && (
              <PlaylistView playlistId={currentView.playlistId} onNavigate={navigateTo} />
            )}
            {currentView.type === 'library' && (
              <LibraryView
                initialSubTab={currentView.subTab}
                onNavigate={navigateTo}
                onOpenCreatePlaylist={() => setIsCreateMenuOpen(true)}
              />
            )}
            {currentView.type === 'premium' && <PremiumView onNavigate={navigateTo} />}
            {currentView.type === 'profile' && <ProfileView onNavigate={navigateTo} />}
            {currentView.type === 'settings' && <SettingsView onNavigate={navigateTo} />}
          </main>
        </div>
      </div>

      {/* Bottom Player: Floating pill on mobile, full-width docked bar on desktop */}
      <MiniPlayer />

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        currentView={currentView}
        onNavigate={navigateTo}
        onOpenCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
        isCreateMenuOpen={isCreateMenuOpen}
        onToggleCreateMenu={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
      />

      {/* Global Overlays & Modals */}
      <FullscreenPlayer onNavigate={navigateTo} />
      <LyricsDrawer />
      <QueueDrawer />
      <CreateActionMenu
        isOpen={isCreateMenuOpen}
        onClose={() => setIsCreateMenuOpen(false)}
        onSelectCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
        onNavigate={navigateTo}
      />
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onNavigate={navigateTo}
      />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <PlayerProvider>
          <AppContent />
        </PlayerProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
