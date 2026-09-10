import { ReloadPrompt } from './components/ReloadPrompt';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ViewState } from './types';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider, useUser } from './context/UserContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { ShareProvider } from './context/ShareContext';
import { api } from './services/apiClient';

import { Sidebar } from './components/Navigation/Sidebar';
import { TopBar } from './components/Navigation/TopBar';
import { BottomNav } from './components/Navigation/BottomNav';
import { MiniPlayer } from './components/Player/MiniPlayer';
import { FullscreenPlayer } from './components/Player/FullscreenPlayer';
import { TabletRightPlayer } from './components/Player/TabletRightPlayer';
import { LyricsDrawer } from './components/Player/LyricsDrawer';
import { QueueDrawer } from './components/Player/QueueDrawer';
import { AmbientMode } from './components/Player/AmbientMode';
import { OfflineBanner } from './components/Common/OfflineBanner';
import { Toast } from './components/Common/Toast';
import { CreatePlaylistModal } from './components/Common/CreatePlaylistModal';
import { CreateActionMenu } from './components/Navigation/CreateActionMenu';
import { ComingSoonModal } from './components/Common/ComingSoonModal';

import { HomeView } from './views/HomeView';
import { SearchView } from './views/SearchView';
import { ArtistView } from './views/ArtistView';
import { AlbumView } from './views/AlbumView';
import { PlaylistView } from './views/PlaylistView';
import { LibraryView } from './views/LibraryView';
import { ProfileView } from './views/ProfileView';
import { SettingsView } from './views/SettingsView';
import { PremiumView } from './views/PremiumView';
import { BlendSetupView } from './views/BlendSetupView';
import { BlendInviteView } from './views/BlendInviteView';
import { InfoView } from './views/InfoView';
import { RadioHubView } from './views/RadioHubView';
import { RadioStationView } from './views/RadioStationView';
import { LoginPopup } from './components/Auth/LoginPopup';
import { ShareLandingView } from './views/ShareLandingView';

