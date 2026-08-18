import { IMusicProvider } from './MusicProvider';
import { Track, Artist, Album, Playlist, LyricsData, HomeFeedData, SearchResults, SearchSuggestion } from '../../src/types';

export class SpotifyMusicProvider implements IMusicProvider {
  readonly id = 'spotify-web-api';
  readonly name = 'Official Spotify Web API';

  private clientId: string | null = process.env.SPOTIFY_CLIENT_ID || null;
  private clientSecret: string | null = process.env.SPOTIFY_CLIENT_SECRET || null;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  async getSongSuggestions(query: string): Promise<SearchSuggestion[]> {
    const q = (query || '').trim();
    if (!q) return [];
    const token = await this.getAccessToken();
    if (!token) return [];

    try {
      const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const qLower = q.toLowerCase();
      const tracks = (data.tracks?.items || [])
        .filter((t: any) => t.name && t.name.toLowerCase().includes(qLower))
        .map((t: any) => ({
          id: `spot-sug-${t.id}`,
          title: t.name,
          artist: t.artists?.map((a: any) => a.name).join(', ') || 'Artist',
          type: 'song' as const,
          image: t.album?.images?.[2]?.url || t.album?.images?.[0]?.url,
        }));
      return tracks.slice(0, 8);
    } catch {
      return [];
    }
  }

  private async getAccessToken(): Promise<string | null> {
    if (!this.isConfigured()) return null;
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }

