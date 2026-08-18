import { providerManager } from '../providers/ProviderManager';
import { Track, Artist, Album, Playlist, LyricsData, HomeFeedData, SearchResults, SearchSuggestion, UserProfile } from '../../src/types';

// In-memory Database for User Owned Content & Preferences
export const userDatabase: UserProfile = {
  id: 'guest-user',
  name: 'Your Name',
  username: 'user',
  email: '',
  avatar: '',
  subscription: 'Spotify Premium',
  followersCount: 0,
  followingCount: 0,
  likedTrackIds: [],
  savedAlbumIds: [],
  followedArtistIds: [],
  stats: {
    totalHoursStreamed: 0,
    tracksPlayedCount: 0,
    topGenre: 'None',
    topArtist: 'None',
    playlistsCount: 0,
    followersCount: 0,
    followingCount: 0,
  },
  playlists: [],
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
  }
};

export class MusicService {
  static async getHomeFeed(): Promise<HomeFeedData> {
    const provider = providerManager.getProvider();
    return provider.getHomeFeed();
  }

  static async search(query: string): Promise<SearchResults> {
    const provider = providerManager.getProvider();
    const results = await provider.search(query);

    // Merge user's matching playlists
    const q = (query || '').toLowerCase().trim();
    if (q) {
      const userMatchedPlaylists = userDatabase.playlists.filter(
        (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
      results.playlists = [...userMatchedPlaylists, ...results.playlists];
    } else {
      results.playlists = [...userDatabase.playlists];
    }

    return results;
  }

  static async getSongSuggestions(query: string): Promise<SearchSuggestion[]> {
    const provider = providerManager.getProvider();
    const suggestions = await provider.getSongSuggestions(query);
    return suggestions;
  }

  static async getTrack(id: string): Promise<Track | null> {
    // Check if track is inside user playlists or history first
    for (const pl of userDatabase.playlists) {
      const found = pl.tracks.find((t) => t.id === id);
      if (found) return found;
    }

    const provider = providerManager.getProvider();
    return provider.getTrack(id);
  }

  static async getArtist(id: string): Promise<Artist | null> {
    const provider = providerManager.getProvider();
    return provider.getArtist(id);
  }

  static async getAlbum(id: string): Promise<Album | null> {
    const provider = providerManager.getProvider();
    return provider.getAlbum(id);
  }

  static async getPlaylist(id: string): Promise<Playlist | null> {
    const userPl = userDatabase.playlists.find((p) => p.id === id);
    if (userPl) return userPl;
    
    const provider = providerManager.getProvider();
    return provider.getPlaylist(id);
  }

  static async getLyrics(id: string, trackTitle?: string, artistName?: string, duration?: number): Promise<LyricsData> {
    const provider = providerManager.getProvider();
    return provider.getLyrics(id, trackTitle, artistName, duration);
  }

  static async resolvePlayback(trackId: string, title?: string, artist?: string, duration?: number) {
    const provider = providerManager.getProvider();
    return provider.resolvePlayback(trackId, title, artist, duration);
  }

  static async getRecommendations(seedTrackId?: string, genre?: string): Promise<Track[]> {
    const provider = providerManager.getProvider();
    return provider.getRecommendations(seedTrackId, genre);
  }
}
