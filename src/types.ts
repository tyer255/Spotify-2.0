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
  genre?: string;
  plays?: number;
  color?: string; // Dominant hex color for backdrop gradient
  lyrics?: string;
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
  position: number; // Current playback time in seconds
  duration: number; // Duration in seconds
  bufferedPosition: number;
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
  type?: 'song' | 'history';
  image?: string;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string; // e.g. '#1DB954' (Spotify Green), '#8B5CF6' (Purple), '#06B6D4' (Cyan), '#EC4899' (Pink), '#F59E0B' (Amber)
  audioQuality: 'low' | 'normal' | 'high' | 'very_high';
  crossfadeDuration: number; // 0 to 12s
  gaplessPlayback: boolean;
  normalizeVolume: boolean;
  equalizerPreset: 'flat' | 'acoustic' | 'bass_boost' | 'electronic' | 'vocal' | 'rock' | 'pop';
  downloadWifiOnly: boolean;
  privateSession: boolean;
  autoPlaySimilar: boolean;
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
  recentHistory: { track: Track; playedAt: string }[];
  settings: UserSettings;
  stats?: UserProfileStats;
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
  | { type: 'search'; initialQuery?: string }
  | { type: 'library'; subTab?: 'playlists' | 'liked' | 'downloaded' | 'artists' | 'history' }
  | { type: 'premium' }
  | { type: 'profile' }
  | { type: 'artist'; artistId: string }
  | { type: 'album'; albumId: string }
  | { type: 'playlist'; playlistId: string }
  | { type: 'settings' };