    try {
      const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (res.ok) {
        const data = await res.json();
        this.accessToken = data.access_token;
        this.tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
        return this.accessToken;
      }
    } catch (e) {
      console.warn('[Spotify Provider] Token exchange failed:', e);
    }
    return null;
  }

  private normalizeSpotifyTrack(item: any): Track {
    const images = item.album?.images || [];
    const largeArt = images[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
    const mediumArt = images[1]?.url || largeArt;
    const smallArt = images[2]?.url || mediumArt;

    return {
      id: item.id,
      title: item.name,
      artist: item.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
      artistId: item.artists?.[0]?.id || 'unknown',
      album: item.album?.name || 'Single',
      albumId: item.album?.id || 'unknown',
      duration: Math.round((item.duration_ms || 180000) / 1000),
      images: {
        small: smallArt,
        medium: mediumArt,
        large: largeArt,
      },
      provider: this.id,
      playbackAvailability: Boolean(item.preview_url),
      streamUrl: item.preview_url || '',
      mimeType: 'audio/mpeg',
      explicit: Boolean(item.explicit),
      releaseYear: item.album?.release_date ? parseInt(item.album.release_date.split('-')[0], 10) : 2024,
      genre: 'Pop',
      plays: item.popularity ? item.popularity * 1000000 : 15000000,
      color: '#1DB954',
    };
  }

  async search(query: string): Promise<SearchResults> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('Spotify Web API credentials not configured');

    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,artist,album&limit=20`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) throw new Error(`Spotify search failed: ${res.statusText}`);
    const data = await res.json();

    const songs: Track[] = (data.tracks?.items || []).map((t: any) => this.normalizeSpotifyTrack(t));
    const artists: Artist[] = (data.artists?.items || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      image: a.images?.[0]?.url || '',
      followers: a.followers?.total || 0,
      monthlyListeners: Math.round((a.followers?.total || 100000) * 2.5),
      genres: a.genres || ['Music'],
      bio: `${a.name} is on Spotify.`,
      verified: true,
      topTracks: [],
      albums: [],
      singles: [],
    }));

    const albums: Album[] = (data.albums?.items || []).map((al: any) => ({
      id: al.id,
      name: al.name,
      artist: al.artists?.map((a: any) => a.name).join(', ') || '',
      artistId: al.artists?.[0]?.id || '',
      year: al.release_date ? parseInt(al.release_date.split('-')[0], 10) : 2024,
      images: {
        small: al.images?.[2]?.url || al.images?.[0]?.url || '',
        medium: al.images?.[1]?.url || al.images?.[0]?.url || '',
        large: al.images?.[0]?.url || '',
      },
      tracks: [],
      totalDuration: (al.total_tracks || 10) * 210,
      label: 'Record Label',
      color: '#1DB954',
    }));

    return {
      topResult: artists.length > 0 ? { type: 'artist', data: artists[0] } : songs.length > 0 ? { type: 'track', data: songs[0] } : null,
      songs,
      artists,
      albums,
      playlists: [],
    };
  }

  async getTrack(id: string): Promise<Track | null> {
    const token = await this.getAccessToken();
    if (!token) return null;

    const res = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return this.normalizeSpotifyTrack(data);
  }

  async getArtist(id: string): Promise<Artist | null> {
    const token = await this.getAccessToken();
    if (!token) return null;

    const [artistRes, topTracksRes, albumsRes] = await Promise.all([
      fetch(`https://api.spotify.com/v1/artists/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`https://api.spotify.com/v1/artists/${id}/top-tracks?market=US`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`https://api.spotify.com/v1/artists/${id}/albums?limit=10`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    if (!artistRes.ok) return null;
    const a = await artistRes.json();
    const tracksData = topTracksRes.ok ? await topTracksRes.json() : { tracks: [] };
    const albumsData = albumsRes.ok ? await albumsRes.json() : { items: [] };

    const topTracks = (tracksData.tracks || []).map((t: any) => this.normalizeSpotifyTrack(t));
    const albums: Album[] = (albumsData.items || []).map((al: any) => ({
      id: al.id,
      name: al.name,
      artist: a.name,
      artistId: a.id,
      year: al.release_date ? parseInt(al.release_date.split('-')[0], 10) : 2024,
      images: {
        small: al.images?.[2]?.url || al.images?.[0]?.url || '',
        medium: al.images?.[1]?.url || al.images?.[0]?.url || '',
        large: al.images?.[0]?.url || '',
      },
      tracks: [],
      totalDuration: (al.total_tracks || 10) * 210,
      label: 'Spotify Record',
      color: '#1DB954',
    }));

    return {
      id: a.id,
      name: a.name,
      image: a.images?.[0]?.url || '',
      followers: a.followers?.total || 0,
      monthlyListeners: Math.round((a.followers?.total || 100000) * 2.5),
      genres: a.genres || ['Music'],
      bio: `${a.name} official Spotify profile.`,
      verified: true,
      topTracks,
      albums,
      singles: topTracks.filter((t: Track) => t.album.toLowerCase().includes('single')),
    };
  }

  async getAlbum(id: string): Promise<Album | null> {
    const token = await this.getAccessToken();
    if (!token) return null;

    const res = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const al = await res.json();

    const tracks = (al.tracks?.items || []).map((t: any) => ({
      ...this.normalizeSpotifyTrack({ ...t, album: { name: al.name, id: al.id, images: al.images } }),
      album: al.name,
      albumId: al.id,
    }));

    return {
      id: al.id,
      name: al.name,
      artist: al.artists?.map((a: any) => a.name).join(', ') || '',
      artistId: al.artists?.[0]?.id || '',
      year: al.release_date ? parseInt(al.release_date.split('-')[0], 10) : 2024,
      images: {
        small: al.images?.[2]?.url || al.images?.[0]?.url || '',
        medium: al.images?.[1]?.url || al.images?.[0]?.url || '',
        large: al.images?.[0]?.url || '',
      },
      tracks,
      totalDuration: tracks.reduce((acc: number, curr: Track) => acc + curr.duration, 0),
      label: al.label || al.copyrights?.[0]?.text || 'Record Label',
      color: '#1DB954',
    };
  }

  async getPlaylist(id: string): Promise<Playlist | null> {
    return null;
  }

  async getRecommendations(seedTrackId?: string, genre?: string): Promise<Track[]> {
    return [];
  }

  async getLyrics(trackId: string, trackTitle?: string, artistName?: string, duration?: number): Promise<LyricsData> {
    return {
      trackId,
      title: trackTitle || '',
      artist: artistName || '',
      synced: false,
      lines: [],
      plainLyrics: 'Lyrics unavailable for this track.',
    };
  }

  async resolvePlayback(trackId: string) {
    const track = await this.getTrack(trackId);
    if (!track || !track.streamUrl) return null;

    return {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      thumbnail: track.images.large,
      duration: track.duration,
      stream: {
        url: track.streamUrl,
        mimeType: track.mimeType,
        bitrate: '320kbps',
      },
    };
  }

  async getHomeFeed(): Promise<HomeFeedData> {
    throw new Error('Home feed should use active configured provider');
  }
}
