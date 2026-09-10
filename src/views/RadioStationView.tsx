import React, { useEffect, useState, useMemo } from 'react';
import { Track, ViewState, Artist } from '../types';
import { api } from '../services/apiClient';
import { Play, Pause, Radio, Heart, MoreHorizontal, CheckCircle2, ArrowDownCircle, Info, Loader2, Shuffle, Clock } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useUser } from '../context/UserContext';
import { TrackRow } from '../components/Common/TrackRow';
import { extractColorsFromImage, ExtractedColors } from '../utils/colorExtractor';

interface RadioStationViewProps {
  stationId: string;
  stationTitle?: string;
  onNavigate: (view: ViewState) => void;
}

export const RadioStationView: React.FC<RadioStationViewProps> = ({ stationId, stationTitle, onNavigate }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [headerImages, setHeaderImages] = useState<string[]>([]);
  const [colors, setColors] = useState<ExtractedColors | null>(null);
  const [isStationLiked, setIsStationLiked] = useState(false);
  
  const { track: currentTrack, isPlaying, playTrack, togglePlay, queue } = usePlayer();
  const { 
    downloadedTrackIds, 
    downloadSingleTrack, 
    isTrackDownloaded, 
    showToast,
    playlistDownloadProgress
  } = useUser();

  const title = stationTitle || 'Radio Station';
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchRadioTracks = async () => {
      setLoading(true);
      try {
        // We simulate finding a seed track based on the station title.
        // E.g., if title is "Arijit Singh Radio", we search "Arijit Singh".
        let radioTracks: Track[] = [];
        
        let seedType: 'artist' | 'song' | 'album' = 'artist';
        let idToUse = stationId;

        // If it's a station id like "station-arijit-singh", we know it's an artist radio
        if (idToUse.startsWith('station-')) {
           seedType = 'artist';
           // Our title might be "Arijit Singh Radio", we pass seedTitle "Arijit Singh"
        } else {
           // Assume song radio if we don't have other context in current view state,
           // or we can pass it down. Currently ContextMenu passes `track.id`
           seedType = 'song';
        }

        const cleanTitle = title.replace(' Radio', '').trim();

        try {
          const radioRes = await api.getRadio(seedType, idToUse, cleanTitle);
          if (radioRes.success && radioRes.data && radioRes.data.length > 0) {
            radioTracks = radioRes.data;
            
            // Extract images for the triple-bubble header
            const uniqueImages = new Set<string>();
            for (const t of radioTracks) {
               if (t.images?.large) uniqueImages.add(t.images.large);
               else if (t.images?.medium) uniqueImages.add(t.images.medium);
               if (uniqueImages.size >= 3) break;
            }
            const imagesArray = Array.from(uniqueImages);
            if (imagesArray.length > 0) {
              setHeaderImages(imagesArray);
              extractColorsFromImage(imagesArray[0]).then(cols => {
                 if (isMounted) setColors(cols);
              });
            }
          }
        } catch (e) {
          console.warn('Radio API failed', e);
        }

        if (isMounted) {
          setTracks(radioTracks);
        }
      } catch (err) {
        console.error('Failed to load radio tracks', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchRadioTracks();
    return () => { isMounted = false; };
  }, [stationId, title]);

  const isCurrentRadioPlaying = currentTrack && queue.some(t => t.id === currentTrack.id) && isPlaying;

  const handlePlayStation = () => {
    if (tracks.length === 0) return;
    if (currentTrack && queue.some(t => tracks.find(r => r.id === t.id))) {
      togglePlay();
    } else {
      playTrack(tracks[0], tracks);
      showToast({ message: `Playing ${title}`, iconType: 'playlist' });
    }
  };

  const isDownloadingThisPlaylist = useMemo(() => {
    return !!(playlistDownloadProgress?.isDownloading && playlistDownloadProgress?.playlistId === stationId);
  }, [playlistDownloadProgress, stationId]);

  const handleDownloadAll = async () => {
    if (tracks.length === 0) return;
    showToast({
      message: `Downloading ${tracks.length} songs for offline playback`,
      iconType: 'download',
    });
    for (const tr of tracks) {
      if (!isTrackDownloaded(tr.id)) {
        await downloadSingleTrack(tr);
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-neutral-400 font-medium">Tuning into {title}...</p>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 overflow-y-auto w-full h-full transition-colors duration-700 relative"
    >
      <div 
        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen transition-colors duration-1000 z-0" 
        style={{ 
          background: colors ? `linear-gradient(to bottom, ${colors.primary} 0%, transparent 400px)` : 'transparent' 
        }}
      />
      
      {/* Header section similar to PlaylistView */}
      <div 
        className="relative pt-24 pb-8 w-full shrink-0 flex flex-col items-center justify-end"
      >
        <div className="relative z-10 w-full p-6 sm:p-10 max-w-7xl mx-auto flex flex-col items-center text-center gap-6">
          
          {/* Triple Bubble Visual */}
          <div className="relative w-full max-w-md h-48 sm:h-56 flex items-center justify-center mb-4">
            {headerImages.length >= 3 ? (
              <>
                {/* Left Bubble */}
                <div className="absolute left-4 sm:left-8 w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-2xl border-4 border-neutral-900 z-10 transform -rotate-6">
                  <img src={headerImages[1]} alt="" className="w-full h-full object-cover" />
                </div>
                {/* Right Bubble */}
                <div className="absolute right-4 sm:right-8 w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-2xl border-4 border-neutral-900 z-10 transform rotate-6">
                  <img src={headerImages[2]} alt="" className="w-full h-full object-cover" />
                </div>
                {/* Center Bubble (Largest) */}
                <div className="absolute z-20 w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-neutral-900">
                  <img src={headerImages[0]} alt="" className="w-full h-full object-cover" />
                </div>
              </>
            ) : headerImages.length > 0 ? (
              <div className="z-20 w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden shadow-2xl border-4 border-neutral-900">
                <img src={headerImages[0]} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="z-20 w-48 h-48 sm:w-56 sm:h-56 rounded-full shadow-2xl flex items-center justify-center bg-neutral-800 border-4 border-neutral-900">
                <Radio className="w-24 h-24 text-neutral-500" />
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-3 items-center">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight drop-shadow-md text-center max-w-3xl">
              {title}
            </h1>
            
            <p className="text-neutral-300 text-sm sm:text-base font-medium max-w-2xl opacity-90 text-center">
              Made for you
            </p>
            
            <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-400 mt-1">
              <span className="font-medium text-emerald-500">Spotiz</span>
              <span>•</span>
              <span>{tracks.length} songs</span>
              <span>•</span>
              <span>About {Math.round(tracks.reduce((acc, t) => acc + (t.duration || 0), 0) / 60)} min</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-10 max-w-7xl mx-auto relative z-10">
        {/* Actions bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              className="w-12 h-12 rounded-md overflow-hidden bg-neutral-800 flex items-center justify-center border border-white/10"
              title="Station Cover"
            >
              {headerImages.length > 0 ? (
                 <img src={headerImages[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                 <Radio className="w-6 h-6 text-neutral-400" />
              )}
            </button>
            <button
              onClick={() => {
                setIsStationLiked(!isStationLiked);
                showToast({ message: !isStationLiked ? 'Saved to Your Library' : 'Removed from Your Library', iconType: !isStationLiked ? 'liked' : 'unliked' });
              }}
              className={`p-3 rounded-full hover:bg-white/10 transition-all cursor-pointer ${
                isStationLiked ? 'text-red-500 fill-red-500' : 'text-neutral-400 hover:text-white'
              }`}
              title={isStationLiked ? "Unlike station" : "Like station"}
            >
              <Heart className={`w-7 h-7 transition-transform ${isStationLiked ? 'text-red-500 fill-red-500 scale-105' : ''}`} />
            </button>
            <button
              onClick={handleDownloadAll}
              disabled={tracks.length === 0 || isDownloadingThisPlaylist}
              className="p-3 rounded-full hover:bg-white/10 transition-colors text-neutral-400 hover:text-white disabled:opacity-50"
              title="Download Station"
            >
              {isDownloadingThisPlaylist ? (
                <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
              ) : (
                <ArrowDownCircle className="w-7 h-7" />
              )}
            </button>
            <button
              className="p-3 rounded-full hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
            >
              <MoreHorizontal className="w-7 h-7" />
            </button>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              className="p-3 rounded-full hover:bg-white/10 transition-colors text-emerald-500"
            >
              <Shuffle className="w-7 h-7" />
            </button>
            <button
              onClick={handlePlayStation}
              disabled={tracks.length === 0}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
            >
              {isCurrentRadioPlaying ? (
                <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-black" />
              ) : (
                <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-black ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Tracks list */}
        {tracks.length > 0 ? (
          <div className="space-y-1">
            <div className="hidden sm:grid grid-cols-[minmax(0,6fr)_minmax(0,4fr)_84px_40px] items-center gap-4 text-xs font-semibold uppercase tracking-wider text-neutral-400 px-3 pb-2 border-b border-white/5 mb-2 select-none">
              <div className="flex items-center">
                <span className="ml-[52px]">Title</span>
              </div>
              <div className="flex items-center">
                <span>Album</span>
              </div>
              <div className="flex items-center justify-end pr-1">
                <Clock className="w-4 h-4" />
              </div>
              <div></div>
            </div>
            {tracks.map((track, idx) => (
              <TrackRow
                key={`${track.id}-${idx}`}
                track={track}
                index={idx}
                queueContext={tracks}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
            <Radio className="w-12 h-12 text-neutral-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No tracks found</h3>
            <p className="text-neutral-400 text-sm max-w-sm">
              We couldn't generate a station for this seed right now. Please try another one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
