import { Track, Artist, Album, Playlist, LyricsData, HomeFeedData, SearchResults, SearchSuggestion } from '../../src/types';

export interface IMusicProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;

  search(query: string): Promise<SearchResults>;
  getSongSuggestions(query: string): Promise<SearchSuggestion[]>;
  getTrack(id: string): Promise<Track | null>;
  getArtist(id: string): Promise<Artist | null>;
  getAlbum(id: string): Promise<Album | null>;
  getPlaylist(id: string): Promise<Playlist | null>;
  getRecommendations(seedTrackId?: string, genre?: string): Promise<Track[]>;
  getLyrics(trackId: string, trackTitle?: string, artistName?: string, duration?: number): Promise<LyricsData>;
  resolvePlayback(trackId: string, title?: string, artist?: string, duration?: number): Promise<{
    id: string;
    title: string;
    artist: string;
    album: string;
    thumbnail: string;
    duration: number;
    stream: {
      url: string;
      mimeType: string;
      bitrate: string;
    };
  } | null>;
  getHomeFeed(): Promise<HomeFeedData>;
}