function AppContent() {
  const { isComingSoonOpen, comingSoonTitle, comingSoonDesc, closeComingSoon, showToast } = useUser();
  const { playTrack } = usePlayer();
  // Navigation stack state
  const [history, setHistory] = useState<ViewState[]>([{ type: 'home' }]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [createPlaylistType, setCreatePlaylistType] = useState<'playlist' | 'collaborative' | 'blend'>('playlist');
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  const currentView = history[historyIndex] || { type: 'home' };
  const mainRef = useRef<HTMLElement>(null);
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const prevViewKeyRef = useRef<string>('home');
  const isRestoringScrollRef = useRef<boolean>(false);

  useEffect(() => {
    // Check for share landing
    if (window.location.pathname.startsWith('/share/')) {
      const parts = window.location.pathname.split('/');
      if (parts.length >= 4) {
        setHistory([{ type: 'share-landing', shareType: parts[2] as any, shareId: parts[3] }]);
        return;
      }
    }
    
    const params = new URLSearchParams(window.location.search);
    const blendId = params.get('blend');
    if (blendId) {
      setHistory([{ type: 'blend-invite', blendId }]);
    }

    // Spotiz Song QR code / deep link (?track=..., ?song=..., #track=..., #song=..., /song/...)
    let songId = params.get('track') || params.get('song');
    if (!songId && window.location.hash) {
      const match = window.location.hash.match(/(?:#|&)(?:track|song)=([^&]+)/);
      if (match) songId = decodeURIComponent(match[1]);
    }
    if (!songId && window.location.pathname.startsWith('/song/')) {
      songId = decodeURIComponent(window.location.pathname.replace(/^\/song\//, '').split('/')[0]);
    }

    if (songId) {
      api.getTrack(songId).then((res) => {
        if (res.success && res.data) {
          playTrack(res.data, [res.data]);
          showToast(`Now playing: ${res.data.title}`);
        }
      }).catch(() => {});
    }
  }, []);

  const getViewKey = (view: ViewState): string => {
    if (view.type === 'album') return `album-${view.albumId}`;
    if (view.type === 'artist') return `artist-${view.artistId}`;
    if (view.type === 'playlist') return `playlist-${view.playlistId}`;
    if (view.type === 'library') return `library-${view.subTab || 'all'}`;
    if (view.type === 'info') return `info-${view.pageId}`;
    return view.type;
  };

  const saveCurrentScroll = () => {
    if (mainRef.current && !isRestoringScrollRef.current) {
      const currentKey = getViewKey(currentView);
      scrollPositionsRef.current[currentKey] = mainRef.current.scrollTop;
    }
  };

  // Restore saved scroll position or reset to top on view change
  useEffect(() => {
    const currentKey = getViewKey(currentView);
    const targetScroll = scrollPositionsRef.current[currentKey] ?? 0;

    isRestoringScrollRef.current = true;

    // Use requestAnimationFrame so the target view DOM has fully painted
    const rafId = requestAnimationFrame(() => {
      if (mainRef.current) {
        mainRef.current.scrollTo({ top: targetScroll, behavior: 'instant' });
      }
      // Keep guard active briefly to prevent any immediate layout shift scroll events from overwriting
      setTimeout(() => {
        isRestoringScrollRef.current = false;
      }, 60);
    });

    prevViewKeyRef.current = currentKey;
    return () => cancelAnimationFrame(rafId);
  }, [currentView]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (isRestoringScrollRef.current) return;
    const target = e.currentTarget;
    const currentKey = getViewKey(currentView);
    scrollPositionsRef.current[currentKey] = target.scrollTop;
  };

  const navigateTo = (newView: ViewState) => {
    // If it's the exact same view, ignore (or if already on home, scroll to top smoothly)
    if (JSON.stringify(newView) === JSON.stringify(currentView)) {
      if (newView.type === 'home' && mainRef.current) {
        mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        scrollPositionsRef.current['home'] = 0;
      }
      return;
    }

    // Capture scroll of current view before leaving
    saveCurrentScroll();

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newView);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    try {
      window.history.pushState({ viewIndex: newHistory.length - 1, viewKey: getViewKey(newView) }, '');
    } catch (e) {}

    if (newView.type === 'search' && newView.initialQuery) {
      setSearchQuery(newView.initialQuery);
    }
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
      saveCurrentScroll();
      setHistoryIndex(prev => prev - 1);
      try {
        if (window.history.state && typeof window.history.state.viewIndex === 'number' && window.history.state.viewIndex > 0) {
          window.history.back();
        }
      } catch (e) {}
    } else {
      navigateTo({ type: 'home' });
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      saveCurrentScroll();
      setHistoryIndex(prev => prev + 1);
      try {
        window.history.forward();
      } catch (e) {}
    }
  };

  // Browser popstate listener for back/forward gestures and buttons
  useEffect(() => {
    try {
      if (!window.history.state || window.history.state.viewIndex === undefined) {
        window.history.replaceState({ viewIndex: 0, viewKey: 'home' }, '');
      }
    } catch (e) {}

    const handlePopState = (e: PopStateEvent) => {
      saveCurrentScroll();
      if (e.state && typeof e.state.viewIndex === 'number') {
        const targetIdx = e.state.viewIndex;
        if (targetIdx >= 0 && targetIdx < history.length) {
          setHistoryIndex(targetIdx);
        }
      } else if (historyIndex > 0) {
        setHistoryIndex(prev => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [historyIndex, history]);

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
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-neutral-950 text-neutral-100 font-sans select-none antialiased relative">
      {/* Top Workspace Area: Sidebar + Scrollable View */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Sidebar for Desktop & Tablet */}
        <Sidebar
          currentView={currentView}
          onNavigate={navigateTo}
          onOpenCreatePlaylist={() => setIsCreateMenuOpen(true)}
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

          {/* Scrollable View Container */}
          <main
            ref={mainRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden relative bg-black/20 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] md:pb-\[100px\] lg:pb-6"
          >
            {/* Preserved HomeView: Keeps DOM tree, images, and full scroll height intact across transitions */}
            <div
              className={`w-full min-h-full ${currentView.type === 'home' ? 'block' : 'hidden'}`}
              aria-hidden={currentView.type !== 'home'}
            >
              <HomeView onNavigate={navigateTo} />
            </div>

            {currentView.type === 'search' && (
              <SearchView
                searchQuery={searchQuery || currentView.initialQuery || ''}
                onSearchChange={setSearchQuery}
                onNavigate={navigateTo}
              />
            )}
            {currentView.type === 'artist' && (
              <ArtistView key={currentView.artistId} 
                artistId={currentView.artistId} 
                expectedName={currentView.expectedName} 
                initialImage={currentView.initialImage}
                onNavigate={navigateTo} 
                onGoBack={handleGoBack}
              />
            )}
            {currentView.type === 'album' && (
              <AlbumView albumId={currentView.albumId} onNavigate={navigateTo} onGoBack={handleGoBack} />
            )}
            {currentView.type === 'playlist' && (
              <PlaylistView playlistId={currentView.playlistId} onNavigate={navigateTo} onGoBack={handleGoBack} />
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
            {currentView.type === 'blend-setup' && <BlendSetupView onNavigate={navigateTo} onBack={handleGoBack} />}
            {currentView.type === 'blend-invite' && <BlendInviteView blendId={currentView.blendId} onNavigate={navigateTo} onBack={handleGoBack} />}
            {currentView.type === 'info' && <InfoView pageId={currentView.pageId} onNavigate={navigateTo} onGoBack={handleGoBack} />}
            {currentView.type === 'radio' && <RadioHubView onNavigate={navigateTo} />}
            {currentView.type === 'radio-station' && <RadioStationView stationId={currentView.stationId} stationTitle={currentView.stationTitle} onNavigate={navigateTo} />}
            {currentView.type === 'share-landing' && <ShareLandingView shareType={currentView.shareType} shareId={currentView.shareId} onNavigate={navigateTo} />}
          </main>
        </div>

        {/* Tablet / Desktop Right Sidebar Player (2026 UI) */}
        <TabletRightPlayer />
      </div>

      {/* Bottom Player: Floating pill on mobile (Hidden on Desktop/Tablet now) */}
      <MiniPlayer />

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        currentView={currentView}
        onNavigate={navigateTo}
        onOpenCreatePlaylist={() => setIsCreateMenuOpen(true)}
        isCreateMenuOpen={isCreateMenuOpen}
        onToggleCreateMenu={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
      />

      <LoginPopup onNavigate={navigateTo} />

      {/* Global Overlays & Modals */}
      <FullscreenPlayer onNavigate={navigateTo} />
      <AmbientMode onNavigate={navigateTo} />
      <LyricsDrawer />
      <QueueDrawer />
      <CreateActionMenu
        isOpen={isCreateMenuOpen}
        onClose={() => setIsCreateMenuOpen(false)}
        onSelectCreatePlaylist={(type = 'playlist') => {
          setCreatePlaylistType(type);
          setIsCreatePlaylistOpen(true);
        }}
        onNavigate={navigateTo}
      />
      
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onNavigate={navigateTo}
        type={createPlaylistType}
      />
      <ComingSoonModal
        isOpen={isComingSoonOpen}
        onClose={closeComingSoon}
        title={comingSoonTitle}
        description={comingSoonDesc}
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
          <ShareProvider>
            <AppContent />
            <ReloadPrompt />
          </ShareProvider>
        </PlayerProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
