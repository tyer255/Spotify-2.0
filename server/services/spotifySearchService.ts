import { Track, Artist, Album, Playlist, SearchResults, SearchSuggestion, ImageSet } from '../../src/types';
import { setToCache, getFromCache } from '../providers/OpenMusicProvider';

/**
 * Spotify Search Engine Service
 *
 * Implements the search system and discovery layer reverse-engineered from
 * Spotify Pathfinder GraphQL API (as referenced in SpotifyScraper).
 *
 * STRICT USAGE POLICY:
 * This module is purely an input/discovery search engine.
 * Audio playback, stream resolution, downloads, and fallback streaming remain
 * handled by the application's existing AudioStreamResolver & OpenMusicProvider.
 */

const PATHFINDER_URL = 'https://api-partner.spotify.com/pathfinder/v1/query';
const SEARCH_DESKTOP_HASH = 'eff59fa0a3d026b88b56fddbcf4bdfa16a186b8175a5c1a358c072e053c2e5b0';
const GET_TRACK_HASH = '612585ae06ba435ad26369870deaae23b5c8800a256cd8a57e08eddc25a37294';

const BOOTSTRAP_EMBED_IDS = [
  '4uLU6hMCjMI75M1A2tKUQC', // Default Never Gonna Give You Up
  '0lks2Kt9veMOFEAPN0fsqN', // Lily
  '60nZcImufyMA1MKQY3dcCH', // Happy
];

class SpotifyTokenManager {
  private accessToken: string | null = null;
  private expiresAt: number = 0;
  private refreshPromise: Promise<string> | null = null;

  async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.expiresAt - 60000) {
      return this.accessToken;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.fetchToken().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  invalidateToken(): void {
    this.accessToken = null;
    this.expiresAt = 0;
  }

  private async fetchToken(): Promise<string> {
    for (const trackId of BOOTSTRAP_EMBED_IDS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`https://open.spotify.com/embed/track/${trackId}`, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        clearTimeout(timeout);

        if (!res.ok) continue;

        const html = await res.text();
        const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        if (!match || !match[1]) continue;

        const data = JSON.parse(match[1]);
        const session = data?.props?.pageProps?.state?.settings?.session;
        if (session && session.accessToken) {
          this.accessToken = session.accessToken;
          this.expiresAt = session.accessTokenExpirationTimestampMs || Date.now() + 3600 * 1000;
          return this.accessToken;
        }
      } catch (err) {
        // Try next fallback track ID
      }
    }

    throw new Error('Failed to bootstrap Spotify search token from embed pages');
  }
}

const tokenManager = new SpotifyTokenManager();

function idFromUri(uri?: string): string {
  if (!uri) return '';
  const parts = uri.split(':');
  return parts[parts.length - 1] || '';
}

function parseImagesFromSources(sources?: Array<{ url: string; width?: number | null; height?: number | null }>): ImageSet {
  const fallback = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
  if (!sources || !Array.isArray(sources) || sources.length === 0) {
    return { small: fallback, medium: fallback, large: fallback };
  }

  // Sort sources ascending by width/height
  const valid = sources.filter((s) => s && s.url);
  if (valid.length === 0) {
    return { small: fallback, medium: fallback, large: fallback };
  }

  const sorted = [...valid].sort((a, b) => (a.width || 0) - (b.width || 0));
  const small = sorted[0]?.url || fallback;
  const medium = sorted[Math.floor(sorted.length / 2)]?.url || small;
  const large = sorted[sorted.length - 1]?.url || medium;

  return { small, medium, large };
}

