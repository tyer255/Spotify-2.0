import React, { useEffect, useState } from 'react';
import { ShareType } from '../components/Share/ShareSheet';
import { api } from '../services/apiClient';
import { Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { ViewState, Track } from '../types';
import { SongShareCard } from '../components/Share/SongShareCard';
import { LyricsShareCard } from '../components/Share/LyricsShareCard';

interface ShareLandingViewProps {
  shareId: string;
  shareType: ShareType;
  onNavigate: (view: ViewState) => void;
}

export const ShareLandingView: React.FC<ShareLandingViewProps> = ({ shareId, shareType, onNavigate }) => {
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { playTrack } = usePlayer();

  useEffect(() => {
    api.getShareRecord(shareId).then(res => {
      if (res.success && res.data) {
        setRecord(res.data);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [shareId]);

  const handleOpenInApp = () => {
    if (record) {
       api.getTrack(record.songId).then(res => {
         if (res.success && res.data) {
           playTrack(res.data, [res.data]);
         }
       });
       onNavigate({ type: 'home' });
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-6">
        <h2 className="text-2xl font-bold mb-2">Link Expired or Invalid</h2>
        <p className="text-neutral-400 mb-6">This share link is no longer available.</p>
        <button onClick={() => onNavigate({ type: 'home' })} className="px-6 py-3 bg-white text-black font-bold rounded-full">
          Go Home
        </button>
      </div>
    );
  }

  const dummyTrack: Track = {
    id: record.songId || 'shared-track',
    title: record.title || 'Unknown Title',
    artist: record.artist || 'Unknown Artist',
    artistId: 'shared-artist',
    album: record.album || '',
    albumId: 'shared-album',
    duration: record.duration || 0,
    images: {
      small: record.artwork || '',
      medium: record.artwork || '',
      large: record.artwork || '',
    },
    playbackAvailability: true,
    streamUrl: '',
    mimeType: 'audio/mp4',
    provider: 'spotify',
  };

  return (
    <div className="w-full h-full min-h-full flex flex-col bg-[#121212] pt-16 items-center justify-center px-4">
      <div className="flex flex-col items-center justify-center max-w-sm w-full">
        {/* Render Authentic Spotify-style Card */}
        {record.type === 'song' ? (
          <SongShareCard
            track={dummyTrack}
            style="default"
            background="linear-gradient(180deg, #1e292b 0%, #121415 85%)"
          />
        ) : (
          <LyricsShareCard
            track={dummyTrack}
            lyrics={record.lyrics || ''}
            style="default"
            background="linear-gradient(180deg, #1e292b 0%, #121415 85%)"
            hasLyrics={true}
          />
        )}

        <div className="mt-8 w-full max-w-[285px] flex flex-col items-center gap-3">
          <button 
            onClick={handleOpenInApp}
            className="w-full py-3.5 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-base rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5"
          >
            <Play className="fill-black w-4 h-4" />
            Play on Spotiz
          </button>
        </div>
      </div>
    </div>
  );
};
