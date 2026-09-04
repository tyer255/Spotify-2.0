import { auth, db, loginWithGoogle, logout } from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, writeBatch, query, where, deleteDoc } from 'firebase/firestore';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, Track, Playlist, Artist, InteractionStats, RecentSearchItem } from '../types';
import { api } from '../services/apiClient';
import { isArtistAliasMatch, normalizeSearchString } from '../utils/searchRanker';
import { offlineStorage } from '../services/offlineStorage';

export interface ToastData {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  thumbnail?: string;
  iconType?: 'liked' | 'unliked' | 'playlist' | 'download' | 'artist' | 'auth' | 'info';
  customIcon?: React.ReactNode;
}

export interface SavedAccount {
  uid: string;
  email: string;
  name: string;
  avatar: string;
}

interface UserContextType {
  profile: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  login: () => Promise<void>;
  logoutUser: () => Promise<void>;
  savedAccounts: SavedAccount[];
  switchAccount: (email: string) => Promise<void>;
  addAccount: () => Promise<void>;
  removeSavedAccount: (email: string) => void;
  loading: boolean;
  likedTrackIds: Set<string>;
  likedTracksList: Track[];
  followedArtistIds: Set<string>;
  followedArtistsList: Artist[];
  followedArtistsMap: Record<string, Artist>;
  downloadedTrackIds: Set<string>;
  downloadingProgress: Record<string, number>;
  isDownloadingTrack: (trackId: string) => boolean;
  getTrackDownloadProgress: (trackId: string) => number | undefined;
  playlists: Playlist[];
  toggleLikeTrack: (track: Track) => Promise<boolean>;
  isTrackLiked: (trackId: string) => boolean;
  toggleFollowArtist: (artist: Artist | { id: string; name: string; image?: string; [key: string]: any }) => Promise<boolean>;
  isArtistFollowed: (artistIdOrName: string) => boolean;
  toggleDownloadTrack: (track: Track) => Promise<boolean>;
  isTrackDownloaded: (trackId: string) => boolean;
  createPlaylist: (
    title: string, 
    description?: string, 
    coverImage?: string, 
    initialTracks?: Track[],
    options?: { isCollaborative?: boolean; isBlend?: boolean; collaborators?: any[]; blendParticipants?: any[] }
  ) => Promise<Playlist | null>;
  joinBlend: (playlistId: string) => Promise<Playlist | null>;
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
  toastData: ToastData | null;
  showToast: (msg: string | ToastData, options?: Partial<ToastData>) => void;
  hideToast: () => void;
  isComingSoonOpen: boolean;
  comingSoonTitle: string;
  comingSoonDesc: string;
  showComingSoon: (title?: string, desc?: string) => void;
  closeComingSoon: () => void;
  downloadedTracksList: Track[];
  clearAllDownloads: () => void;
  addTrackToHistory: (track: Track) => void;
  removeTrackFromHistory: (trackId: string) => void;
  clearListeningHistory: () => void;
  recentSearches: RecentSearchItem[];
  addRecentSearch: (item: RecentSearchItem) => void;
  removeRecentSearch: (id: string) => void;
  clearRecentSearches: () => void;
  recordInteraction: (type: 'play' | 'skip' | 'replay' | 'search_selection', trackId: string, artistName?: string, query?: string, track?: Track) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => {
    try {
      const saved = localStorage.getItem('spotify_saved_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authResolved, setAuthResolved] = useState<boolean>(false);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [likedTracksMap, setLikedTracksMap] = useState<Record<string, Track>>({});
  const [followedArtistIds, setFollowedArtistIds] = useState<Set<string>>(new Set());
  const [followedArtistsMap, setFollowedArtistsMap] = useState<Record<string, Artist>>({});
  const [downloadedTrackIds, setDownloadedTrackIds] = useState<Set<string>>(new Set());
  const [downloadedTracksMap, setDownloadedTracksMap] = useState<Record<string, Track>>({});
  const [downloadingProgress, setDownloadingProgress] = useState<Record<string, number>>({});
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastData, setToastData] = useState<ToastData | null>(null);
  const toastTimerRef = React.useRef<any>(null);
  const [isComingSoonOpen, setIsComingSoonOpen] = useState<boolean>(false);
  const [comingSoonTitle, setComingSoonTitle] = useState<string>('Coming Soon');
  const [comingSoonDesc, setComingSoonDesc] = useState<string>(
    'Live Radio stations and personalized smart radio broadcasts will be available soon.'
  );

  const followedArtistsList = useMemo(() => {
    return Object.values(followedArtistsMap);
  }, [followedArtistsMap]);

  const showComingSoon = useCallback((title: string = 'Coming Soon', desc?: string) => {
    setComingSoonTitle(title);
    setComingSoonDesc(
      desc || 'Live Radio stations and personalized smart radio broadcasts will be available soon.'
    );
    setIsComingSoonOpen(true);
  }, []);

  const closeComingSoon = useCallback(() => {
    setIsComingSoonOpen(false);
  }, []);

  const login = async () => {
    await loginWithGoogle();
  };

  const switchAccount = async (email: string) => {
    try {
      await logout();
      await loginWithGoogle(false, email);
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        console.log("Switch account cancelled by user.");
      } else {
        console.error("Error switching account", error);
      }
    }
  };

  const addAccount = async () => {
    try {
      await loginWithGoogle(true);
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user') {
        console.log("Add account cancelled by user.");
      } else {
        console.error("Error adding account", error);
      }
    }
  };

  const removeSavedAccount = (email: string) => {
    setSavedAccounts(prev => {
      const updated = prev.filter(a => a.email !== email);
      localStorage.setItem('spotify_saved_accounts', JSON.stringify(updated));
      return updated;
    });
  };

  const logoutUser = async () => {
    await logout();
  };

  useEffect(() => {
    if (firebaseUser && profile) {
      setSavedAccounts(prev => {
        const existing = prev.filter(a => a.email !== firebaseUser.email);
        const newAccounts = [
          ...existing,
          {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: profile.name || firebaseUser.email?.split('@')[0] || '',
            avatar: profile.avatar || firebaseUser.photoURL || ''
          }
        ];
        localStorage.setItem('spotify_saved_accounts', JSON.stringify(newAccounts));
        return newAccounts;
      });
    }
  }, [firebaseUser, profile]);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubs.forEach(unsub => unsub());
      unsubs = [];