function parseTrack(data: any): Track | null {
  if (!data || (!data.name && !data.title)) return null;

  const id = data.id || idFromUri(data.uri);
  if (!id) return null;

  const title = data.name || data.title || 'Unknown Title';
  const artistNames =
    data.artists?.items?.map((a: any) => a?.profile?.name || a?.name).filter(Boolean) || [];
  const artist = artistNames.length > 0 ? artistNames.join(', ') : 'Unknown Artist';
  const artistId = idFromUri(data.artists?.items?.[0]?.uri);

  const albumName = data.albumOfTrack?.name || data.album?.name || 'Single';
  const albumId = idFromUri(data.albumOfTrack?.uri || data.album?.uri);

  const sources = data.albumOfTrack?.coverArt?.sources || data.coverArt?.sources || data.images?.items?.[0]?.sources;
  const images = parseImagesFromSources(sources);

  const durationMs = data.duration?.totalMilliseconds || (data.duration_ms ? data.duration_ms : 0);
  const durationSec = durationMs > 0 ? Math.round(durationMs / 1000) : 210;

  const color =
    data.albumOfTrack?.coverArt?.extractedColors?.colorDark?.hex ||
    data.coverArt?.extractedColors?.colorDark?.hex ||
    '#1DB954';

  const releaseYear = data.albumOfTrack?.date?.year || (data.date?.year ? data.date.year : undefined);

  return {
    id,
    title,
    artist,
    artistId: artistId ? `spotify-artist-${artistId}` : `artist-${encodeURIComponent(artist.toLowerCase())}`,
    album: albumName,
    albumId: albumId ? `spotify-album-${albumId}` : `album-${encodeURIComponent(albumName.toLowerCase())}`,
    duration: durationSec,
    images,
    provider: 'spotify',
    playbackAvailability: true,
    streamUrl: '',
    mimeType: 'audio/mp4',
    explicit: data.contentRating?.label === 'EXPLICIT',
    releaseYear,
    color,
    spotifyId: id,
    spotifyUri: data.uri || `spotify:track:${id}`,
  };
}

function parseArtist(data: any): Artist | null {
  if (!data) return null;

  const id = data.id || idFromUri(data.uri);
  const name = data.profile?.name || data.name;
  if (!name) return null;

  const sources = data.visuals?.avatarImage?.sources || data.avatar?.sources;
  const images = parseImagesFromSources(sources);

  const isVerified = data.onPlatformReputationTrait?.verification?.isVerified ?? true;

  return {
    id: `spotify-artist-${id}`,
    name,
    image: images.large,
    headerImage: images.large,
    images,
    followers: 10000000,
    monthlyListeners: 25000000,
    genres: ['Pop'],
    bio: `${name} on Spotiz.`,
    verified: isVerified,
    topTracks: [],
    albums: [],
    singles: [],
  } as any;
}

function parseAlbum(data: any): Album | null {
  if (!data) return null;

  const id = data.id || idFromUri(data.uri);
  const name = data.name;
  if (!name) return null;

  const artistNames =
    data.artists?.items?.map((a: any) => a?.profile?.name || a?.name).filter(Boolean) || [];
  const artist = artistNames.length > 0 ? artistNames.join(', ') : 'Unknown Artist';
  const artistId = idFromUri(data.artists?.items?.[0]?.uri);

  const sources = data.coverArt?.sources || data.images?.items?.[0]?.sources;
  const images = parseImagesFromSources(sources);
  const year = data.date?.year || 2024;
  const color = data.coverArt?.extractedColors?.colorDark?.hex || '#1DB954';

  return {
    id: `spotify-album-${id}`,
    name,
    artist,
    artistId: artistId ? `spotify-artist-${artistId}` : `artist-${encodeURIComponent(artist.toLowerCase())}`,
    year,
    images,
    image: images.large,
    tracks: [],
    totalDuration: 10 * 210,
    label: 'Official Release',
    color,
  } as any;
}

function parsePlaylist(data: any): Playlist | null {
  if (!data) return null;

  const id = data.id || idFromUri(data.uri);
  const title = data.name;
  if (!title) return null;

  const sources = data.images?.items?.[0]?.sources;
  const images = parseImagesFromSources(sources);
  const color = data.images?.items?.[0]?.extractedColors?.colorDark?.hex || '#1DB954';

  return {
    id: `spotify-playlist-${id}`,
    title,
    description: data.description || '',
    coverImage: images.large,
    image: images.large,
    images,
    userId: data.ownerV2?.data?.username || 'spotify',
    isPublic: true,
    tracks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    likesCount: 0,
    color,
  } as any;
}

export class SpotifySearchService {
  /**
   * Execute an aggregate search query through Spotify Pathfinder API
   */
  static async search(query: string, limit: number = 20): Promise<SearchResults> {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      return {
        topResult: null,
        songs: [],
        artists: [],
        albums: [],
        playlists: [],
      };
    }

