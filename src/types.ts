export interface ImageSet {
  small: string;
  medium: string;
  large: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  duration: number; // in seconds
  images: ImageSet;
  provider: string;
  playbackAvailability: boolean;
  streamUrl: string;
  mimeType: string;
  explicit?: boolean;
  releaseYear?: number;
  releaseDate?: string;
  release_date?: string;
  createdAt?: string;
  created_at?: string;
  genre?: string;
  plays?: number;
  lyricsMatchScore?: number;
  play_count?: number;
  views?: number;
  isOriginal?: boolean;
  color?: string; // Dominant hex color for backdrop gradient
  lyrics?: string;
  isrc?: string;
  spotifyUri?: string;
  spotifyId?: string;
  version?: string;
}

export interface Artist {
  id: string;
  name: string;
  image: string;
  headerImage?: string;
  followers: number;
  monthlyListeners: number;
  genres: string[];
  bio: string;
  verified: boolean;
  topTracks: Track[];
  albums: Album[];
  singles: Track[];
  relatedArtists?: { id: string; name: string; image: string; genres: string[] }[];
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  artistId: string;
  year: number;
  images: ImageSet;
  tracks: Track[];
  totalDuration: number;
  label?: string;
  color?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  userId: string;
  isPublic: boolean;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  color?: string;
  
  // Collaborative & Blend features
  isCollaborative?: boolean;
  collaborators?: { id: string; name: string; avatar?: string }[];
  isBlend?: boolean;
  blendParticipants?: { id: string; name: string; avatar?: string }[];
  participantIds?: string[];
  trackMetadata?: Record<string, { addedBy?: string; addedById?: string; addedAt?: number; influencedBy?: string[] }>;
}

export interface LyricsLine {
  time: number; // In seconds
  text: string;
  startTimeMs: number;
}

export interface LyricsData {
  trackId: string;
  title: string;
  artist: string;
  synced: boolean;
  lines: LyricsLine[];
  plainLyrics?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlaybackState {
  track: Track | null;
  isPlaying: boolean;
  repeatMode: RepeatMode;
  shuffleEnabled: boolean;
  volume: number; // 0 to 1
  isMuted: boolean;
  playbackRate: number;
  queue: Track[];
  queueIndex: number;
  history: Track[];
  isLoading: boolean;
  error: string | null;
}

export interface HomeFeedData {
  greeting: string;
  quickPicks: Track[];
  recentlyPlayed: Track[];
  madeForYou: { id: string; title: string; subtitle: string; cover: string; tracks: Track[]; color: string }[];
  trending: Track[];
  popularSongs: Track[];
  popularArtists: Artist[];
  newReleases: Album[];
  recommendedAlbums: Album[];
  moods: { id: string; name: string; color: string; image: string; query: string }[];
}

export interface SearchResults {
  topResult: {
    type: 'track' | 'artist' | 'album' | 'playlist';
    data: Track | Artist | Album | Playlist;
  } | null;
  songs: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
}

export interface SearchSuggestion {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  type?: 'song' | 'artist' | 'album' | 'playlist' | 'history';
  image?: string;
  release_date?: string;
  releaseDate?: string;
  created_at?: string;
  createdAt?: string;
  releaseYear?: number;
  plays?: number;
  lyricsMatchScore?: number;
  play_count?: number;
  views?: number;
  score?: number;
  matchReason?: string;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string; // e.g. '#1DB954' (Spotiz Green), '#8B5CF6' (Purple), '#06B6D4' (Cyan), '#EC4899' (Pink), '#F59E0B' (Amber)
  audioQuality: 'low' | 'normal' | 'high' | 'very_high';
  audioDownloadQuality?: 'low' | 'normal' | 'high' | 'very_high';
  crossfadeDuration: number; // 0 to 12s
  gaplessPlayback: boolean;
  normalizeVolume: boolean;
  equalizerPreset: 'flat' | 'acoustic' | 'bass_boost' | 'electronic' | 'vocal' | 'rock' | 'pop';
  downloadWifiOnly: boolean;
  privateSession: boolean;
  autoPlaySimilar: boolean;
  
  // Additional Settings
  canvasEnabled?: boolean;
  showUnplayable?: boolean;
  filterExplicit?: boolean;
  listeningActivity?: boolean;
  recentArtistsVisible?: boolean;
  publicPlaylistsDefault?: boolean;
  automix?: boolean;
  monoAudio?: boolean;
  
  // Notifications
  browserPushEnabled?: boolean;
  musicArtistUpdates?: boolean;
  playlistRadar?: boolean;
  inAppAlerts?: boolean;
  emailNews?: boolean;
  monthlyDigest?: boolean;
  
  // Devices
  deviceBroadcast?: boolean;
  localDevicesOnly?: boolean;
  
  // Data & Offline
  dataSaver?: boolean;
  audioOnly?: boolean;
  
  // Media Quality
  autoAdjust?: boolean;
  
  // Ads
  tailoredAds?: boolean;
  thirdPartyAds?: boolean;
}

export interface UserProfileStats {
  totalHoursStreamed: number;
  tracksPlayedCount: number;
  topGenre: string;
  topArtist: string;
  playlistsCount: number;
  followersCount: number;
  followingCount: number;
}

export interface InteractionStats {
  trackPlays: Record<string, number>;
  artistPlays: Record<string, number>;
  searchSelections: Record<string, Record<string, number>>; // query -> trackId -> count
  skips: Record<string, number>;
  replays: Record<string, number>;
  trackCache?: Record<string, Track>;
}

export interface RecentSearchItem {
  id: string;
  type: 'track' | 'artist' | 'album' | 'playlist' | 'query' | string;
  title: string;
  subtitle: string;
  image?: string;
  query?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  subscription?: string;
  followersCount: number;
  followingCount: number;
  likedTrackIds: string[];
  savedAlbumIds: string[];
  followedArtistIds: string[];
  playlists: Playlist[];
  downloadedTrackIds: string[];
  hiddenTrackIds?: string[];
  recentHistory: { track: Track; playedAt: string }[];
  recentSearches?: RecentSearchItem[];
  settings: UserSettings;
  stats?: UserProfileStats;
  interactionStats: InteractionStats;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}

export type ActiveTab = 'home' | 'search' | 'library' | 'premium' | 'profile';
export type ViewState = 
  | { type: 'home' }
  | { type: 'search'; initialQuery?: string; scannedSongId?: string }
  | { type: 'library'; subTab?: 'playlists' | 'liked' | 'downloaded' | 'artists' | 'history' }
  | { type: 'premium' }
  | { type: 'profile' }
  | { type: 'artist'; artistId: string; expectedName?: string; initialImage?: string }
  | { type: 'album'; albumId: string }
  | { type: 'playlist'; playlistId: string }
  | { type: 'settings' }
  | { type: 'radio' }
  | { type: 'radio-station'; stationId: string; stationTitle?: string }
  | { type: 'blend-setup' }
  | { type: 'blend-invite'; blendId: string }
  | { type: 'info'; pageId: string }
  | { type: 'share-landing'; shareId: string; shareType: 'song' | 'lyrics' };