      if (user && user.providerData.some(p => p.providerId === 'password') && !user.emailVerified) {
        return; // Ignore unverified users
      }
      setFirebaseUser(user);
      if (user) {
        setLoading(true); // Wait for firebase fetch
        setLikedTrackIds(new Set());
        setLikedTracksMap({});
        setFollowedArtistIds(new Set());
        setFollowedArtistsMap({});
        setPlaylists([]);
        
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        // --- DATA MIGRATION FROM LOCALSTORAGE TO FIRESTORE ---
        let hasMigratedLocalData = false;
        try {
          if (localStorage.getItem('spotify_migrated_to_firestore') !== 'true') {
            const batch = writeBatch(db);
            let needsCommit = false;
            
            // Migrate recent history & stats
            let historyToSave = [];
            let statsToSave = { trackPlays: {}, artistPlays: {}, searchSelections: {}, skips: {}, replays: {}, trackCache: {} };
            
            try {
              const localHistory = localStorage.getItem('spotify_recent_history');
              if (localHistory) historyToSave = JSON.parse(localHistory);
            } catch(e) {}
            
            try {
              const localStats = localStorage.getItem('spotify_interaction_stats');
              if (localStats) statsToSave = JSON.parse(localStats);
            } catch(e) {}
            
            // Update or Create the main user doc
            batch.set(userRef, {
              id: user.uid,
              name: userSnap.exists() ? userSnap.data().name : (user.displayName || localStorage.getItem('spotify_guest_name') || 'Your Name'),
              email: userSnap.exists() ? userSnap.data().email : (user.email || ''),
              avatar: userSnap.exists() ? userSnap.data().avatar : (user.photoURL || localStorage.getItem('spotify_guest_avatar') || ''),
              recentHistory: userSnap.exists() && userSnap.data().recentHistory?.length ? userSnap.data().recentHistory : historyToSave,
              interactionStats: userSnap.exists() && Object.keys(userSnap.data().interactionStats?.trackPlays || {}).length ? userSnap.data().interactionStats : statsToSave,
              createdAt: userSnap.exists() ? userSnap.data().createdAt : new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
            needsCommit = true;

            // Migrate Liked Tracks
            try {
              const localLikedData = localStorage.getItem('spotify_liked_tracks_data');
              if (localLikedData) {
                const parsedLikedData = JSON.parse(localLikedData);
                for (const trackId of Object.keys(parsedLikedData)) {
                  const trackRef = doc(db, 'users', user.uid, 'likedTracks', trackId);
                  batch.set(trackRef, { trackId, trackData: parsedLikedData[trackId], createdAt: new Date().toISOString() }, { merge: true });
                  needsCommit = true;
                }
              }
            } catch(e) {}

            // Migrate Followed Artists
            try {
              const localFollowedData = localStorage.getItem('spotify_followed_artists_data');
              if (localFollowedData) {
                const parsedFollowedData = JSON.parse(localFollowedData);
                for (const artistId of Object.keys(parsedFollowedData)) {
                  const artistRef = doc(db, 'users', user.uid, 'followedArtists', artistId);
                  batch.set(artistRef, { artistId, artistData: parsedFollowedData[artistId], createdAt: new Date().toISOString() }, { merge: true });
                  needsCommit = true;
                }
              }
            } catch(e) {}

            // Migrate Downloads
            try {
              const localDownloadsData = localStorage.getItem('spotify_offline_tracks');
              if (localDownloadsData) {
                const parsedDownloadsData = JSON.parse(localDownloadsData);
                for (const trackId of Object.keys(parsedDownloadsData)) {
                  const downloadRef = doc(db, 'users', user.uid, 'downloads', trackId);
                  batch.set(downloadRef, { trackId, trackData: parsedDownloadsData[trackId], createdAt: new Date().toISOString() }, { merge: true });
                  needsCommit = true;
                }
              }
            } catch(e) {}

            // Migrate Playlists
            try {
              const localPlaylists = localStorage.getItem('spotify_user_playlists');
              if (localPlaylists) {
                const parsedPlaylists = JSON.parse(localPlaylists);
                for (const pl of parsedPlaylists) {
                  // Only migrate playlists that this user owns
                  if (pl.id) {
                    const plRef = doc(db, 'playlists', pl.id);
                    pl.userId = user.uid; // FIX: Ensure ownership matches the authenticated user
                    batch.set(plRef, pl, { merge: true });
                    needsCommit = true;
                  }
                }
              }
            } catch(e) {}
            
            if (needsCommit) {
              await batch.commit();
            }
            
            // Mark as migrated so we don't do this expensive batch write again
            localStorage.setItem('spotify_migrated_to_firestore', 'true');
            hasMigratedLocalData = true;
          }
        } catch(e) {
          console.warn('Error during data migration:', e);
        }

        // If it still doesn't exist (and we didn't migrate because flag was true but doc was missing somehow)
        if (!userSnap.exists() && !hasMigratedLocalData) {
          await setDoc(userRef, {
            id: user.uid,
            name: user.displayName || 'Your Name',
            email: user.email || '',
            avatar: user.photoURL || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        // --- END MIGRATION ---


        const unsubUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile(prev => ({
              ...prev,
              ...data,
              id: user.uid,
              name: data.name || 'Your Name',
              email: data.email || '',
              avatar: data.avatar || '',
              recentHistory: data.recentHistory || [],
              recentSearches: data.recentSearches || [],
              interactionStats: data.interactionStats || prev?.interactionStats || { trackPlays: {}, artistPlays: {}, searchSelections: {}, skips: {}, replays: {} }
            } as UserProfile));
          }
        });

        const unsubLiked = onSnapshot(collection(db, 'users', user.uid, 'likedTracks'), (snapshot) => {
          const newMap = {};
          const newSet = new Set<string>();
          snapshot.forEach(doc => {
            newSet.add(doc.id);
            newMap[doc.id] = doc.data().trackData;
          });
          setLikedTrackIds(newSet);
          setLikedTracksMap(newMap);
        });

        const unsubFollowed = onSnapshot(collection(db, 'users', user.uid, 'followedArtists'), (snapshot) => {
          const newMap = {};
          const newSet = new Set<string>();
          snapshot.forEach(doc => {
            newSet.add(doc.id);
            newMap[doc.id] = doc.data().artistData;
          });
          setFollowedArtistIds(newSet);
          setFollowedArtistsMap(newMap);
        });

        let currentPlaylists: Record<string, any> = {};
        let sharedPlaylists: Record<string, any> = {};

        const updateMergedPlaylists = () => {
          const pls = [...Object.values(currentPlaylists), ...Object.values(sharedPlaylists)];
          // deduplicate
          const uniquePls = Array.from(new Map(pls.map(p => [p.id, p])).values());
          uniquePls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setPlaylists(uniquePls as Playlist[]);
        };

        const q1 = query(collection(db, 'playlists'), where('userId', '==', user.uid));
        const unsubPlaylists1 = onSnapshot(q1, (snapshot) => {
          const newMap: Record<string, any> = {};
          snapshot.forEach(doc => {
            newMap[doc.id] = doc.data();
          });
          currentPlaylists = newMap;
          updateMergedPlaylists();
        });

        const q2 = query(collection(db, 'playlists'), where('participantIds', 'array-contains', user.uid));
        const unsubPlaylists2 = onSnapshot(q2, (snapshot) => {
          const newMap: Record<string, any> = {};
          snapshot.forEach(doc => {
            newMap[doc.id] = doc.data();
          });
          sharedPlaylists = newMap;
          updateMergedPlaylists();
        });

        const unsubPlaylists = () => {
          unsubPlaylists1();
          unsubPlaylists2();
        };

        const unsubDownloads = onSnapshot(collection(db, 'users', user.uid, 'downloads'), (snapshot) => {
          const newMap = {};
          const newSet = new Set<string>();
          snapshot.forEach(doc => {
            newSet.add(doc.id);
            newMap[doc.id] = doc.data().trackData;
          });
          setDownloadedTrackIds(newSet);
          setDownloadedTracksMap(newMap);
        });

        unsubs.push(unsubUser, unsubLiked, unsubFollowed, unsubPlaylists, unsubDownloads);
        setLoading(false);
        setAuthResolved(true);
      } else {
        // Logged out
        setProfile(null);
        setLikedTrackIds(new Set());
        setLikedTracksMap({});
        setFollowedArtistIds(new Set());
        setFollowedArtistsMap({});
        setPlaylists([]);
        loadProfile(); // Load guest profile
        setAuthResolved(true);
      }
      });
    return () => {
      unsubs.forEach(unsub => unsub());
      unsubscribe();
    };
  }, []);

  const hideToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToastData(null);
    setToastMessage(null);
  }, []);

  const showToast = useCallback((input: string | ToastData, options?: Partial<ToastData>) => {
    let data: ToastData;
    if (typeof input === 'string') {
      data = { message: input, ...options };
    } else {
      data = { ...input, ...options };
    }

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToastData(data);
    setToastMessage(data.message);

    toastTimerRef.current = setTimeout(() => {
      setToastData(null);
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3200);
  }, []);

  // Fetch initial profile & data
  const loadProfile = async () => {
    setLoading(true);
    let guestAvatar = '';
    let guestName = 'Your Name';
    let savedHistory: { track: Track; playedAt: string }[] = [];
    let savedStats: InteractionStats = {
      trackPlays: {},
      artistPlays: {},
      searchSelections: {},
      skips: {},
      replays: {}
    };
    let initialFollowedIds: Set<string> = new Set();
    let initialFollowedMap: Record<string, Artist> = {};

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
      const savedLikedData = localStorage.getItem('spotify_liked_tracks_data');
      if (savedLikedData) {
        setLikedTracksMap(JSON.parse(savedLikedData));
      }
      const savedFollowed = localStorage.getItem('spotify_followed_artists');
      if (savedFollowed) {
        const parsed = JSON.parse(savedFollowed);
        if (Array.isArray(parsed)) {
          initialFollowedIds = new Set(parsed);
          setFollowedArtistIds(initialFollowedIds);
        }
      }
      
      const savedFollowedData = localStorage.getItem('spotify_followed_artists_data');
      if (savedFollowedData) {
        let parsedMap = JSON.parse(savedFollowedData);
        if (parsedMap && typeof parsedMap === 'object') {
          // Cleanup legacy bad images from local storage
          Object.keys(parsedMap).forEach(key => {
            const art = parsedMap[key];
            if (art && art.image) {
               if (art.image.includes('unsplash.com') || art.image.includes('placeholder') || art.image.includes('d41d8cd98f00b204e9800998ecf8427e')) {
                  art.image = '';
               }
               // Specifically fix Anuv Jain if incorrect
               if (art.name && art.name.toLowerCase().includes('anuv jain')) {
                  art.image = 'https://cdn-images.dzcdn.net/images/artist/eb0c0e91c8ad621b41178e0d66c81057/1000x1000-000000-80-0-0.jpg';
               }
               // Specifically fix Noor if incorrect
               if (art.name && (art.name.toLowerCase() === 'noor' || art.name.toLowerCase() === 'noor khan')) {
                  art.image = 'https://i.scdn.co/image/ab6761610000e5ebe6000d557d1743d28cc7e71a';
               }
               // Specifically fix Madhurxo if incorrect
               if (art.name && (art.name.toLowerCase() === 'madhurxo' || art.name.toLowerCase() === 'madhur sharma')) {
                  art.image = 'https://i.scdn.co/image/ab6761610000e5ebfc25b09e6a4ca0fae1ce7adb';
               }
            }
          });
          initialFollowedMap = parsedMap;
          setFollowedArtistsMap(parsedMap);
          // Re-save cleaned map
          localStorage.setItem('spotify_followed_artists_data', JSON.stringify(parsedMap));
        }
      }

      const historyRaw = localStorage.getItem('spotify_recent_history');
      if (historyRaw) {
        savedHistory = JSON.parse(historyRaw);
      }
      const statsRaw = localStorage.getItem('spotify_interaction_stats');
      if (statsRaw) {
        savedStats = JSON.parse(statsRaw);
      }

      let savedSearches: RecentSearchItem[] = [];
      const searchesRaw = localStorage.getItem('spotify_recent_items_guest');
      if (searchesRaw) {
        try {
          savedSearches = JSON.parse(searchesRaw);
        } catch (e) {}
      }

      // Initial instantaneous profile with real following count
      setProfile({
        id: 'guest-user',
        name: guestName,
        username: 'user',
        email: '',
        avatar: guestAvatar,
        subscription: 'Spotiz Premium',
        followersCount: 0,
        followingCount: initialFollowedIds.size,
        likedTrackIds: [],
        savedAlbumIds: [],
        followedArtistIds: Array.from(initialFollowedIds),
        playlists: savedPl ? JSON.parse(savedPl) : [],
        downloadedTrackIds: [],
        recentHistory: savedHistory,
        recentSearches: savedSearches,
        interactionStats: savedStats,
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
        const serverFollowed = res.data.followedArtistIds || [];
        const mergedFollowedSet = new Set([...Array.from(initialFollowedIds), ...serverFollowed]);
        
        const finalProfile: UserProfile = {
          ...res.data,
          subscription: 'Spotiz Premium',
          name: isGuest && guestName ? guestName : res.data.name || 'Your Name',
          avatar: isGuest && guestAvatar ? guestAvatar : (isGuest ? '' : res.data.avatar || ''),
          email: isGuest ? '' : res.data.email,
          followersCount: isGuest ? 0 : res.data.followersCount || 0,
          followingCount: mergedFollowedSet.size,
          followedArtistIds: Array.from(mergedFollowedSet),
          recentHistory: savedHistory,
          interactionStats: savedStats,
        };

        setProfile(finalProfile);
        setFollowedArtistIds(mergedFollowedSet);
        if (res.data.likedTrackIds && res.data.likedTrackIds.length > 0) {
          setLikedTrackIds(new Set(res.data.likedTrackIds));
          localStorage.setItem('spotify_liked_tracks', JSON.stringify(res.data.likedTrackIds));
        }
        if (res.data.playlists && res.data.playlists.length > 0) {
          setPlaylists(res.data.playlists);
          localStorage.setItem('spotify_user_playlists', JSON.stringify(res.data.playlists));
        }
      }
    } catch (e) {
      console.warn('Failed to load profile:', e);
    } finally {
      // Do not set loading to false here, wait for auth to resolve
      // Or just do nothing, auth listener handles it.
    }
  };

  useEffect(() => {
    loadProfile();
    // Load local offline tracks cache from localStorage & IndexedDB
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

    // Deep sync with IndexedDB offline storage
    offlineStorage.getAllOfflineTracks().then((idbTracks) => {
      if (idbTracks && idbTracks.length > 0) {
        const map: Record<string, Track> = {};
        const ids = new Set<string>();
        idbTracks.forEach((t) => {
          map[t.id] = t;
          ids.add(t.id);
        });
        setDownloadedTracksMap((prev) => ({ ...prev, ...map }));
        setDownloadedTrackIds((prev) => new Set([...Array.from(prev), ...Array.from(ids)]));
      }
    }).catch(() => {});
  }, []);


  const isTrackLiked = useCallback((trackId: string) => likedTrackIds.has(trackId), [likedTrackIds]);
  
  const isArtistFollowed = useCallback(
    (artistIdOrName: string) => {
      if (!artistIdOrName) return false;
      if (followedArtistIds.has(artistIdOrName)) return true;
      const cleanInput = artistIdOrName.replace(/^(virtual-|artist-)/, '').trim();
      const norm = normalizeSearchString(cleanInput);
      if (!norm) return false;

      for (const id of followedArtistIds) {
        if (id === artistIdOrName || id === cleanInput) return true;
        const cleanId = id.replace(/^(virtual-|artist-)/, '').trim();
        if (normalizeSearchString(cleanId) === norm) return true;
      }
      for (const art of Object.values(followedArtistsMap)) {
        if (!art) continue;
        if (art.id === artistIdOrName || art.id === cleanInput) return true;
        const cleanArtId = (art.id || '').replace(/^(virtual-|artist-)/, '').trim();
        if (normalizeSearchString(cleanArtId) === norm) return true;
        if (normalizeSearchString(art.name) === norm) return true;
        if (isArtistAliasMatch(art.name, artistIdOrName) || isArtistAliasMatch(art.name, cleanInput)) return true;
        if (isArtistAliasMatch(art.id, artistIdOrName) || isArtistAliasMatch(art.id, cleanInput)) return true;
      }
      return false;
    },
    [followedArtistIds, followedArtistsMap]
  );

  const isTrackDownloaded = useCallback((trackId: string) => downloadedTrackIds.has(trackId), [downloadedTrackIds]);
  const isDownloadingTrack = useCallback((trackId: string) => downloadingProgress[trackId] !== undefined, [downloadingProgress]);
  const getTrackDownloadProgress = useCallback((trackId: string) => downloadingProgress[trackId], [downloadingProgress]);

  const addTrackToHistory = useCallback((track: Track) => {
    if (!profile) return;
    setProfile((prev) => {
      if (!prev) return prev;
      const sanitizedTrack = JSON.parse(JSON.stringify(track));
      const filtered = prev.recentHistory.filter((h) => h.track.id === sanitizedTrack.id ? false : h.track.id !== sanitizedTrack.id);
      const newHistory = [
        { track: sanitizedTrack, playedAt: new Date().toISOString() },
        ...filtered
      ].slice(0, 30);
      
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), { recentHistory: newHistory, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      } else {
        try {
          localStorage.setItem('spotify_recent_history', JSON.stringify(newHistory));
        } catch (e) {}
      }
      return { ...prev, recentHistory: newHistory };
    });
  }, [profile]);

  const removeTrackFromHistory = useCallback((trackId: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const targetItem = prev.recentHistory.find((h) => h.track.id === trackId);
      const newHistory = prev.recentHistory.filter((h) => h.track.id !== trackId);
      
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), { recentHistory: newHistory, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      } else {
        try {
          localStorage.setItem('spotify_recent_history', JSON.stringify(newHistory));
        } catch (e) {}
      }
      
      if (targetItem) {
        showToast(`Removed "${targetItem.track.title}" from recent history`);
      } else {
        showToast(`Removed from recent history`);
      }
      return { ...prev, recentHistory: newHistory };
    });
  }, [showToast]);

  const clearListeningHistory = useCallback(async () => {
    if (auth.currentUser) {
      await setDoc(doc(db, 'users', auth.currentUser.uid), { recentHistory: [], updatedAt: new Date().toISOString() }, { merge: true });
    } else {
      setProfile((prev) => {
        if (!prev) return prev;
        try {
          localStorage.removeItem('spotify_recent_history');
        } catch (e) {}
        return { ...prev, recentHistory: [] };
      });
    }
    showToast('Recent history cleared');
  }, [showToast]);

  const recentSearches = useMemo(() => {
    return profile?.recentSearches || [];
  }, [profile?.recentSearches]);

  const addRecentSearch = useCallback((item: RecentSearchItem) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const currentList = prev.recentSearches || [];
      const filtered = currentList.filter((s) => s.id !== item.id);
      const updated = [item, ...filtered].slice(0, 20);

      const userId = auth.currentUser?.uid || (prev.id && prev.id !== 'guest-user' ? prev.id : null);
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), { recentSearches: updated, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
        try {
          localStorage.setItem(`spotify_recent_items_${auth.currentUser.uid}`, JSON.stringify(updated));
        } catch (e) {}
      } else {
        try {
          const key = userId ? `spotify_recent_items_${userId}` : 'spotify_recent_items_guest';
          localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {}
      }

      return { ...prev, recentSearches: updated };
    });
  }, []);

  const removeRecentSearch = useCallback((id: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const currentList = prev.recentSearches || [];
      const updated = currentList.filter((s) => s.id !== id);

      const userId = auth.currentUser?.uid || (prev.id && prev.id !== 'guest-user' ? prev.id : null);
      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), { recentSearches: updated, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
        try {
          localStorage.setItem(`spotify_recent_items_${auth.currentUser.uid}`, JSON.stringify(updated));
        } catch (e) {}
      } else {
        try {
          const key = userId ? `spotify_recent_items_${userId}` : 'spotify_recent_items_guest';
          localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {}
      }

      return { ...prev, recentSearches: updated };
    });
  }, []);

  const clearRecentSearches = useCallback(async () => {
    if (auth.currentUser) {
      await setDoc(doc(db, 'users', auth.currentUser.uid), { recentSearches: [], updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      try {
        localStorage.removeItem(`spotify_recent_items_${auth.currentUser.uid}`);
      } catch (e) {}
    }
    setProfile((prev) => {
      if (!prev) return prev;
      try {
        const key = prev.id && prev.id !== 'guest-user' ? `spotify_recent_items_${prev.id}` : 'spotify_recent_items_guest';
        localStorage.removeItem(key);
      } catch (e) {}
      return { ...prev, recentSearches: [] };
    });
    showToast('Recent searches cleared');
  }, [showToast]);

  const toggleLikeTrack = async (track: Track): Promise<boolean> => {
    const wasLiked = likedTrackIds.has(track.id);
    
    if (auth.currentUser) {
      const trackRef = doc(db, 'users', auth.currentUser.uid, 'likedTracks', track.id);
      if (!wasLiked) {
        const sanitizedTrack = JSON.parse(JSON.stringify(track));
        await setDoc(trackRef, {
          trackId: track.id,
          trackData: sanitizedTrack,
          createdAt: new Date().toISOString()
        });
        showToast(`Added to your Liked Songs`);
      } else {
        await deleteDoc(trackRef);
        showToast(`Removed from your Liked Songs`);
      }
    } else {
      const newSet = new Set(likedTrackIds);
      const newMap = { ...likedTracksMap };
      if (!wasLiked) {
        newSet.add(track.id);
        newMap[track.id] = track;
        showToast(`Added to your Liked Songs`);
      } else {
        newSet.delete(track.id);
        delete newMap[track.id];
        showToast(`Removed from your Liked Songs`);
      }
      setLikedTrackIds(newSet);
      setLikedTracksMap(newMap);
      try {
        localStorage.setItem('spotify_liked_tracks', JSON.stringify(Array.from(newSet)));
        localStorage.setItem('spotify_liked_tracks_data', JSON.stringify(newMap));
      } catch (e) {}
    }
    
    try {
      await api.toggleLikeTrack(track.id);
    } catch (e) {}
    return !wasLiked;
  };

  const toggleFollowArtist = async (
    artistInput: Artist | { id: string; name: string; image?: string; [key: string]: any }
  ): Promise<boolean> => {
    const artistName = (artistInput.name || '').trim() || 'Artist';
    const fallbackId = `art_${encodeURIComponent(artistName.toLowerCase().replace(/\s+/g, '_'))}`;
    const artistId = artistInput.id || fallbackId;
    const wasFollowed = isArtistFollowed(artistId) || isArtistFollowed(artistName);

    const newSet = new Set(followedArtistIds);
    const newMap = { ...followedArtistsMap };

    // Find all existing keys and IDs associated with this artist
    const matchingKeys: string[] = [];
    const normName = normalizeSearchString(artistName);
    for (const key of Object.keys(newMap)) {
      const entry = newMap[key];
      if (
        key === artistId ||
        (entry?.id && entry.id === artistId) ||
        (entry?.name && normalizeSearchString(entry.name) === normName) ||
        (entry?.name && isArtistAliasMatch(entry.name, artistName))
      ) {
        matchingKeys.push(key);
      }
    }

    if (wasFollowed) {
      // Remove all matching keys
      matchingKeys.forEach((k) => {
        newSet.delete(k);
        delete newMap[k];
      });
      newSet.delete(artistId);
      if (newMap[artistId]) {
        delete newMap[artistId];
      }

      // Also prune any leftover artist IDs from newSet that match by normalization
      for (const id of Array.from(newSet)) {
        const cleanId = id.replace(/^(virtual-|artist-)/, '').trim();
        if (cleanId === artistId || normalizeSearchString(cleanId) === normName) {
          newSet.delete(id);
        }
      }

      if (auth.currentUser) {
        const allDocIds = Array.from(new Set([artistId, ...matchingKeys]));
        for (const docId of allDocIds) {
          const safeDocId = docId.replace(/\//g, '_');
          deleteDoc(doc(db, 'users', auth.currentUser.uid, 'followedArtists', safeDocId)).catch(() => {});
        }
      }
      showToast(`Unfollowed ${artistName}`);
    } else {
      newSet.add(artistId);
      const safeImage = (artistInput as any).image || (artistInput as any).headerImage || '';
      const newArtist: Artist = {
        id: artistId,
        name: artistName,
        image: safeImage,
        headerImage: (artistInput as any).headerImage || '',
        followers: Number((artistInput as any).followers) || 0,
        monthlyListeners: Number((artistInput as any).monthlyListeners) || 0,
        genres: Array.isArray((artistInput as any).genres) ? (artistInput as any).genres : ['Pop'],
        bio: String((artistInput as any).bio || ''),
        verified: Boolean((artistInput as any).verified ?? true),
        topTracks: Array.isArray((artistInput as any).topTracks)
          ? (artistInput as any).topTracks.slice(0, 10).map((t: any) => ({
              id: String(t?.id || ''),
              title: String(t?.title || ''),
              artist: String(t?.artist || artistName),
              artistId: String(t?.artistId || artistId),
              duration: Number(t?.duration) || 0,
              audio: String(t?.audio || ''),
              images: t?.images || { small: '', medium: '', large: '' }
            }))
          : [],
        albums: [],
        singles: [],
      };
      newMap[artistId] = newArtist;

      if (auth.currentUser) {
        const safeDocId = artistId.replace(/\//g, '_');
        const sanitizedPayload = JSON.parse(JSON.stringify({
          artistId,
          artistData: newArtist,
          createdAt: new Date().toISOString()
        }));
        setDoc(doc(db, 'users', auth.currentUser.uid, 'followedArtists', safeDocId), sanitizedPayload).catch((err) => {
          console.warn('[UserContext] Error saving followed artist to Firestore:', err);
        });
      }
      showToast(`Following ${artistName}`);
    }

    setFollowedArtistIds(newSet);
    setFollowedArtistsMap(newMap);

    const updatedCount = newSet.size;

    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        followingCount: updatedCount,
        followedArtistIds: Array.from(newSet),
        stats: prev.stats ? { ...prev.stats, followingCount: updatedCount } : prev.stats,
      };
    });

    try {
      localStorage.setItem('spotify_followed_artists', JSON.stringify(Array.from(newSet)));
      localStorage.setItem('spotify_followed_artists_data', JSON.stringify(newMap));
    } catch (e) {}

    try {
      await api.toggleFollowArtist(artistId);
      return !wasFollowed;
    } catch (e) {
      return !wasFollowed;
    }
  };

  const toggleDownloadTrack = async (track: Track): Promise<boolean> => {
    let wasDownloaded = downloadedTrackIds.has(track.id);
    let hasPhysicalBlob = false;
    try {
      const blob = await offlineStorage.getOfflineAudioBlob(track.id);
      hasPhysicalBlob = !!(blob && blob.size > 0);
    } catch(e) {}
    
    // If it's in Firebase but missing locally, treat as NOT downloaded so clicking will re-download the physical file
    if (wasDownloaded && !hasPhysicalBlob) {
      wasDownloaded = false;
    }

    const newSet = new Set(downloadedTrackIds);
    const newMap = { ...downloadedTracksMap };

    if (wasDownloaded) {
      if (auth.currentUser) {
        const downloadRef = doc(db, 'users', auth.currentUser.uid, 'downloads', track.id);
        await deleteDoc(downloadRef).catch(() => {});
      }
      newSet.delete(track.id);
      delete newMap[track.id];
      showToast(`Removed from offline downloads`);
      
      // Clean up from IndexedDB & caches
      try {
        await offlineStorage.removeOfflineTrack(track.id);
      } catch (e) {
        // ignore
      }
    } else {
      // Start download with visual progress
      setDownloadingProgress((prev) => ({ ...prev, [track.id]: 10 }));
      showToast(`Downloading "${track.title}" for offline...`);
      
      let playableUrl = track.streamUrl || '';
      try {
        // Step 1: Resolve high quality playback URL
        try {
          const resolveRes = await api.resolvePlayback(track.id, track.title, track.artist, track.duration);
          if (resolveRes.success && resolveRes.data?.stream?.url) {
            playableUrl = resolveRes.data.stream.url;
          }
        } catch (resolveErr) {
          // Fallback to existing streamUrl
        }

        if (!playableUrl) {
          throw new Error('No playable stream URL available for this track');
        }

        setDownloadingProgress((prev) => ({ ...prev, [track.id]: 25 }));

        // Step 2: Fetch and cache the raw audio binary
        let audioBlob: Blob | null = null;
        try {
          // Attempt 1: Fetch via audio download endpoint (CORS-safe, complete stream)
          const downloadEndpoint = `/api/audio-download?url=${encodeURIComponent(playableUrl)}`;
          const response = await fetch(downloadEndpoint);
          if (response.ok && response.body) {
            const contentLength = +(response.headers.get('Content-Length') || 0);
            const reader = response.body.getReader();
            let received = 0;
            const chunks: Uint8Array[] = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) {
                chunks.push(value);
                received += value.length;
                if (contentLength > 0) {
                  const percent = Math.min(90, Math.round(25 + (received / contentLength) * 65));
                  setDownloadingProgress((prev) => ({ ...prev, [track.id]: percent }));
                }
              }
            }
            if (chunks.length > 0) {
              audioBlob = new Blob(chunks, { type: response.headers.get('Content-Type') || 'audio/mp4' });
            }
          }
        } catch (proxyErr) {
          console.warn('[Download] Proxy download note, trying direct fetch:', proxyErr);
        }

        // Attempt 2: Direct fetch fallback if proxy failed
        if (!audioBlob || audioBlob.size === 0) {
          try {
            setDownloadingProgress((prev) => ({ ...prev, [track.id]: 50 }));
            const directRes = await fetch(playableUrl);
            if (directRes.ok) {
              audioBlob = await directRes.blob();
            }
          } catch (directErr) {
            console.warn('[Download] Direct fetch note:', directErr);
          }
        }

        if (!audioBlob || audioBlob.size === 0) {
          throw new Error('Could not download audio stream');
        }

        // Step 3: Fetch artwork image for offline display
        setDownloadingProgress((prev) => ({ ...prev, [track.id]: 92 }));
        let artworkBlob: Blob | null = null;
        const artUrl = track.images?.large || track.images?.medium || '';
        if (artUrl) {
          try {
            const artRes = await fetch(artUrl);
            if (artRes.ok) {
              artworkBlob = await artRes.blob();
            }
          } catch (artErr) {
            // Artwork fetching failure is non-blocking
          }
        }

        // Step 4: Persist in IndexedDB
        setDownloadingProgress((prev) => ({ ...prev, [track.id]: 96 }));
        const downloadedTrack: Track = { ...track, streamUrl: playableUrl };
        await offlineStorage.saveOfflineTrack(downloadedTrack, audioBlob, artworkBlob);

        // Finalize download state
        if (auth.currentUser) {
          const downloadRef = doc(db, 'users', auth.currentUser.uid, 'downloads', track.id);
          const sanitizedDownloadedTrack = JSON.parse(JSON.stringify(downloadedTrack));
          await setDoc(downloadRef, {
            trackId: track.id,
            trackData: sanitizedDownloadedTrack,
            createdAt: new Date().toISOString()
          });
        }
        
        newSet.add(track.id);
        newMap[track.id] = downloadedTrack;
        setDownloadingProgress((prev) => ({ ...prev, [track.id]: 100 }));
        showToast(`Downloaded "${track.title}" for offline playback`);

        // Smooth transition out of progress
        setTimeout(() => {
          setDownloadingProgress((prev) => {
            const next = { ...prev };
            delete next[track.id];
            return next;
          });
        }, 600);
      } catch (err) {
        console.warn('[Download] Failed to cache audio offline:', err);
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

  const createPlaylist = async (
    title: string, 
    description?: string, 
    coverImage?: string, 
    initialTracks?: Track[],
    options?: { isCollaborative?: boolean; isBlend?: boolean; collaborators?: any[]; blendParticipants?: any[] }
  ): Promise<Playlist | null> => {
    const newId = `user-pl-${Date.now()}`;
    const cleanTitle = title.trim() || `My Playlist #${playlists.length + 1}`;
    
    // Simulate generation for blend
    let generatedTracks = initialTracks || [];
    if (options?.isBlend && generatedTracks.length === 0) {
      // Pick some random liked tracks or recently played to simulate taste combination
      const recentTracks = profile?.recentHistory?.map(h => h.track) || [];
      generatedTracks = [...Object.values(likedTracksMap), ...recentTracks].slice(0, 15);
      // Fallback
      if (generatedTracks.length === 0) {
        generatedTracks = playlists.flatMap(p => p.tracks).slice(0, 15);
      }
      // Ultimate fallback: get some popular songs
      if (generatedTracks.length === 0) {
        try {
          const feed = await api.getHomeFeed();
          generatedTracks = (feed.data?.popularSongs || []).slice(0, 15);
        } catch (e) {}
      }
      
      // Deduplicate
      const seen = new Set();
      generatedTracks = generatedTracks.filter(t => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
    }

    const newPl: Playlist = {
      id: newId,
      title: cleanTitle,
      description: description ? String(description).trim() : (options?.isBlend ? 'A generated mix based on tastes.' : 'Custom playlist created on Spotiz'),
      coverImage: coverImage || '',
      userId: auth.currentUser ? auth.currentUser.uid : (profile?.id || 'guest-user'),
      isPublic: true,
      tracks: generatedTracks,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      likesCount: 0,
      color: '#10B981',
      isCollaborative: options?.isCollaborative || false,
      collaborators: options?.collaborators || (options?.isCollaborative ? [{ id: profile?.id || 'me', name: profile?.name || 'Me' }] : undefined),
      isBlend: options?.isBlend || false,
      blendParticipants: options?.blendParticipants || (options?.isBlend ? [{ id: profile?.id || 'me', name: profile?.name || 'Me' }] : undefined),
      participantIds: [auth.currentUser ? auth.currentUser.uid : (profile?.id || 'me')],
      trackMetadata: {}
    };

    if (options?.isBlend) {
      newPl.trackMetadata = {};
      const creatorName = profile?.name || (auth.currentUser?.displayName || (auth.currentUser?.email ? auth.currentUser.email.split('@')[0] : 'You'));
      const creatorId = auth.currentUser ? auth.currentUser.uid : (profile?.id || 'me');
      
      newPl.tracks.forEach((t) => {
        newPl.trackMetadata![t.id] = {
          influencedBy: [creatorName],
          addedBy: creatorName,
          addedById: creatorId
        };
      });
    }

    setPlaylists((prev) => [newPl, ...prev]);
    
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'playlists', newId), newPl);
      } catch(e) {}
    } else {
      try {
        localStorage.setItem('spotify_user_playlists', JSON.stringify([newPl, ...playlists]));
      } catch (e) {}
    }

    // Call API as well if it does other server-side stuff, though local state or firebase takes over
    try {
      await api.createPlaylist(newPl.title, newPl.description, newPl.coverImage, newId);
    } catch(e) {}

    return newPl;
  };

  const joinBlend = async (playlistId: string): Promise<Playlist | null> => {
    if (!firebaseUser) throw new Error('Please log in from the Profile menu first to join a Blend.');
    try {
      if (!db) throw new Error('Database connection unavailable. Please check your network.');
      const { getDoc, updateDoc } = await import('firebase/firestore');
      const blendRef = doc(db, 'playlists', playlistId);
      const blendSnap = await getDoc(blendRef);
      
      if (!blendSnap.exists()) {
        // Fallback: Check if it's a locally created blend that hasn't synced
        const localPlaylists = JSON.parse(localStorage.getItem('spotify_user_playlists') || '[]');
        const localBlend = localPlaylists.find((p: any) => p.id === playlistId);
        if (localBlend && localBlend.isBlend) {
           return localBlend as Playlist;
        }
        throw new Error("Blend not found. The link might be invalid, or the creator hasn't synced it yet.");
      }
      
      const blendData = blendSnap.data();
      if (!blendData.isBlend) throw new Error("This playlist is not a Blend.");
      
      const me = {
        id: firebaseUser.uid,
        name: profile?.name || firebaseUser.email?.split('@')[0] || 'Unknown',
        initial: (profile?.name || firebaseUser.email || 'U').charAt(0).toUpperCase(),
        avatar: profile?.avatar || null
      };

      const existingCollabs = blendData.collaborators || blendData.blendParticipants || [];
      const alreadyJoined = existingCollabs.some((c: any) => c.id === me.id);
      
      // Calculate my taste influence
      const recentTracks = profile?.recentHistory?.map(h => h.track) || [];
      const newTracks = [...Object.values(likedTracksMap), ...recentTracks].slice(0, 5);
      
      let updatedCollabs = existingCollabs;
      let updatedTracks = blendData.tracks ? [...blendData.tracks] : [];
      let updatedTrackMetadata = blendData.trackMetadata ? { ...blendData.trackMetadata } : {};
      
      let updatedTitle = blendData.title || 'Blend';

      if (!alreadyJoined) {
        updatedCollabs = [...existingCollabs, me];
        const existingTrackIds = new Set(updatedTracks.map((t: Track) => t.id));
        
        // Ensure earlier tracks have proper attribution to the creator if missing
        const creatorName = existingCollabs[0]?.name || 'Creator';
        updatedTracks.forEach((t: Track) => {
          if (!updatedTrackMetadata[t.id]) {
            updatedTrackMetadata[t.id] = {
              influencedBy: [creatorName],
              addedBy: creatorName,
              addedById: existingCollabs[0]?.id || 'creator'
            };
          }
        });

        // Add new tracks from friend
        newTracks.forEach(t => {
           if (!existingTrackIds.has(t.id)) {
              updatedTracks.push(t);
              updatedTrackMetadata[t.id] = {
                 influencedBy: [me.name],
                 addedBy: me.name,
                 addedById: me.id
              };
              existingTrackIds.add(t.id);
           } else if (updatedTrackMetadata[t.id]) {
              const currentInfluenced = updatedTrackMetadata[t.id].influencedBy || [];
              if (!currentInfluenced.includes(me.name)) {
                updatedTrackMetadata[t.id].influencedBy = [...currentInfluenced, me.name];
              }
           }
        });
        
        if (updatedCollabs.length >= 2) {
          updatedTitle = `${updatedCollabs[0].name} + ${updatedCollabs[1].name}`;
        }

        const participantIds = updatedCollabs.map(c => c.id);

        await updateDoc(blendRef, {
          title: updatedTitle,
          collaborators: updatedCollabs,
          blendParticipants: updatedCollabs,
          participantIds: participantIds,
          tracks: updatedTracks,
          trackMetadata: updatedTrackMetadata
        });
      } else if (updatedCollabs.length >= 2) {
        updatedTitle = `${updatedCollabs[0].name} + ${updatedCollabs[1].name}`;
      }
      
      const joinedBlend: Playlist = {
        id: blendSnap.id,
        title: updatedTitle,
        description: blendData.description || '',
        coverImage: blendData.coverImage || '',
        userId: blendData.userId || firebaseUser?.uid || 'anonymous',
        isPublic: blendData.isPublic !== undefined ? blendData.isPublic : true,
        createdAt: typeof blendData.createdAt === 'string' ? blendData.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        likesCount: blendData.likesCount || 0,
        tracks: updatedTracks,
        trackMetadata: updatedTrackMetadata,
        isCollaborative: blendData.isCollaborative,
        isBlend: blendData.isBlend,
        collaborators: updatedCollabs,
        blendParticipants: updatedCollabs,
      };

      setPlaylists(prev => {
        if (prev.find(p => p.id === joinedBlend.id)) {
          return prev.map(p => p.id === joinedBlend.id ? joinedBlend : p);
        }
        return [joinedBlend, ...prev];
      });

      return joinedBlend;
    } catch (e: any) {
      console.error("Error joining blend", e);
      throw e;
    }
  };

  const updatePlaylist = async (id: string, updates: { title?: string; description?: string; coverImage?: string }): Promise<boolean> => {
    let updatedPl: Playlist | null = null;
    setPlaylists((prev) => {
      const nextList = prev.map((p) => {
        if (p.id === id) {
          updatedPl = {
            ...p,
            ...updates,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          return updatedPl;
        }
        return p;
      });
      if (!auth.currentUser) {
        try {
          localStorage.setItem('spotify_user_playlists', JSON.stringify(nextList));
        } catch (e) {}
      }
      return nextList;
    });

    if (auth.currentUser && updatedPl) {
      try {
        await setDoc(doc(db, 'playlists', id), updatedPl, { merge: true });
      } catch(e) {}
    }

    showToast(`Playlist updated`);
    try {
      await api.updatePlaylist(id, updates);
    } catch (e) {}
    return true;
  };

  const deletePlaylist = async (id: string): Promise<boolean> => {
    setPlaylists((prev) => {
      const nextList = prev.filter((p) => p.id !== id);
      if (!auth.currentUser) {
        try {
          localStorage.setItem('spotify_user_playlists', JSON.stringify(nextList));
        } catch (e) {}
      }
      return nextList;
    });

    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'playlists', id));
      } catch(e) {}
    }

    showToast(`Playlist deleted`);
    try {
      await api.deletePlaylist(id);
    } catch (e) {}
    return true;
  };

  const addTrackToPlaylist = async (playlistId: string, track: Track): Promise<boolean> => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return false;

    if (pl.isBlend) {
      showToast("Cannot manually add tracks to a Blend.");
      return false;
    }

    if (pl.tracks.some((t) => t.id === track.id)) {
      showToast(`"${track.title}" is already in this playlist`);
      return false;
    }

    const sanitizedTrack = JSON.parse(JSON.stringify(track));

    const updatedPl: Playlist = {
      ...pl,
      tracks: [...pl.tracks, sanitizedTrack],
      updatedAt: new Date().toISOString().split('T')[0],
      trackMetadata: {
        ...(pl.trackMetadata || {}),
        [track.id]: {
          addedBy: pl.isCollaborative ? (profile?.name || 'Me') : undefined,
          addedAt: Date.now()
        }
      }
    };

    setPlaylists((prev) => {
      const nextList = prev.map((p) => (p.id === playlistId ? updatedPl : p));
      if (!auth.currentUser) {
        try {
          localStorage.setItem('spotify_user_playlists', JSON.stringify(nextList));
        } catch (e) {}
      }
      return nextList;
    });

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'playlists', playlistId), updatedPl, { merge: true });
      } catch(e) {}
    }

    recordInteraction('play', track.id, track.artist, undefined, track);
    showToast(`Added "${track.title}" to "${pl.title}"`);

    try {
      await api.addTrackToPlaylist(playlistId, track.id, track);
    } catch (e) {}
    return true;
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string): Promise<boolean> => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return false;

    const updatedPl: Playlist = {
      ...pl,
      tracks: pl.tracks.filter((t) => t.id !== trackId),
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setPlaylists((prev) => {
      const nextList = prev.map((p) => (p.id === playlistId ? updatedPl : p));
      if (!auth.currentUser) {
        try {
          localStorage.setItem('spotify_user_playlists', JSON.stringify(nextList));
        } catch (e) {}
      }
      return nextList;
    });

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'playlists', playlistId), updatedPl, { merge: true });
      } catch(e) {}
    }

    showToast(`Removed from "${pl.title}"`);

    try {
      await api.removeTrackFromPlaylist(playlistId, trackId);
    } catch (e) {}
    return true;
  };

  const reorderPlaylist = async (playlistId: string, trackIds: string[]): Promise<boolean> => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return false;

    const trackMap = new Map(pl.tracks.map((t) => [t.id, t]));
    const newTracks: Track[] = [];
    
    trackIds.forEach((id) => {
      const t = trackMap.get(id);
      if (t) newTracks.push(t);
    });

    const updatedPl: Playlist = {
      ...pl,
      tracks: newTracks,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setPlaylists((prev) => {
      const nextList = prev.map((p) => (p.id === playlistId ? updatedPl : p));
      if (!auth.currentUser) {
        try {
          localStorage.setItem('spotify_user_playlists', JSON.stringify(nextList));
        } catch (e) {}
      }
      return nextList;
    });

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'playlists', playlistId), updatedPl, { merge: true });
      } catch(e) {}
    }

    try {
      await api.reorderPlaylistTracks(playlistId, trackIds);
    } catch (e) {}
    return true;
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
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), { name, updatedAt: new Date().toISOString() }, { merge: true });
      } else {
        localStorage.setItem('spotify_guest_name', name);
        setProfile((prev) => (prev ? { ...prev, name } : null));
      }
      showToast(`Profile name updated`);
      api.updateProfile({ name }).catch(() => {});
      return true;
    } catch (e) {
      return false;
    }
  };

  const updateProfileAvatar = async (avatarUrl: string): Promise<boolean> => {
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), { avatar: avatarUrl, updatedAt: new Date().toISOString() }, { merge: true });
      } else {
        localStorage.setItem('spotify_guest_avatar', avatarUrl);
        setProfile((prev) => (prev ? { ...prev, avatar: avatarUrl } : null));
      }
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
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), { avatar: '', updatedAt: new Date().toISOString() }, { merge: true });
      } else {
        localStorage.removeItem('spotify_guest_avatar');
        setProfile((prev) => (prev ? { ...prev, avatar: '' } : null));
      }
      showToast(`Profile photo removed`);
      api.updateProfile({ avatar: '' }).catch(() => {});
      return true;
    } catch (e) {
      return false;
    }
  };

  const clearAllDownloads = async () => {
    setDownloadedTrackIds(new Set());
    setDownloadedTracksMap({});
    localStorage.removeItem('spotify_offline_tracks');
    
    try {
      await offlineStorage.clearAllOfflineData();
    } catch (e) {
      // ignore
    }
    
    showToast('Offline downloads cleared');
  };

  const recordInteraction = useCallback((type: 'play' | 'skip' | 'replay' | 'search_selection', trackId: string, artistName?: string, query?: string, track?: Track) => {
    setProfile(prev => {
      if (!prev) return prev;
      
      const newStats = { 
        trackPlays: {}, 
        artistPlays: {}, 
        searchSelections: {}, 
        skips: {}, 
        replays: {},
        trackCache: {},
        ...(prev.interactionStats || {}) 
      };
      
      if (track) {
        // Sanitize the track object to remove any undefined properties before saving to Firestore
        const sanitizedTrack = JSON.parse(JSON.stringify(track));
        newStats.trackCache = { ...newStats.trackCache, [trackId]: sanitizedTrack };
      }

      if (type === 'play') {
        newStats.trackPlays = { ...newStats.trackPlays, [trackId]: (newStats.trackPlays[trackId] || 0) + 1 };
        if (artistName) {
          newStats.artistPlays = { ...newStats.artistPlays, [artistName]: (newStats.artistPlays[artistName] || 0) + 1 };
        }
      } else if (type === 'search_selection' && query) {
        const q = query.toLowerCase().trim();
        newStats.searchSelections = { ...newStats.searchSelections };
        newStats.searchSelections[q] = { ...(newStats.searchSelections[q] || {}) };
        newStats.searchSelections[q][trackId] = (newStats.searchSelections[q][trackId] || 0) + 1;
      } else if (type === 'skip') {
        newStats.skips = { ...newStats.skips, [trackId]: (newStats.skips[trackId] || 0) + 1 };
      } else if (type === 'replay') {
        newStats.replays = { ...newStats.replays, [trackId]: (newStats.replays[trackId] || 0) + 1 };
      }

      if (auth.currentUser) {
        setDoc(doc(db, 'users', auth.currentUser.uid), { interactionStats: newStats, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      } else {
        try {
          localStorage.setItem('spotify_interaction_stats', JSON.stringify(newStats));
        } catch (e) {}
      }

      return { ...prev, interactionStats: newStats };
    });
  }, []);

  const updateSettings = async (newSettings: Partial<UserProfile['settings']>): Promise<boolean> => {
    try {
      if (auth.currentUser) {
        const mergedSettings = { ...(profile?.settings || {}), ...newSettings };
        await setDoc(doc(db, 'users', auth.currentUser.uid), { settings: mergedSettings, updatedAt: new Date().toISOString() }, { merge: true });
      }
      const res = await api.updateProfile({ settings: newSettings });
      if (res.success && res.data) {
        setProfile(prev => prev ? { ...prev, settings: { ...prev.settings, ...newSettings } } : res.data);
        showToast(`Settings saved`);
        return true;
      }
    } catch (e) {
      showToast(`Failed to save settings`);
    }
    return false;
  };

  if (!authResolved) return null; // or a loading spinner
  
  return (
    <UserContext.Provider
      value={{
        profile,
        firebaseUser,
        login,
        logoutUser,
    savedAccounts,
    switchAccount,
    addAccount,
    removeSavedAccount,
        loading,
        likedTrackIds,
        likedTracksList: Object.values(likedTracksMap),
        followedArtistIds,
        followedArtistsList,
        followedArtistsMap,
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
        toastData,
        showToast,
        hideToast,
        isComingSoonOpen,
        comingSoonTitle,
        comingSoonDesc,
        showComingSoon,
        closeComingSoon,
        downloadedTracksList: Object.values(downloadedTracksMap),
        clearAllDownloads,
        addTrackToHistory,
        removeTrackFromHistory,
        clearListeningHistory,
        recentSearches,
        addRecentSearch,
        removeRecentSearch,
        clearRecentSearches,
        recordInteraction,
        joinBlend,
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
