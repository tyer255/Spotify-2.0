import { smartRankingService } from './SmartRankingService';
import { providerManager } from '../providers/ProviderManager';
import { lyricsIndexService } from './lyricsIndexService';
import { Track, Artist, Album, Playlist, LyricsData, HomeFeedData, SearchResults, SearchSuggestion, UserProfile } from '../../src/types';

// In-memory Database for User Owned Content & Preferences
export const userDatabase: UserProfile = {
  id: 'guest-user',
  name: 'Your Name',
  username: 'user',
  email: '',
  avatar: '',
  subscription: 'Spotiz Premium',
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
  interactionStats: {
    trackPlays: {},
    artistPlays: {},
    searchSelections: {},
    skips: {},
    replays: {}
  },
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

import { resolveMissingSpotifyThumbnails } from './spotifyThumbnailExtractor';

export class MusicService {
  static async getHomeFeed(): Promise<HomeFeedData> {
    const provider = providerManager.getProvider();
    const feed = await provider.getHomeFeed();
    if (feed.popularArtists && feed.popularArtists.length > 0) {
      await resolveMissingSpotifyThumbnails(feed.popularArtists, 'artist');
    }
    return feed;
  }

  static async search(query: string, userId?: string): Promise<SearchResults> {
    const provider = providerManager.getProvider();
    const results = await provider.search(query);
    
    // Inject local lyrics reverse matches
    const lyricMatches = lyricsIndexService.searchLyrics(query);
    if (lyricMatches.length > 0) {
      const existingIds = new Set(results.songs.map(s => s.id));
      const addedMatches = lyricMatches.filter(t => !existingIds.has(t.id));
      results.songs = [...addedMatches.map(m => ({...m, lyricsMatchScore: 100})), ...results.songs];
    }
    
    // Resolve any missing artist thumbnails in the background so search responds instantly
    if (results.artists && results.artists.length > 0) {
      resolveMissingSpotifyThumbnails(results.artists, 'artist').catch(() => {});
    }

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

    
    // Apply Smart Search Ranking Layer (AI Ranking)
    if (results.songs && results.songs.length > 0) {
      results.songs = await smartRankingService.rankSongs(results.songs, userId || 'anonymous', query);
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
    const artist = await provider.getArtist(id);
    if (artist) {
      await resolveMissingSpotifyThumbnails([artist], 'artist');
    }
    return artist;
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
    if (id === 'saavn-eDqkyo85' || id.includes('lambiyan')) {
      const customLyrics = `इन राबतों से दूर, तेरे रास्तों से दूर
मुझे हो जाने दे आज खुद से तू दूर
लम्बिया जुदाईआ हिस्से साडे आईया
रब्बा ये महोबबता क्यों तू बनाइया
लम्बिया जुदाईआ हिस्से साडे आईया
रब्बा ये महोबबता क्यों तू बनाइया`;
      const lines = customLyrics.split('\n').map((text, idx) => ({
        time: idx * 5,
        startTimeMs: idx * 5000,
        text
      }));
      return {
        trackId: id,
        title: trackTitle || 'Lambiyan Judaiyan',
        artist: artistName || 'Imran Raza',
        synced: true,
        plainLyrics: customLyrics,
        lines
      };
    }

    const provider = providerManager.getProvider();
    const result = await provider.getLyrics(id, trackTitle, artistName, duration);
    
    if (result && result.plainLyrics) {
      this.getTrack(id).then(track => {
        if (track) lyricsIndexService.indexLyrics(track, result.plainLyrics);
      }).catch(() => {});
    }
    
    return result;
  }

  static async resolvePlayback(
    trackId: string,
    title?: string,
    artist?: string,
    duration?: number,
    options?: { forceFresh?: boolean; discardUrl?: string }
  ) {
    const provider = providerManager.getProvider();
    return provider.resolvePlayback(trackId, title, artist, duration, options);
  }

  static async getRecommendations(seedTrackId?: string, genre?: string): Promise<Track[]> {
    const provider = providerManager.getProvider();
    return provider.getRecommendations(seedTrackId, genre);
  }
}
