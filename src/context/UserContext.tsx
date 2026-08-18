import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, Track, Playlist, Artist } from '../types';
import { api } from '../services/apiClient';

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  likedTrackIds: Set<string>;
  followedArtistIds: Set<string>;
  downloadedTrackIds: Set<string>;
  downloadingProgress: Record<string, number>;
  isDownloadingTrack: (trackId: string) => boolean;
  getTrackDownloadProgress: (trackId: string) => number | undefined;
  playlists: Playlist[];
  toggleLikeTrack: (track: Track) => Promise<boolean>;
  isTrackLiked: (trackId: string) => boolean;
  toggleFollowArtist: (artist: Artist | { id: string; name: string }) => Promise<boolean>;
  isArtistFollowed: (artistId: string) => boolean;
  toggleDownloadTrack: (track: Track) => Promise<boolean>;
  isTrackDownloaded: (trackId: string) => boolean;
  createPlaylist: (title: string, description?: string, coverImage?: string) => Promise<Playlist | null>;
  updatePlaylist: (id: string, updates: { title?: string; description?: string; coverImage?: string }) => Promise<boolean>;
  deletePlaylist: (id: string) => Promise<boolean>;
  addTrackToPlaylist: (playlistId: string, track: Track) => Promise<boolean>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<boolean>;
  reorderPlaylist: (playlistId: string, trackIds: string[]) => Promise<boolean>;
  updateProfile: (name: string, username: string, avatar: string) => Promise<boolean>;
  updateProfileName: (name: string) => Promise<boolean>;
  updateProfileAvatar: (avatarUrl: string) => Promise<boolean>;
  removeProfileAvatar: () => Promise<boolean>;
  updateSettings: (newSettings: Partial<UserProfile['settings']>) => Promise<boolean>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  downloadedTracksList: Track[];
  clearAllDownloads: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [followedArtistIds, setFollowedArtistIds] = useState<Set<string>>(new Set());
  const [downloadedTrackIds, setDownloadedTrackIds] = useState<Set<string>>(new Set());
  const [downloadedTracksMap, setDownloadedTracksMap] = useState<Record<string, Track>>({});
  const [downloadingProgress, setDownloadingProgress] = useState<Record<string, number>>({});
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Fetch initial profile & data
  const loadProfile = async () => {
    setLoading(true);
    let guestAvatar = '';
    let guestName = 'Your Name';
    // Hydrate from localStorage first for instantaneous UI
    try {
      guestAvatar = localStorage.getItem('spotify_guest_avatar') || '';
      guestName = localStorage.getItem('spotify_guest_name') || 'Your Name';
      const savedPl = localStorage.getItem('spotify_user_playlists');
      if (savedPl) {
        setPlaylists(JSON.parse(savedPl));
      }
      const savedLiked = localStorage.getItem('spotify_liked_tracks');
      if (savedLiked) {
        setLikedTrackIds(new Set(JSON.parse(savedLiked)));
      }

      // Initial instantaneous guest profile
      setProfile({
        id: 'guest-user',
        name: guestName,
        username: 'user',
        email: '',
        avatar: guestAvatar,
        subscription: 'Spotify Premium',
        followersCount: 0,
        followingCount: 0,
        likedTrackIds: [],
        savedAlbumIds: [],
        followedArtistIds: [],
        playlists: savedPl ? JSON.parse(savedPl) : [],
        downloadedTrackIds: [],
        recentHistory: [],
        settings: {
          theme: 'dark',
          accentColor: '#1DB954',
          audioQuality: 'very_high',
          crossfadeDuration: 4,
          gaplessPlayback: true,
          normalizeVolume: true,
          equalizerPreset: 'electronic',
          downloadWifiOnly: true,
          privateSession: false,
          autoPlaySimilar: true,
        },
      });
    } catch (e) {}

    try {
      const res = await api.getProfile();
      if (res.success && res.data) {
        const isGuest = !res.data.email || res.data.id === 'guest-user' || res.data.id === 'user-default-1';
        const finalProfile: UserProfile = {
          ...res.data,
          subscription: 'Spotify Premium',
          name: isGuest && guestName ? guestName : res.data.name || 'Your Name',
          avatar: isGuest && guestAvatar ? guestAvatar : (isGuest ? '' : res.data.avatar || ''),
          email: isGuest ? '' : res.data.email,
          followersCount: isGuest ? 0 : res.data.followersCount || 0,
          followingCount: isGuest ? 0 : res.data.followingCount || 0,
        };

        setProfile(finalProfile);
        if (res.data.likedTrackIds && res.data.likedTrackIds.length > 0) {
          setLikedTrackIds(new Set(res.data.likedTrackIds));
          localStorage.setItem('spotify_liked_tracks', JSON.stringify(res.data.likedTrackIds));
        }
        setFollowedArtistIds(new Set(res.data.followedArtistIds || []));
        // Downloads are device-specific, we ignore the server's list and rely on localStorage
        if (res.data.playlists && res.data.playlists.length > 0) {
          setPlaylists(res.data.playlists);
          localStorage.setItem('spotify_user_playlists', JSON.stringify(res.data.playlists));
        }
      }
    } catch (e) {
      console.warn('Failed to load profile:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // Load local offline tracks cache
    try {
      const savedDownloads = localStorage.getItem('spotify_offline_tracks');
      if (savedDownloads) {
        const parsed = JSON.parse(savedDownloads);
        setDownloadedTracksMap(parsed);
        setDownloadedTrackIds(new Set(Object.keys(parsed)));
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('spotify_user_playlists', JSON.stringify(playlists));
    } catch (e) {}
  }, [playlists]);

  const isTrackLiked = useCallback((trackId: string) => likedTrackIds.has(trackId), [likedTrackIds]);
  const isArtistFollowed = useCallback((artistId: string) => followedArtistIds.has(artistId), [followedArtistIds]);
  const isTrackDownloaded = useCallback((trackId: string) => downloadedTrackIds.has(trackId), [downloadedTrackIds]);
  const isDownloadingTrack = useCallback((trackId: string) => downloadingProgress[trackId] !== undefined, [downloadingProgress]);
  const getTrackDownloadProgress = useCallback((trackId: string) => downloadingProgress[trackId], [downloadingProgress]);

  const toggleLikeTrack = async (track: Track): Promise<boolean> => {
    const wasLiked = likedTrackIds.has(track.id);
    const newSet = new Set(likedTrackIds);
    if (wasLiked) {
      newSet.delete(track.id);
      showToast(`Removed from your Liked Songs`);
    } else {
      newSet.add(track.id);
      showToast(`Added to your Liked Songs`);
    }
    setLikedTrackIds(newSet);
    localStorage.setItem('spotify_liked_tracks', JSON.stringify(Array.from(newSet)));

    try {
      await api.toggleLikeTrack(track.id);
      return !wasLiked;
    } catch (e) {
      // Revert if failed
      setLikedTrackIds(likedTrackIds);
      localStorage.setItem('spotify_liked_tracks', JSON.stringify(Array.from(likedTrackIds)));
      return wasLiked;
    }
  };

  const toggleFollowArtist = async (artist: Artist | { id: string; name: string }): Promise<boolean> => {
    const wasFollowed = followedArtistIds.has(artist.id);
    const newSet = new Set(followedArtistIds);
    if (wasFollowed) {
      newSet.delete(artist.id);
      showToast(`Unfollowed ${artist.name}`);
    } else {
      newSet.add(artist.id);
      showToast(`Following ${artist.name}`);
    }
    setFollowedArtistIds(newSet);

    try {
      await api.toggleFollowArtist(artist.id);
      return !wasFollowed;
    } catch (e) {
      setFollowedArtistIds(followedArtistIds);
      return wasFollowed;
    }
  };

  const toggleDownloadTrack = async (track: Track): Promise<boolean> => {
    const wasDownloaded = downloadedTrackIds.has(track.id);
    const newSet = new Set(downloadedTrackIds);
    const newMap = { ...downloadedTracksMap };

    if (wasDownloaded) {
      newSet.delete(track.id);
      delete newMap[track.id];
      showToast(`Removed from offline downloads`);
      
      // Clean up the cache if possible
      if ('caches' in window && track.streamUrl) {
        try {
          const cache = await caches.open('spotify-offline-audio');
          await cache.delete(track.streamUrl);
        } catch (e) {
          // ignore
        }
      }
    } else {
      // Start download with visual progress
      setDownloadingProgress((prev) => ({ ...prev, [track.id]: 12 }));
      showToast(`Downloading "${track.title}" for offline...`);
      
      let playableUrl = track.streamUrl || '';
      try {
        // Step 1: Resolve best playback URL
        const resolveRes = await api.resolvePlayback(track.id, track.title, track.artist, track.duration);
        if (resolveRes.success && resolveRes.data?.stream?.url) {
          playableUrl = resolveRes.data.stream.url;
        }
        setDownloadingProgress((prev) => ({ ...prev, [track.id]: 28 }));

        if (playableUrl && 'caches' in window) {
          const cache = await caches.open('spotify-offline-audio');
          setDownloadingProgress((prev) => ({ ...prev, [track.id]: 38 }));

          // Step 2: Fetch and cache audio stream with streaming progress
          try {
            const response = await fetch(playableUrl, { mode: 'cors' }).catch(() => fetch(playableUrl, { mode: 'no-cors' }));
            if (response && (response.ok || response.type === 'opaque')) {
              if (response.type !== 'opaque' && response.body) {
                const contentLength = +(response.headers.get('Content-Length') || 0);
                if (contentLength > 0) {
                  const reader = response.body.getReader();
                  let received = 0;
                  const chunks: Uint8Array[] = [];
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) {
                      chunks.push(value);
                      received += value.length;
                      const percent = Math.min(90, Math.round(38 + (received / contentLength) * 52));
                      setDownloadingProgress((prev) => ({ ...prev, [track.id]: percent }));
                    }
                  }
                  const blob = new Blob(chunks, { type: response.headers.get('Content-Type') || 'audio/mpeg' });
                  const fullResponse = new Response(blob, {
                    headers: response.headers,
                    status: response.status,
                    statusText: response.statusText,
                  });
                  await cache.put(playableUrl, fullResponse);
                } else {
                  setDownloadingProgress((prev) => ({ ...prev, [track.id]: 55 }));
                  await new Promise(r => setTimeout(r, 180));
                  setDownloadingProgress((prev) => ({ ...prev, [track.id]: 78 }));
                  await new Promise(r => setTimeout(r, 180));
                  setDownloadingProgress((prev) => ({ ...prev, [track.id]: 90 }));
                  await cache.put(playableUrl, response.clone());
                }
              } else {
                setDownloadingProgress((prev) => ({ ...prev, [track.id]: 60 }));
                await new Promise(r => setTimeout(r, 180));
                setDownloadingProgress((prev) => ({ ...prev, [track.id]: 85 }));
                await cache.put(playableUrl, response.clone());
              }
              // Store the resolved, cached URL with the track
              track = { ...track, streamUrl: playableUrl };
            }
          } catch (fetchErr) {
            console.warn('Audio caching note:', fetchErr);
          }
          
          // Step 3: Prefetch and cache artwork images
          setDownloadingProgress((prev) => ({ ...prev, [track.id]: 96 }));
          if (track.images) {
            await Promise.allSettled(
              Object.values(track.images).map(url => url ? fetch(url, { mode: 'no-cors' }) : Promise.resolve())
            );
          }
        }

        // Finalize download
        newSet.add(track.id);
        newMap[track.id] = track;
        setDownloadingProgress((prev) => ({ ...prev, [track.id]: 100 }));
        showToast(`Downloaded "${track.title}" for offline use`);

        // Graceful transition from 100% to downloaded icon
        await new Promise(r => setTimeout(r, 500));
        setDownloadingProgress((prev) => {
          const next = { ...prev };
          delete next[track.id];
          return next;
        });
      } catch (err) {
        console.warn('Failed to cache audio:', err);
        setDownloadingProgress((prev) => {
          const next = { ...prev };
          delete next[track.id];
          return next;
        });
        showToast(`Download failed for offline playback`);
        return false;
      }
    }

    setDownloadedTrackIds(newSet);
    setDownloadedTracksMap(newMap);
    localStorage.setItem('spotify_offline_tracks', JSON.stringify(newMap));

    try {
      await api.toggleDownloadTrack(track.id);
      return !wasDownloaded;
    } catch (e) {
      return !wasDownloaded;
    }
  };

  const createPlaylist = async (title: string, description?: string, coverImage?: string): Promise<Playlist | null> => {
    try {
      const res = await api.createPlaylist(title, description, coverImage);
      if (res.success && res.data) {
        setPlaylists((prev) => [res.data, ...prev]);
        showToast(`Created playlist "${title}"`);
        return res.data;
      }
    } catch (e) {
      showToast(`Failed to create playlist`);
    }
    return null;
  };

  const updatePlaylist = async (id: string, updates: { title?: string; description?: string; coverImage?: string }): Promise<boolean> => {
    try {
      const res = await api.updatePlaylist(id, updates);
      if (res.success && res.data) {
        setPlaylists((prev) => prev.map((p) => (p.id === id ? res.data : p)));
        showToast(`Playlist updated`);
        return true;
      }
    } catch (e) {
      showToast(`Failed to update playlist`);
    }
    return false;
  };

  const deletePlaylist = async (id: string): Promise<boolean> => {
    try {
      const res = await api.deletePlaylist(id);
      if (res.success) {
        setPlaylists((prev) => prev.filter((p) => p.id !== id));
        showToast(`Playlist deleted`);
        return true;
      }
    } catch (e) {
      showToast(`Failed to delete playlist`);
    }
    return false;
  };

  const addTrackToPlaylist = async (playlistId: string, track: Track): Promise<boolean> => {
    try {
      const res = await api.addTrackToPlaylist(playlistId, track.id);
      if (res.success && res.data) {
        setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? res.data : p)));
        showToast(`Added to playlist "${res.data.title}"`);
        return true;
      }
    } catch (e) {
      showToast(`Failed to add track to playlist`);
    }
    return false;
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string): Promise<boolean> => {
    try {
      const res = await api.removeTrackFromPlaylist(playlistId, trackId);
      if (res.success && res.data) {
        setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? res.data : p)));
        showToast(`Removed from playlist`);
        return true;
      }
    } catch (e) {
      showToast(`Failed to remove track`);
    }
    return false;
  };

  const reorderPlaylist = async (playlistId: string, trackIds: string[]): Promise<boolean> => {
    try {
      const res = await api.reorderPlaylistTracks(playlistId, trackIds);
      if (res.success && res.data) {
        setPlaylists((prev) => prev.map((p) => (p.id === playlistId ? res.data : p)));
        return true;
      }
    } catch (e) {
      // Handle silently
    }
    return false;
  };

  const updateProfile = async (name: string, username: string, avatar: string): Promise<boolean> => {
    try {
      if (name) localStorage.setItem('spotify_guest_name', name);
      if (avatar !== undefined) localStorage.setItem('spotify_guest_avatar', avatar);
      setProfile((prev) => (prev ? { ...prev, name, username, avatar } : null));

      const res = await api.updateProfile({ name, username, avatar });
      if (res.success && res.data) {
        setProfile((prev) => ({
          ...res.data,
          avatar: avatar || res.data.avatar || '',
          name: name || res.data.name || 'Your Name',
          email: (!res.data.email || res.data.id === 'guest-user') ? '' : res.data.email,
        }));
        showToast(`Profile updated successfully`);
        return true;
      }
    } catch (e) {
      showToast(`Profile updated locally`);
      return true;
    }
    return true;
  };

  const updateProfileName = async (name: string): Promise<boolean> => {
    if (!profile) return false;
    try {
      localStorage.setItem('spotify_guest_name', name);
      setProfile((prev) => (prev ? { ...prev, name } : null));
      showToast(`Profile name updated`);
      api.updateProfile({ name }).catch(() => {});
      return true;
    } catch (e) {
      return false;
    }
  };

  const updateProfileAvatar = async (avatarUrl: string): Promise<boolean> => {
    try {
      localStorage.setItem('spotify_guest_avatar', avatarUrl);
      setProfile((prev) => (prev ? { ...prev, avatar: avatarUrl } : null));
      showToast(`Profile photo updated`);
      api.updateProfile({ avatar: avatarUrl }).catch(() => {});
      return true;
    } catch (e) {
      showToast(`Failed to update profile photo`);
      return false;
    }
  };

  const removeProfileAvatar = async (): Promise<boolean> => {
    try {
      localStorage.removeItem('spotify_guest_avatar');
      setProfile((prev) => (prev ? { ...prev, avatar: '' } : null));
      showToast(`Profile photo removed`);
      api.updateProfile({ avatar: '' }).catch(() => {});
      return true;
    } catch (e) {
      return false;
    }
  };

  const clearAllDownloads = () => {
    setDownloadedTrackIds(new Set());
    setDownloadedTracksMap({});
    localStorage.removeItem('spotify_offline_tracks');
    
    if ('caches' in window) {
      caches.delete('spotify-offline-audio').catch(() => {});
    }
    
    showToast('Offline downloads cleared');
  };

  const updateSettings = async (newSettings: Partial<UserProfile['settings']>): Promise<boolean> => {
    try {
      const res = await api.updateProfile({ settings: newSettings });
      if (res.success && res.data) {
        setProfile(res.data);
        showToast(`Settings saved`);
        return true;
      }
    } catch (e) {
      showToast(`Failed to save settings`);
    }
    return false;
  };

  return (
    <UserContext.Provider
      value={{
        profile,
        loading,
        likedTrackIds,
        followedArtistIds,
        downloadedTrackIds,
        downloadingProgress,
        isDownloadingTrack,
        getTrackDownloadProgress,
        playlists,
        toggleLikeTrack,
        isTrackLiked,
        toggleFollowArtist,
        isArtistFollowed,
        toggleDownloadTrack,
        isTrackDownloaded,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        reorderPlaylist,
        updateProfile,
        updateProfileName,
        updateProfileAvatar,
        removeProfileAvatar,
        updateSettings,
        toastMessage,
        showToast,
        downloadedTracksList: Object.values(downloadedTracksMap),
        clearAllDownloads,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