    const cacheKey = `search-spotify-v1-${trimmed.toLowerCase()}-${limit}`;
    const cached = getFromCache<SearchResults>(cacheKey);
    if (cached) {
      return cached;
    }

    const runQuery = async (token: string) => {
      const params = new URLSearchParams({
        operationName: 'searchDesktop',
        variables: JSON.stringify({
          searchTerm: trimmed,
          offset: 0,
          limit,
          numberOfTopResults: 5,
          includeAudiobooks: false,
          includePreReleases: true,
          includeAlbumPreReleases: false,
          includeAuthors: false,
          includeEpisodeContentRatingsV2: false,
        }),
        extensions: JSON.stringify({
          persistedQuery: {
            version: 1,
            sha256Hash: SEARCH_DESKTOP_HASH,
          },
        }),
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${PATHFINDER_URL}?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          'app-platform': 'WebPlayer',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      });
      clearTimeout(timeout);
      return res;
    };

    let token = await tokenManager.getAccessToken();
    let res = await runQuery(token);

    // If unauthorized / token expired, refresh and retry once
    if (res.status === 401 || res.status === 403) {
      tokenManager.invalidateToken();
      token = await tokenManager.getAccessToken();
      res = await runQuery(token);
    }

    if (!res.ok) {
      throw new Error(`Spotify search returned HTTP ${res.status}`);
    }

    const payload = await res.json();
    const searchV2 = payload?.data?.searchV2;
    if (!searchV2) {
      throw new Error('Spotify response missing data.searchV2');
    }

    // 1. Parse Songs
    const songs: Track[] = [];
    const rawTrackItems = searchV2.tracksV2?.items || [];
    for (const wrapper of rawTrackItems) {
      const itemData = wrapper?.item?.data;
      const track = parseTrack(itemData);
      if (track) {
        songs.push(track);
        // Cache track in shared provider cache so resolvePlayback and getTrack find it instantly
        setToCache(`track-${track.id}`, track, 86400);
        setToCache(`track-spotify-${track.id}`, track, 86400);
      }
    }

    // 2. Parse Artists
    const artists: Artist[] = [];
    const rawArtistItems = searchV2.artists?.items || [];
    for (const wrapper of rawArtistItems) {
      const artistData = wrapper?.data;
      const artist = parseArtist(artistData);
      if (artist) {
        artists.push(artist);
        setToCache(`artist-${artist.id}`, artist, 86400);
      }
    }

    // 3. Parse Albums
    const albums: Album[] = [];
    const rawAlbumItems = searchV2.albumsV2?.items || [];
    for (const wrapper of rawAlbumItems) {
      const albumData = wrapper?.data;
      const album = parseAlbum(albumData);
      if (album) {
        albums.push(album);
        setToCache(`album-${album.id}`, album, 86400);
      }
    }

    // 4. Parse Playlists
    const playlists: Playlist[] = [];
    const rawPlaylistItems = searchV2.playlists?.items || [];
    for (const wrapper of rawPlaylistItems) {
      const playlistData = wrapper?.data;
      const playlist = parsePlaylist(playlistData);
      if (playlist) {
        playlists.push(playlist);
        setToCache(`playlist-${playlist.id}`, playlist, 86400);
      }
    }

    // 5. Determine Top Result from Spotify's topResultsV2
    let topResult: SearchResults['topResult'] = null;
    const topItems = searchV2.topResultsV2?.itemsV2 || [];
    if (topItems.length > 0) {
      const firstTop = topItems[0]?.item?.data;
      if (firstTop) {
        const typeName = firstTop.__typename;
        if (typeName === 'Track') {
          const t = parseTrack(firstTop);
          if (t) topResult = { type: 'track', data: t };
        } else if (typeName === 'Artist') {
          const a = parseArtist(firstTop);
          if (a) topResult = { type: 'artist', data: a };
        } else if (typeName === 'Album') {
          const al = parseAlbum(firstTop);
          if (al) topResult = { type: 'album', data: al };
        } else if (typeName === 'Playlist') {
          const p = parsePlaylist(firstTop);
          if (p) topResult = { type: 'playlist', data: p };
        }
      }
    }

