import React, { useState, useEffect, useRef } from 'react';
import { ViewState } from '../types';
import { SettingsPage } from './Settings/types';
import { SettingsHome } from './Settings/SettingsHome';
import { SettingsSearch } from './Settings/SettingsSearch';
import {
  AccountSettings,
  ContentDisplaySettings,
  PrivacySocialSettings,
  PlaybackSettings,
  NotificationsSettings,
  AppsDevicesSettings,
  DataOfflineSettings,
  MediaQualitySettings,
  AdvertisementsSettings,
  HideSongsSettings,
  AboutSupportSettings
} from './Settings/SettingsSubpages';

interface SettingsViewProps {
  onNavigate: (view: ViewState) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigate }) => {
  const [currentPage, setCurrentPage] = useState<SettingsPage>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const homeScrollRef = useRef<number>(0);

  // Scroll to top immediately whenever subpage or search changes
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const mainEl = document.querySelector('main');
      if (mainEl) {
        if (currentPage !== 'home') {
          mainEl.scrollTo({ top: 0, behavior: 'instant' });
          mainEl.scrollTop = 0;
        } else {
          // Returning to home: restore saved home scroll or top
          const target = homeScrollRef.current || 0;
          mainEl.scrollTo({ top: target, behavior: 'instant' });
        }
      }
    };

    scrollToTop();
    const rafId = requestAnimationFrame(scrollToTop);
    const timeoutId = setTimeout(scrollToTop, 50);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [currentPage, isSearching]);

  const handleNavigateSubpage = (page: SettingsPage) => {
    const mainEl = document.querySelector('main');
    if (mainEl && currentPage === 'home') {
      homeScrollRef.current = mainEl.scrollTop;
    }
    setCurrentPage(page);
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
  };

  if (isSearching) {
    return (
      <SettingsSearch
        query={searchQuery}
        setQuery={setSearchQuery}
        onClose={() => {
          setIsSearching(false);
          setSearchQuery('');
        }}
        onNavigate={(page) => {
          handleNavigateSubpage(page);
          setIsSearching(false);
          setSearchQuery('');
        }}
      />
    );
  }

  switch (currentPage) {
    case 'home':
      return (
        <SettingsHome 
          onNavigate={handleNavigateSubpage} 
          onGlobalBack={() => onNavigate({ type: 'home' })} 
          onSearch={() => setIsSearching(true)}
        />
      );
    case 'account':
      return <AccountSettings onBack={handleBackToHome} />;
    case 'content-display':
      return <ContentDisplaySettings onBack={handleBackToHome} />;
    case 'privacy':
      return <PrivacySocialSettings onBack={handleBackToHome} />;
    case 'playback':
      return <PlaybackSettings onBack={handleBackToHome} />;
    case 'notifications':
      return <NotificationsSettings onBack={handleBackToHome} />;
    case 'apps-devices':
      return <AppsDevicesSettings onBack={handleBackToHome} />;
    case 'data-saving':
      return <DataOfflineSettings onBack={handleBackToHome} />;
    case 'media-quality':
      return <MediaQualitySettings onBack={handleBackToHome} />;
    case 'advertisements':
      return <AdvertisementsSettings onBack={handleBackToHome} />;
    case 'hide-songs':
      return <HideSongsSettings onBack={handleBackToHome} />;
    case 'about':
      return <AboutSupportSettings onBack={handleBackToHome} onNavigate={onNavigate} />;
    default:
      return (
        <SettingsHome 
          onNavigate={handleNavigateSubpage} 
          onGlobalBack={() => onNavigate({ type: 'home' })} 
          onSearch={() => setIsSearching(true)}
        />
      );
  }
};
