export interface ImageSet {
  small?: string;
  medium?: string;
  large?: string;
}

export interface LyricLine {
  time: number;
  startTimeMs: number;
  text: string;
}

export interface LyricsData {
  synced: boolean;
  lines: LyricLine[];
  plainLyrics?: string;
  provider?: string;
  trackId?: string;
  error?: string;
  [key: string]: any;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  duration: number;
  images: ImageSet;
  provider?: string;
  playbackAvailability?: boolean;
  streamUrl?: string;
  audioUrl?: string;
  mimeType?: string;
  explicit?: boolean;
  releaseYear?: number;
  releaseDate?: string;
  release_date?: string;
  createdAt?: string;
  created_at?: string;
  genre?: string;
  plays?: number;
  play_count?: number;
  views?: number;
  color?: string;
  lyricsMatchScore?: number;
  searchScore?: number;
  syncedLyrics?: LyricLine[];
  lyrics?: string;
  source?: string;
  isCustom?: boolean;
  liked?: boolean;
  canvasUrl?: string;
  [key: string]: any;
}

export interface Artist {
  id: string;
  name: string;
  image?: string;
  followers?: number;
  monthlyListeners?: number;
  genres?: string[];
  bio?: string;
  verified?: boolean;
  topTracks?: Track[];
  albums?: Album[];
  singles?: Track[];
  searchScore?: number;
  [key: string]: any;
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  artistId?: string;
  year?: number;
  releaseDate?: string;
  release_date?: string;
  images: ImageSet;
  tracks?: Track[];
  totalDuration?: number;
  label?: string;
  color?: string;
  searchScore?: number;
  [key: string]: any;
}

export interface Playlist {
  id: string;
  title: string;
  name?: string;
  description?: string;
  owner?: string;
  tracks: Track[];
  artwork?: string;
  images?: ImageSet;
  isPublic?: boolean;
  createdAt?: string;
  searchScore?: number;
  [key: string]: any;
}

export interface SearchSuggestion {
  id: string;
  title: string;
  artist: string;
  album?: string;
  release_date?: string;
  releaseDate?: string;
  releaseYear?: number;
  plays?: number;
  play_count?: number;
  views?: number;
  type: 'song' | 'artist' | 'album' | 'playlist';
  image?: string;
  score?: number;
  [key: string]: any;
}

export interface TopResultObject {
  type: string;
  data: any;
  [key: string]: any;
}

export interface SearchResults {
  topResult: TopResultObject | Track | Artist | Album | Playlist | null | any;
  songs: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  [key: string]: any;
}

export interface HomeFeedData {
  featuredPlaylists?: Playlist[];
  recentlyPlayed?: Track[];
  madeForYou?: Playlist[];
  trendingSongs?: Track[];
  topMixes?: Playlist[];
  popularArtists?: Artist[];
  newReleases?: Album[];
  quickPicks?: Track[];
  moodStations?: { id: string; title: string; image: string; color: string }[];
  [key: string]: any;
}

export interface ShareRecord {
  id?: string;
  shareId: string;
  type: 'song' | 'album' | 'playlist' | 'artist' | 'lyrics';
  title: string;
  artist: string;
  artwork: string;
  customImageBase64?: string;
  lyrics?: string;
  createdAt: number;
}