    // Fallback topResult to the first song or artist if Spotify didn't specify one
    if (!topResult) {
      if (songs.length > 0) {
        topResult = { type: 'track', data: songs[0] };
      } else if (artists.length > 0) {
        topResult = { type: 'artist', data: artists[0] };
      }
    }

    const results: SearchResults = {
      topResult,
      songs,
      artists,
      albums,
      playlists,
    };

    setToCache(cacheKey, results, 600);
    return results;
  }

  /**
   * Fast search suggestions tailored for dynamic query autocomplete
   */
  static async getSongSuggestions(query: string): Promise<SearchSuggestion[]> {
    const trimmed = (query || '').trim();
    if (!trimmed) return [];

    const cacheKey = `suggestions-spotify-${trimmed.toLowerCase()}`;
    const cached = getFromCache<SearchSuggestion[]>(cacheKey);
    if (cached) return cached;

    try {
      const searchRes = await this.search(trimmed, 8);
      const suggestions: SearchSuggestion[] = [];
      const seen = new Set<string>();

      // Top result first if track
      if (searchRes.topResult && searchRes.topResult.type === 'track') {
        const t = searchRes.topResult.data as Track;
        const key = `${t.title.toLowerCase()}::${t.artist.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push({
            id: t.id,
            title: t.title,
            artist: t.artist,
            album: t.album,
            type: 'song',
            image: t.images?.small || t.images?.medium,
          });
        }
      }

      // Add songs
      for (const t of searchRes.songs) {
        if (suggestions.length >= 8) break;
        const key = `${t.title.toLowerCase()}::${t.artist.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push({
            id: t.id,
            title: t.title,
            artist: t.artist,
            album: t.album,
            type: 'song',
            image: t.images?.small || t.images?.medium,
          });
        }
      }

      // Add artists if we have room
      for (const a of searchRes.artists) {
        if (suggestions.length >= 8) break;
        const key = `artist::${a.name.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          suggestions.push({
            id: a.id,
            title: a.name,
            artist: 'Artist',
            type: 'artist',
            image: a.image,
          });
        }
      }

      setToCache(cacheKey, suggestions, 300);
      return suggestions;
    } catch (err) {
      console.warn('[SpotifySearchService] Failed to generate suggestions:', err);
      return [];
    }
  }

  /**
   * Retrieve a track directly from Spotify by ID if missing from cache
   */
  static async getTrack(id: string): Promise<Track | null> {
    const cleanId = id.replace(/^spotify-(track-)?/, '');
    const cacheKey = `track-${cleanId}`;
    const cached = getFromCache<Track>(cacheKey);
    if (cached) return cached;

    try {
      const token = await tokenManager.getAccessToken();
      const params = new URLSearchParams({
        operationName: 'getTrack',
        variables: JSON.stringify({ uri: `spotify:track:${cleanId}` }),
        extensions: JSON.stringify({
          persistedQuery: {
            version: 1,
            sha256Hash: GET_TRACK_HASH,
          },
        }),
      });

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${PATHFINDER_URL}?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${token}`,
          'app-platform': 'WebPlayer',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      });
      clearTimeout(timeout);

      if (!res.ok) return null;

      const payload = await res.json();
      const trackUnion = payload?.data?.trackUnion;
      if (!trackUnion) return null;

      const artists = [
        ...(trackUnion.firstArtist?.items || []),
        ...(trackUnion.otherArtists?.items || []),
      ];

      const track = parseTrack({
        id: cleanId,
        uri: `spotify:track:${cleanId}`,
        name: trackUnion.name,
        artists: { items: artists },
        albumOfTrack: trackUnion.albumOfTrack,
        duration: trackUnion.duration,
        contentRating: trackUnion.contentRating,
      });

      if (track) {
        setToCache(cacheKey, track, 86400);
        setToCache(`track-${id}`, track, 86400);
        return track;
      }
    } catch (err) {
      console.warn(`[SpotifySearchService] Failed to fetch track ${cleanId}:`, err);
    }

    return null;
  }
}
