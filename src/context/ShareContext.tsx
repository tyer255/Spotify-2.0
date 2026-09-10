import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Track } from '../types';
import { ShareSheet } from '../components/Share/ShareSheet';

interface ShareContextType {
  openShare: (track: Track) => void;
  closeShare: () => void;
}

const ShareContext = createContext<ShareContextType | undefined>(undefined);

export const ShareProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [trackToShare, setTrackToShare] = useState<Track | null>(null);

  const openShare = (track: Track) => {
    setTrackToShare(track);
  };

  const closeShare = () => {
    setTrackToShare(null);
  };

  return (
    <ShareContext.Provider value={{ openShare, closeShare }}>
      {children}
      {trackToShare && (
        <ShareSheet track={trackToShare} onClose={closeShare} />
      )}
    </ShareContext.Provider>
  );
};

export const useShare = () => {
  const context = useContext(ShareContext);
  if (!context) {
    throw new Error('useShare must be used within ShareProvider');
  }
  return context;
};
