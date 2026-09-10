import { smartRankingService } from './SmartRankingService';
import { providerManager } from '../providers/ProviderManager';
import { lyricsIndexService } from './lyricsIndexService';
import { Track, Artist, Album, Playlist, LyricsData, HomeFeedData, SearchResults, SearchSuggestion } from '../../src/types';
import { resolveMissingSpotifyThumbnails } from './spotifyThumbnailExtractor';
import { SpotifySearchService } from './spotifySearchService';

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
    let results: SearchResults;

    try {
      results = await SpotifySearchService.search(query);
      if (!results || (!results.topResult && results.songs.length === 0 && results.artists.length === 0)) {
        console.log(`[Search] Spotify search returned empty for "${query}", falling back to provider search...`);
        results = await provider.search(query);
      }
    } catch (err) {
      console.warn(`[Search] Spotify search failed for "${query}", falling back to provider search:`, err);
      results = await provider.search(query);
    }
    
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

    results.playlists = results.playlists || [];
    
    // Apply Smart Search Ranking Layer (AI Ranking)
    if (results.songs && results.songs.length > 0) {
      results.songs = await smartRankingService.rankSongs(results.songs, userId || 'anonymous', query);
    }
    return results;

  }

  static async getSongSuggestions(query: string): Promise<SearchSuggestion[]> {
    const provider = providerManager.getProvider();
    try {
      const suggestions = await SpotifySearchService.getSongSuggestions(query);
      if (suggestions && suggestions.length > 0) {
        return suggestions;
      }
    } catch (err) {
      console.warn(`[Search] Spotify suggestions failed for "${query}":`, err);
    }
    return provider.getSongSuggestions(query);
  }

  static async getTrack(id: string): Promise<Track | null> {
    const provider = providerManager.getProvider();
    const track = await provider.getTrack(id);
    if (track) return track;

    // Check Spotify track lookup if not found in provider
    if (id.startsWith('spotify-') || /^[0-9A-Za-z]{22}$/.test(id)) {
      const spotifyTrack = await SpotifySearchService.getTrack(id);
      if (spotifyTrack) return spotifyTrack;
    }

    return null;
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
