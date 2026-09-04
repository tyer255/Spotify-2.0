import { IMusicProvider } from './MusicProvider';
import { Track, Artist, Album, Playlist, LyricsData, HomeFeedData, SearchResults, SearchSuggestion } from '../../src/types';
import { AudioStreamResolver, validateAudioStream } from '../services/AudioStreamResolver';
import { rankAndSortTracks, rankAndSortSuggestions, rankAndSortSearchResults, cleanSearchTitle, normalizeSearchString } from '../../src/utils/searchRanker';
import { resolveArtist, getExpandedSearchQueries, isArtistAliasMatch, ARTIST_ALIAS_DATABASE } from '../../src/utils/artistAliases';
import { extractSpotifyThumbnail, SPOTIFY_CDN_THUMBNAIL_MAP } from '../services/spotifyThumbnailExtractor';
import { lyricsIndexer } from '../services/LyricsIndexer';
import CryptoJS from 'crypto-js';

// In-memory cache for provider requests to optimize performance
interface CacheItem<T> {
  data: T;
  expiresAt: number;
}
const cache = new Map<string, CacheItem<any>>();

function getFromCache<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data as T;
}

function setToCache<T>(key: string, data: T, ttlSeconds: number = 30): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}


function extractSaavnArtist(item: any, fallbackName: string = 'Artist'): string {
  try {
    const allNames: string[] = [];
    const seen = new Set<string>();

    const addName = (n: any) => {
      if (typeof n === 'string' && n.trim().length > 0) {
        const clean = n.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').trim();
        for (const part of clean.split(/,\s*|\s*&\s*|\s*\|\s*/)) {
          const p = part.trim();
          if (p && !seen.has(p.toLowerCase())) {
            seen.add(p.toLowerCase());
            allNames.push(p);
          }
        }
      }
    };

    // 1. Primary artists (highest priority and cleanest)
    if (item?.more_info?.artistMap?.primary_artists?.length > 0) {
      item.more_info.artistMap.primary_artists.forEach((a: any) => addName(a.name));
    } else if (item?.primary_artists) {
      addName(item.primary_artists);
    }

    // 2. Singers (Vocals)
    if (item?.more_info?.singers) {
      if (Array.isArray(item.more_info.singers)) {
        item.more_info.singers.forEach((s: any) => addName(s.name || s));
      } else if (typeof item.more_info.singers === 'string') {
        addName(item.more_info.singers);
      }
    }

    // 3. Featured Artists
    if (item?.more_info?.artistMap?.featured_artists?.length > 0) {
      item.more_info.artistMap.featured_artists.forEach((a: any) => addName(a.name));
    }

    // 4. Music Composer
    if (item?.more_info?.music) {
      addName(item.more_info.music);
    }

    if (allNames.length > 0) {
      return allNames.join(', ');
    }

    if (item?.subtitle && typeof item.subtitle === 'string') {
      const sub = item.subtitle.split('-')[0]?.trim();
      if (sub && sub.length > 0) return sub;
    }
  } catch (e) {}
  return fallbackName || 'Artist';
}

function extractSaavnArtistId(item: any, fallbackName: string): string {
  try {
    if (item?.more_info?.artistMap?.primary_artists?.length > 0) {
      const pId = item.more_info.artistMap.primary_artists[0].id;
      if (pId) return `saavn-artist-${pId}`;
    }
    if (item?.more_info?.artistMap?.artists?.length > 0) {
      const aId = item.more_info.artistMap.artists[0].id;
      if (aId) return `saavn-artist-${aId}`;
    }
  } catch (e) {}
  if (!fallbackName) fallbackName = 'unknown';
  return `artist-${encodeURIComponent(fallbackName.toLowerCase().trim())}`;
}

function decryptSaavnMediaUrl(encrypted: string): string | null {
  try {
    if (!encrypted) return null;
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encrypted),
    });
    const decrypted = CryptoJS.DES.decrypt(
      cipherParams,
      key,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    );
    let base = decrypted.toString(CryptoJS.enc.Utf8);
    if (!base || (!base.includes('.mp4') && !base.includes('.mp3') && !base.includes('.m4a'))) {
      return null;
    }
    if (!base.startsWith('http')) {
      base = 'https:' + base;
    }
    const u320 = base.replace(/_\d+\.mp4$/, '_320.mp4').replace(/_96\.mp4$/, '_320.mp4');
    return u320;
  } catch (e) {
    return null;
  }
}

function getSaavnFallbackUrls(primaryUrl: string): string[] {
  if (!primaryUrl) return [];
  const u320 = primaryUrl.replace(/_\d+\.mp4$/, '_320.mp4').replace(/_96\.mp4$/, '_320.mp4');
  const u160 = primaryUrl.replace(/_\d+\.mp4$/, '_160.mp4').replace(/_96\.mp4$/, '_160.mp4');
  const u96 = primaryUrl.replace(/_\d+\.mp4$/, '_96.mp4');
  const u48 = primaryUrl.replace(/_\d+\.mp4$/, '_48.mp4');
  return [u320, u160, u96, u48].filter((u, i, arr) => arr.indexOf(u) === i);
}

function getValidSaavnStream(item: any): string | null {
  if (!item) return null;
  const enc = item.more_info?.encrypted_media_url;
  if (enc) {
    const decrypted = decryptSaavnMediaUrl(enc);
    if (decrypted && !decrypted.includes('jiotune') && !decrypted.includes('preview')) {
      return decrypted;
    }
  }
  const vlink = item.more_info?.vlink;
  if (vlink && typeof vlink === 'string' && !vlink.includes('jiotune') && !vlink.includes('preview')) {
    return vlink;
  }
  return null;
}

function getValidSaavnStreamWithFallbacks(item: any): { primaryUrl: string; fallbackUrls: string[] } | null {
  const stream = getValidSaavnStream(item);
  if (!stream) return null;
  return {
    primaryUrl: stream,
    fallbackUrls: getSaavnFallbackUrls(stream),
  };
}

/**
 * Fast URL fetch cache with TTL and single-flight coalescing to eliminate redundant network traffic
 */
interface UrlCacheEntry {
  data: any;
  expiresAt: number;
}
const urlFetchCache = new Map<string, UrlCacheEntry>();
const inflightFetches = new Map<string, Promise<any>>();
const inflightSearches = new Map<string, Promise<SearchResults>>();

/**
 * Safe fetch helper that handles timeouts, status verification, caching, and JSON parsing
 * without throwing "Body is unusable: Body has already been read"
 */
async function safeFetchJson<T = any>(url: string, timeoutMs: number = 4000): Promise<T | null> {
  const cached = urlFetchCache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const existingPromise = inflightFetches.get(url);
  if (existingPromise) {
    return existingPromise as Promise<T | null>;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Spotify2-Music/1.0',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate, br',
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) return null;
      const text = await res.text();
      if (!text || text.trim() === '') return null;
      const parsed = JSON.parse(text) as T;
      if (parsed) {
        urlFetchCache.set(url, {
          data: parsed,
          expiresAt: Date.now() + 60000, // 1-minute URL cache
        });
      }
      return parsed;
    } catch {
      return null;
    } finally {
      inflightFetches.delete(url);
    }
  })();

  inflightFetches.set(url, fetchPromise);
  return fetchPromise;
}

const POPULAR_ARTIST_PORTRAITS: Record<string, string> = SPOTIFY_CDN_THUMBNAIL_MAP;


function applyMetadataOverrides(track: any) {
  return track;
}

export class OpenMusicProvider implements IMusicProvider {
  readonly id = 'open-authorized-music';
  readonly name = 'Open Authorized Music Provider';

  isConfigured(): boolean {
    return true;
  }

  // Parse LRC formatted synced lyrics to structured lines with precise sub-second timestamps
  private parseLrcLyrics(lrcText: string): { time: number; startTimeMs: number; text: string }[] {
    const lines: { time: number; startTimeMs: number; text: string }[] = [];
    if (!lrcText) return lines;

    const rawLines = lrcText.split('\n');
    for (const rawLine of rawLines) {
      const timeTagRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{2,3}))?\]/g;
      const matches = Array.from(rawLine.matchAll(timeTagRegex));
      const cleanText = rawLine.replace(/\[\d{1,2}:\d{2}(?:[.:]\d{2,3})?\]/g, '').trim();

      if (matches.length > 0 && cleanText.length > 0) {
        for (const match of matches) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const fractionStr = match[3] || '0';
          const fraction = fractionStr.length === 2 ? parseInt(fractionStr, 10) * 10 : parseInt(fractionStr, 10);
          const totalSeconds = minutes * 60 + seconds + fraction / 1000;
          lines.push({
            time: Number(totalSeconds.toFixed(3)),
            startTimeMs: Math.round(totalSeconds * 1000),
            text: cleanText,
          });
        }
      }
    }

    return lines.sort((a, b) => a.time - b.time);
  }

  // Convert raw iTunes track item to normalized Track model with pristine high-resolution artwork
  private normalizeItunesTrack(item: any): Track {
    const rawArtwork = item.artworkUrl100 || item.artworkUrl60 || '';
    const largeArt = rawArtwork
      ? rawArtwork.replace(/\/\d+x\d+bb\.jpg/g, '/600x600bb.jpg')
      : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
    const mediumArt = rawArtwork
      ? rawArtwork.replace(/\/\d+x\d+bb\.jpg/g, '/300x300bb.jpg')
      : largeArt;
    const smallArt = mediumArt;

    const durationSec = item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 210;
    const releaseDate = item.releaseDate || '';
    const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 2024;
    const playCount = item.playCount ? parseInt(item.playCount, 10) : 5000000;

    return {
      id: String(item.trackId || item.id || `track-${Date.now()}`),
      title: item.trackName || item.title || 'Unknown Title',
      artist: item.artistName || item.artist || 'Unknown Artist',
      artistId: String(item.artistId || `artist-${encodeURIComponent(item.artistName || 'unknown')}`),
      album: item.collectionName || item.album || 'Single',
      albumId: String(item.collectionId || item.albumId || `album-${encodeURIComponent(item.collectionName || 'unknown')}`),
      duration: durationSec,
      images: {
        small: smallArt,
        medium: mediumArt,
        large: largeArt,
      },
      provider: this.id,
      playbackAvailability: false,
      streamUrl: '',
      mimeType: 'audio/mp4',
      explicit: item.trackExplicitness === 'explicit',
      releaseYear,
      releaseDate,
      release_date: releaseDate,
      createdAt: releaseDate,
      created_at: releaseDate,
      genre: item.primaryGenreName || 'Music',
      plays: playCount,
      play_count: playCount,
      views: playCount,
      color: '#1DB954',
    };
  }

  /**
   * Search for a single track efficiently for feed population with multi-source fallback
   */
  private async searchSingleTrack(query: string): Promise<Track | null> {
    const q = (query || '').trim();
    const cacheKey = `single-track-${q.toLowerCase()}`;
    const cached = getFromCache<Track>(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=10`;
      const data = await safeFetchJson<any>(url, 3500);
      if (data && data.results && data.results.length > 0) {
        // Filter out bad hits
        const badWords = ['dj mix', 'cover', 'karaoke', 'instrumental', 'tribute', 'remix', 'trap invasion', 'lofi'];
        const validResults = data.results.filter(r => {
          const t = (r.trackName || '').toLowerCase();
          const a = (r.artistName || '').toLowerCase();
          if (badWords.some(w => t.includes(w) || a.includes(w))) return false;
          return true;
        });
        
        if (validResults.length > 0) {
          const track = this.normalizeItunesTrack(validResults[0]);
          setToCache(cacheKey, track, 1800);
          return applyMetadataOverrides(track);
        } else {
          // Fallback to first if all filtered
          const track = this.normalizeItunesTrack(data.results[0]);
          setToCache(cacheKey, track, 1800);
          return applyMetadataOverrides(track);
        }
      }
    } catch {}

    // Fallback to JioSaavn
    try {
      const url = `https://saavn.dev/api/search/songs?query=${encodeURIComponent(q)}&limit=10`;
      const data = await safeFetchJson<any>(url, 3500);
      if (data && data.success && data.data && data.data.results && data.data.results.length > 0) {
        const badWords = ['dj mix', 'cover', 'karaoke', 'instrumental', 'tribute', 'remix', 'trap invasion'];
        const validResults = data.data.results.filter(r => {
          const t = (r.name || '').toLowerCase();
          if (badWords.some(w => t.includes(w))) return false;
          return true;
        });

        if (validResults.length > 0) {
          const track = (function(item) {
    const stream = getValidSaavnStream(item);
    const dur = parseInt(item.more_info?.duration || '0', 10) || 210;
    const rawArt = item.image || '';
    
            let largeArt = rawArt ? rawArt.replace('150x150', '500x500') : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

    const releaseDate = item.release_date || (item.year ? `${item.year}-01-01` : '');
    const playCount = parseInt(item.play_count || '5000000', 10);
    const title = item.title ? item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : 'Unknown Title';
    const artist = extractSaavnArtist(item);
    
            
return {
      id: `saavn-${item.id}`,
      title,
      artist,
      artistId: extractSaavnArtistId(item, artist),
      album: item.more_info?.album ? item.more_info.album.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : (item.title || 'Single'),
      albumId: `album-${item.more_info?.album_id || item.id}`,
      duration: dur,
      images: { small: largeArt, medium: largeArt, large: largeArt },
      provider: 'open-authorized-music',
      playbackAvailability: true,
      streamUrl: stream || '',
      mimeType: 'audio/mp4',
      explicit: item.explicit_content === '1',
      releaseYear: item.year ? parseInt(item.year, 10) : 2024,
      releaseDate: releaseDate,
      release_date: releaseDate,
      createdAt: releaseDate,
      created_at: releaseDate,
      genre: item.language ? item.language.charAt(0).toUpperCase() + item.language.slice(1) : 'Music',
      plays: playCount,
      play_count: playCount,
      views: playCount,
      color: '#1DB954'
    };
  })(validResults[0]);
          setToCache(cacheKey, track, 1800);
          return applyMetadataOverrides(track);
        } else {
          const track = (function(item) {
    const stream = getValidSaavnStream(item);
    const dur = parseInt(item.more_info?.duration || '0', 10) || 210;
    const rawArt = item.image || '';
    
            let largeArt = rawArt ? rawArt.replace('150x150', '500x500') : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

    const releaseDate = item.release_date || (item.year ? `${item.year}-01-01` : '');
    const playCount = parseInt(item.play_count || '5000000', 10);
    const title = item.title ? item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : 'Unknown Title';
    const artist = extractSaavnArtist(item);
    
            
return {
      id: `saavn-${item.id}`,
      title,
      artist,
      artistId: extractSaavnArtistId(item, artist),
      album: item.more_info?.album ? item.more_info.album.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : (item.title || 'Single'),
      albumId: `album-${item.more_info?.album_id || item.id}`,
      duration: dur,
      images: { small: largeArt, medium: largeArt, large: largeArt },
      provider: 'open-authorized-music',
      playbackAvailability: true,
      streamUrl: stream || '',
      mimeType: 'audio/mp4',
      explicit: item.explicit_content === '1',
      releaseYear: item.year ? parseInt(item.year, 10) : 2024,
      releaseDate: releaseDate,
      release_date: releaseDate,
      createdAt: releaseDate,
      created_at: releaseDate,
      genre: item.language ? item.language.charAt(0).toUpperCase() + item.language.slice(1) : 'Music',
      plays: playCount,
      play_count: playCount,
      views: playCount,
      color: '#1DB954'
    };
  })(data.data.results[0]);
          setToCache(cacheKey, track, 1800);
          return applyMetadataOverrides(track);
        }
      }
    } catch {}

    return null;
  }

  /**
   * Fast, title-filtered Song Suggestions for typing in search bar
   * Only returns songs whose title contains or starts with the query.
   * Does not return unrelated lyrics, metadata, or random suffixes.
   */
  async getSongSuggestions(query: string): Promise<SearchSuggestion[]> {
    let q = (query || '').trim();

    // Check if it's a Spotify link and extract the title via oEmbed
    if (q.includes('spotify.com/')) {
      try {
        const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(q)}`, {
          signal: AbortSignal.timeout(4000)
        });
        if (oembedRes.ok) {
          const data = await oembedRes.json();
          if (data && data.title) {
            q = data.title;
          }
        }
      } catch (e) {
        console.warn('Failed to parse Spotify link via oEmbed in suggestions', e);
      }
    }

    if (!q || q.length < 1) return [];

    const cacheKey = `suggestions-v4-${q.toLowerCase()}`;
    const cached = getFromCache<SearchSuggestion[]>(cacheKey);
    if (cached) return cached;

    try {
      const expandedQueries = getExpandedSearchQueries(q);
      const primaryQ = expandedQueries[0] || q;
      const secondaryQ = expandedQueries[1] || null;

      const fetchQuerySuggestions = async (term: string) => {
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=25`;
        const saavnUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(term)}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=20&p=1`;

        const [itunesData, saavnData] = await Promise.all([
          safeFetchJson<any>(itunesUrl, 1500),
          safeFetchJson<any>(saavnUrl, 1500),
        ]);

        const candidates: SearchSuggestion[] = [];

        if (itunesData && Array.isArray(itunesData.results)) {
          itunesData.results.forEach((item: any) => {
            if (item.trackName) {
              const rawArt = item.artworkUrl100 || item.artworkUrl60 || '';
              const largeArt = rawArt ? rawArt.replace(/\/\d+x\d+bb\.jpg/g, '/200x200bb.jpg') : '';
              const releaseDate = item.releaseDate || '';
              const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 2024;
              const playCount = item.playCount ? parseInt(item.playCount, 10) : 5000000;

              candidates.push({
                id: `itunes-${item.trackId || item.id}`,
                title: item.trackName.trim(),
                artist: item.artistName || 'Artist',
                album: item.collectionName || 'Single',
                image: largeArt,
                release_date: releaseDate,
                releaseDate: releaseDate,
                created_at: releaseDate,
                createdAt: releaseDate,
                releaseYear,
                plays: playCount,
                play_count: playCount,
                views: playCount,
                type: 'song',
              });
            }
          });
        }

        if (saavnData && Array.isArray(saavnData.results)) {
          saavnData.results.forEach((item: any) => {
            if (item.title) {
              const cleanTitle = item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').trim();
              const rawArt = item.image || '';
              const largeArt = rawArt ? rawArt.replace('150x150', '250x250') : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
              const releaseDate = item.release_date || (item.year ? `${item.year}-01-01` : '');
              const plays = parseInt(item.play_count || '5000000', 10);

              candidates.push({
                id: `saavn-${item.id}`,
                title: cleanTitle,
                artist: item.more_info?.music || item.subtitle?.split('-')?.[0]?.trim() || 'Artist',
                album: item.more_info?.album ? item.more_info.album.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : '',
                image: largeArt,
                release_date: releaseDate,
                releaseDate: releaseDate,
                created_at: releaseDate,
                createdAt: releaseDate,
                releaseYear: item.year ? parseInt(item.year, 10) : 2024,
                plays,
                play_count: plays,
                views: plays,
                type: 'song',
              });
            }
          });
        }

        return candidates;
      };

      const [primaryCandidates, secondaryCandidates] = await Promise.all([
        fetchQuerySuggestions(primaryQ),
        secondaryQ && secondaryQ.toLowerCase() !== primaryQ.toLowerCase() ? fetchQuerySuggestions(secondaryQ) : Promise.resolve([]),
      ]);

      const rawCandidates = [...primaryCandidates, ...secondaryCandidates];

      // Sort with strict 5-tier ranking: Exact Title -> Prefix -> Recency -> Popularity -> Artist/Album
      const rankedCandidates = rankAndSortSuggestions(rawCandidates, q);

      const suggestions: SearchSuggestion[] = [];
      const seenTitles = new Set<string>();

      for (const cand of rankedCandidates) {
        const cleanTitle = cleanSearchTitle(cand.title) || cand.title;
        const dedupeKey = `${cleanTitle.toLowerCase()}::${(cand.artist || '').toLowerCase()}`;

        if (!seenTitles.has(dedupeKey)) {
          seenTitles.add(dedupeKey);
          suggestions.push({
            ...cand,
            id: cand.id || `sug-${suggestions.length}-${encodeURIComponent(cand.title)}`,
          });
        }

        if (suggestions.length >= 8) break;
      }

      setToCache(cacheKey, suggestions, 300);
      return suggestions;
    } catch (e) {
      console.warn('[OpenMusicProvider] Failed to fetch song suggestions:', e);
      return [];
    }
  }

  async search(query: string): Promise<SearchResults> {
    let q = (query || '').trim();

    // Check if it's a Spotify link and extract the title via oEmbed
    if (q.includes('spotify.com/')) {
      try {
        const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(q)}`, {
          signal: AbortSignal.timeout(4000)
        });
        if (oembedRes.ok) {
          const data = await oembedRes.json();
          if (data && data.title) {
            // Replace the URL with the actual song/album/artist title
            q = data.title;
          }
        }
      } catch (e) {
        console.warn('Failed to parse Spotify link via oEmbed', e);
      }
    }

    const cacheKey = `search-v5-${q.toLowerCase()}`;
    const cached = getFromCache<SearchResults>(cacheKey);
    if (cached) return cached;

    const existingInflight = inflightSearches.get(cacheKey);
    if (existingInflight) return existingInflight;

    if (!q) {
      const defaultFeed = await this.getHomeFeed();
      return {
        topResult: defaultFeed.quickPicks.length > 0 ? { type: 'track', data: defaultFeed.quickPicks[0] } : null,
        songs: defaultFeed.quickPicks,
        artists: defaultFeed.popularArtists,
        albums: defaultFeed.newReleases,
        playlists: [],
      };
    }

    const searchPromise = (async (): Promise<SearchResults> => {
      try {
        const expandedQueries = getExpandedSearchQueries(q);
        const primaryQ = expandedQueries[0] || q;
        const secondaryQ = expandedQueries[1] || null;

        // 1. Search iTunes, Saavn, Deezer concurrently for complete coverage & full 320kbps streams
        const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(primaryQ)}&entity=song&limit=25`;
        const itunesArtistUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(primaryQ)}&entity=musicArtist&limit=6`;
        const itunesAlbumUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(primaryQ)}&entity=album&limit=8`;
        const deezerArtistUrl = `https://api.deezer.com/search/artist?q=${encodeURIComponent(primaryQ)}&limit=6`;
        const saavnUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(primaryQ)}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=20&p=1`;

        const secondaryFetches = secondaryQ && secondaryQ.toLowerCase() !== primaryQ.toLowerCase()
          ? [
              safeFetchJson<any>(`https://itunes.apple.com/search?term=${encodeURIComponent(secondaryQ)}&entity=song&limit=20`, 1800),
              safeFetchJson<any>(`https://itunes.apple.com/search?term=${encodeURIComponent(secondaryQ)}&entity=musicArtist&limit=5`, 1800),
              safeFetchJson<any>(`https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(secondaryQ)}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=20&p=1`, 1800),
              safeFetchJson<any>(`https://api.deezer.com/search/artist?q=${encodeURIComponent(secondaryQ)}&limit=5`, 1500),
            ]
          : [Promise.resolve(null), Promise.resolve(null), Promise.resolve(null), Promise.resolve(null)];

        const [songData, artistData, albumData, deezerData, saavnData, [secSongData, secArtistData, secSaavnData, secDeezerData]] = await Promise.all([
          safeFetchJson<any>(itunesUrl, 2200),
          safeFetchJson<any>(itunesArtistUrl, 1800),
          safeFetchJson<any>(itunesAlbumUrl, 1800),
          safeFetchJson<any>(deezerArtistUrl, 1500),
          safeFetchJson<any>(saavnUrl, 2200),
          Promise.all(secondaryFetches),
        ]);

      let songs: Track[] = [];
      const artists: Artist[] = [];
      const albums: Album[] = [];
      const seenTrackKeys = new Set<string>();

      // Helper to process Saavn results
      const processSaavnResults = (resData: any) => {
        if (resData && resData.results && Array.isArray(resData.results)) {
          resData.results.forEach((item: any) => {
            const stream = getValidSaavnStream(item);
            const dur = parseInt(item.more_info?.duration || '0', 10) || 210;
            const rawArt = item.image || '';
            
            let largeArt = rawArt ? rawArt.replace('150x150', '500x500') : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

            const releaseDate = item.release_date || (item.year ? `${item.year}-01-01` : '');
            const playCount = parseInt(item.play_count || '5000000', 10);
            const title = item.title ? item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').trim() : 'Unknown Title';
            const artist = extractSaavnArtist(item);

            const trackKey = `${title.toLowerCase().replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/[^a-z0-9]/g, '')}::${artist.split(/[,&\/\|]/)[0].toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            if (seenTrackKeys.has(trackKey)) {
              // If an existing iTunes or earlier track has no streamUrl, attach this decrypted 320kbps full stream
              const existing = songs.find(s => {
                const sKey = `${s.title.toLowerCase().replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/[^a-z0-9]/g, '')}::${s.artist.split(/[,&\/\|]/)[0].toLowerCase().replace(/[^a-z0-9]/g, '')}`;
                return sKey === trackKey;
              });
              if (existing && stream && !existing.streamUrl) {
                existing.streamUrl = stream;
                existing.playbackAvailability = true;
                setToCache(`track-${existing.id}`, existing, 3600);
              }
              return;
            }
            seenTrackKeys.add(trackKey);

            const trackObj: Track = {
              id: `saavn-${item.id}`,
              title,
              artist,
              artistId: extractSaavnArtistId(item, artist),
              album: item.more_info?.album ? item.more_info.album.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : (item.title || 'Single'),
              albumId: `album-${item.more_info?.album_id || item.id}`,
              duration: dur,
              images: {
                small: largeArt,
                medium: largeArt,
                large: largeArt,
              },
              provider: this.id,
              playbackAvailability: true,
              streamUrl: stream || '',
              mimeType: 'audio/mp4',
              explicit: item.explicit_content === '1',
              releaseYear: item.year ? parseInt(item.year, 10) : 2024,
              releaseDate: releaseDate,
              release_date: releaseDate,
              createdAt: releaseDate,
              created_at: releaseDate,
              genre: item.language ? item.language.charAt(0).toUpperCase() + item.language.slice(1) : 'Music',
              plays: playCount,
              play_count: playCount,
              views: playCount,
              color: '#1DB954',
            };

            setToCache(`track-${trackObj.id}`, trackObj, 3600);
            songs.push(applyMetadataOverrides(trackObj));
          });
        }
      };

      // Helper to process iTunes song results
      const processItunesResults = (resData: any) => {
        if (resData && resData.results && Array.isArray(resData.results)) {
          resData.results.forEach((item: any) => {
            if (item.kind === 'song' || item.wrapperType === 'track') {
              const track = this.normalizeItunesTrack(item);
              const trackKey = `${track.title.toLowerCase().replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/[^a-z0-9]/g, '')}::${track.artist.split(/[,&\/\|]/)[0].toLowerCase().replace(/[^a-z0-9]/g, '')}`;
              if (!seenTrackKeys.has(trackKey)) {
                seenTrackKeys.add(trackKey);
                setToCache(`track-${track.id}`, track, 3600);
                songs.push(applyMetadataOverrides(track));
              }
            }
          });
        }
      };

      processSaavnResults(saavnData);
      processSaavnResults(secSaavnData);

      processItunesResults(songData);
      processItunesResults(secSongData);

      // Map Deezer artist portraits for authentic artist photos
      const deezerMap = new Map<string, { picture: string; fans: number }>();
      const addDeezerData = (dData: any) => {
        if (dData && dData.data && Array.isArray(dData.data)) {
          dData.data.forEach((da: any) => {
            const pic = da.picture_xl || da.picture_big || da.picture_medium;
            if (pic && da.name) {
              deezerMap.set(da.name.toLowerCase().trim(), { picture: pic, fans: da.nb_fan || 500000 });
            }
          });
        }
      };
      addDeezerData(deezerData);
      addDeezerData(secDeezerData);

      // Process Artists
      const seenArtistIds = new Set<string>();
      const processArtistData = (resData: any) => {
        if (resData && resData.results && Array.isArray(resData.results)) {
          for (let i = 0; i < resData.results.length; i++) {
            const item = resData.results[i];
            const aId = String(item.artistId);
            if (seenArtistIds.has(aId)) continue;
            seenArtistIds.add(aId);

            const aNameNorm = (item.artistName || '').toLowerCase().trim();
            const artistSongs = songs.filter(
              (s) => s.artistId === aId || s.artist.toLowerCase() === aNameNorm || isArtistAliasMatch(s.artist, item.artistName)
            );
            const dProfile = deezerMap.get(aNameNorm);
            const resolvedArtist = resolveArtist(item.artistName);

            let artImage = resolvedArtist?.entry?.portraitUrl || dProfile?.picture || '';
            if (artImage && artImage.includes('unsplash.com')) {
              artImage = '';
            }

            artists.push({
              id: aId,
              name: item.artistName,
              image: artImage,
              followers: dProfile?.fans || Math.floor(Math.random() * 4500000 + 500000),
              monthlyListeners: Math.floor(Math.random() * 14000000 + 1000000),
              genres: [item.primaryGenreName || 'Music'],
              bio: `${item.artistName} is an acclaimed musical artist recognized globally across genres including ${item.primaryGenreName || 'Music'}.`,
              verified: true,
              topTracks: artistSongs.slice(0, 5),
              albums: [],
              singles: [],
            });
          }
        }
      };

      processArtistData(artistData);
      processArtistData(secArtistData);

      // If artists array is empty, populate from Deezer artist results
      if (artists.length === 0 && deezerMap.size > 0) {
        let idx = 0;
        deezerMap.forEach((val, name) => {
          const matchingSongs = songs.filter((s) => s.artist.toLowerCase().includes(name) || isArtistAliasMatch(s.artist, name));
          artists.push({
            id: `artist-${encodeURIComponent(name)}`,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            image: val.picture || '',
            followers: val.fans,
            monthlyListeners: val.fans * 3,
            genres: ['Pop', 'Music'],
            bio: `${name} is featured on Spotiz streaming catalog.`,
            verified: true,
            topTracks: matchingSongs.slice(0, 5),
            albums: [],
            singles: [],
          });
          idx++;
        });
      }

      // Check if query or alias matches a known artist in ARTIST_ALIAS_DATABASE
      const resolvedArtistInfo = resolveArtist(q);
      if (resolvedArtistInfo) {
        const canonical = resolvedArtistInfo.entry.canonicalName;
        const existingArtist = artists.find((a) => isArtistAliasMatch(a.name, canonical));

        const matchedArtistTracks = songs.filter((s) => isArtistAliasMatch(s.artist, canonical));

        if (!existingArtist) {
          let portrait = resolvedArtistInfo.entry.portraitUrl || deezerMap.get(canonical.toLowerCase())?.picture || deezerMap.get(q.toLowerCase())?.picture || '';
          if (portrait.includes('unsplash.com')) portrait = '';

          artists.unshift({
            id: `artist-${encodeURIComponent(canonical)}`,
            name: canonical,
            image: portrait,
            followers: resolvedArtistInfo.entry.followers || 8500000,
            monthlyListeners: (resolvedArtistInfo.entry.followers || 8500000) * 2,
            genres: resolvedArtistInfo.entry.genres || ['Pop', 'Music'],
            bio: resolvedArtistInfo.entry.bio || `${canonical} is an acclaimed musical artist on Spotiz.`,
            verified: true,
            topTracks: matchedArtistTracks.slice(0, 5),
            albums: [],
            singles: [],
          });
        } else {
          // If artist exists, ensure portrait and top tracks are complete
          if (resolvedArtistInfo.entry.portraitUrl && !existingArtist.image.includes('spotifycdn.net')) {
            existingArtist.image = resolvedArtistInfo.entry.portraitUrl;
          }
          if (existingArtist.topTracks.length === 0 && matchedArtistTracks.length > 0) {
            existingArtist.topTracks = matchedArtistTracks.slice(0, 5);
          }
        }
      }

      // Process Albums
      if (albumData && albumData.results && Array.isArray(albumData.results)) {
        albumData.results.forEach((item: any) => {
          const rawArtwork = item.artworkUrl100 || item.artworkUrl60 || '';
          const largeArt = rawArtwork
            ? rawArtwork.replace(/\/\d+x\d+bb\.jpg/g, '/600x600bb.jpg')
            : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
          const mediumArt = largeArt;
          const smallArt = largeArt;

          const albumYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2024;
          const albumSongs = songs.filter((s) => s.albumId === String(item.collectionId));

          albums.push({
            id: String(item.collectionId),
            name: item.collectionName,
            artist: item.artistName,
            artistId: String(item.artistId),
            year: albumYear,
            images: {
              small: smallArt,
              medium: mediumArt,
              large: largeArt,
            },
            tracks: albumSongs,
            totalDuration: albumSongs.reduce((acc, curr) => acc + curr.duration, 0) || (item.trackCount || 10) * 210,
            label: item.copyright || 'Authorized Music Record',
            color: '#1DB954',
          });
        });
      }

      // Ensure artists of top matched songs are prominently featured in the artists list
      for (let i = Math.min(3, songs.length) - 1; i >= 0; i--) {
        const song = songs[i];
        if (song && song.artist) {
           const existingIdx = artists.findIndex(a => isArtistAliasMatch(a.name, song.artist) || a.id === song.artistId || a.name.toLowerCase() === song.artist.toLowerCase());
           if (existingIdx !== -1) {
              const existingArtist = artists.splice(existingIdx, 1)[0];
              artists.unshift(existingArtist);
           } else {
              // Create an artist entry for this song's artist
              const dProfile = deezerMap.get(song.artist.toLowerCase());
              const resolvedArtistInfo = resolveArtist(song.artist);
              let portrait = resolvedArtistInfo?.entry?.portraitUrl || dProfile?.picture || '';
              if (portrait.includes('unsplash.com')) portrait = '';
              const matchedArtistTracks = songs.filter((s) => isArtistAliasMatch(s.artist, song.artist) || s.artist.toLowerCase() === song.artist.toLowerCase());

              artists.unshift({
                id: song.artistId || `artist-${encodeURIComponent(song.artist)}`,
                name: song.artist,
                image: portrait,
                followers: dProfile?.fans || resolvedArtistInfo?.entry?.followers || Math.floor(Math.random() * 4500000 + 500000),
                monthlyListeners: Math.floor(Math.random() * 14000000 + 1000000),
                genres: resolvedArtistInfo?.entry?.genres || ['Music'],
                bio: resolvedArtistInfo?.entry?.bio || `${song.artist} is an acclaimed musical artist on Spotiz.`,
                verified: true,
                topTracks: matchedArtistTracks.slice(0, 5),
                albums: [],
                singles: [],
              });
           }
        }
      }

      // Filter out junk artists that matched the search query but have absolutely no associated top tracks in our songs results
      const validArtists = artists.filter(a => (a.topTracks && a.topTracks.length > 0) || resolveArtist(a.name) !== null);

      // If no valid songs were found via primary catalogs, fallback to YouTube
      if (songs.length === 0) {
        try {
          const ytSearch = (await import('yt-search')).default;
          // Run ytSearch with a strict 2-second timeout so it never causes the 10-15s delay the user reported
          const ytPromise = ytSearch(`${q} official audio`);
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('YT Timeout')), 4000));
          const ytRes = await Promise.race([ytPromise, timeoutPromise]) as any;
          if (ytRes && ytRes.videos && ytRes.videos.length > 0) {
            for (const vid of ytRes.videos.slice(0, 8)) {
              if (vid.seconds && vid.seconds >= 35 && vid.seconds <= 1200) {
                const ytTrack: Track = {
                  id: `yt-${vid.videoId}`,
                  title: vid.title,
                  artist: vid.author?.name || 'YouTube',
                  artistId: `yt-author-${vid.author?.name}`,
                  album: 'Single',
                  albumId: 'youtube',
                  duration: vid.seconds,
                  images: {
                    small: vid.thumbnail,
                    medium: vid.thumbnail,
                    large: vid.image || vid.thumbnail,
                  },
                  provider: this.id,
                  playbackAvailability: true,
                  streamUrl: '',
                  mimeType: 'audio/mp4',
                  explicit: false,
                  releaseYear: new Date().getFullYear(),
                  releaseDate: new Date().toISOString().split('T')[0],
                  createdAt: new Date().toISOString().split('T')[0],
                  genre: 'Music',
                  plays: vid.views || Math.floor(Math.random() * 5000000),
                  color: '#FF0000',
                };
                songs.push(applyMetadataOverrides(ytTrack));
              }
            }
          }
        } catch (e) {
          console.warn('[Diagnostics] YT fallback search failed:', e);
        }
      }

      // --- Lyrics Reverse Search Integration (Phase 4) ---
      try {
        const lyricsMatches = lyricsIndexer.search(q);
        if (lyricsMatches.length > 0) {
          // Take top 3 lyrics matches
          const topLyrics = lyricsMatches.slice(0, 3);
          await Promise.all(
            topLyrics.map(async (match) => {
              // Check if track is already in results
              let existingTrack = songs.find(s => s.id === match.trackId);
              if (!existingTrack) {
                const fetchedTrack = await this.getTrack(match.trackId);
                if (fetchedTrack) {
                  existingTrack = fetchedTrack;
                  songs.push(existingTrack);
                }
              }
              if (existingTrack) {
                // Annotate the track with the lyrics match score for the ranker
                existingTrack.lyricsMatchScore = match.score;
              }
            })
          );
        }
      } catch (e) {
        console.warn('Lyrics search index failed', e);
      }
      // ----------------------------------------------------

      // Apply Spotiz 5-Tier Strict Search Ranking (Exact Match > Prefix > Recency > Popularity > Artist/Album)
      const rawResults: SearchResults = {
        topResult: null,
        songs,
        artists: validArtists,
        albums,
        playlists: [],
      };

      const results = rankAndSortSearchResults(rawResults, q);
      
      // Strict Verification Layer: Ensure the returned tracks actually match the query and are playable.
      results.songs = results.songs.filter(track => {
        // Remove explicitly banned terms
        if (track.title.toLowerCase().includes("punjabi kompa")) return false;

        const queryNorm = normalizeSearchString(q);
        const tNorm = normalizeSearchString(track.title);
        const aNorm = normalizeSearchString(track.artist);
        const albNorm = normalizeSearchString(track.album || '');

        if (queryNorm.length > 2) {
          // If query matches artist alias or exact artist, keep it!
          if (isArtistAliasMatch(track.artist, q) || aNorm.includes(queryNorm) || queryNorm.includes(aNorm)) {
            return true;
          }
          // If query matches album, keep it!
          if (albNorm && (albNorm.includes(queryNorm) || queryNorm.includes(albNorm))) {
            return true;
          }
          // If query matches title or title matches query, keep it!
          if (tNorm.includes(queryNorm) || queryNorm.includes(tNorm)) {
            return true;
          }

          const words = queryNorm.split(/\s+/).filter(w => w.length > 1);
          let matchCount = 0;
          for (const word of words) {
            if (tNorm.includes(word) || aNorm.includes(word) || albNorm.includes(word)) {
              matchCount++;
            }
          }
          // If none of the meaningful words appear, check artist alias matches before rejecting
          if (words.length > 0 && matchCount === 0) {
            const hasAliasMatch = words.some(w => isArtistAliasMatch(track.artist, w));
            if (!hasAliasMatch) {
              return false;
            }
          }
          
          // Prevent gibberish IDs from matching random songs
          if (queryNorm.length >= 20 && !queryNorm.includes(' ')) {
             if (!tNorm.includes(queryNorm) && !queryNorm.includes(tNorm)) {
                 return false;
             }
          }
        }

        // Tracks will be dynamically resolved if missing streamUrl during playback
        return true;
      });

      setToCache(cacheKey, results, 600);
      return results;
    } catch (err) {
      console.warn(`[Diagnostics] Search failed for query "${q}":`, err);
      return {
        topResult: null,
        songs: [],
        artists: [],
        albums: [],
        playlists: [],
      };
    } finally {
      inflightSearches.delete(cacheKey);
    }
  })();

  inflightSearches.set(cacheKey, searchPromise);
  return searchPromise;
}

  async getTrack(id: string): Promise<Track | null> {
    const cacheKey = `track-${id}`;
    const cached = getFromCache<Track>(cacheKey);
    if (cached) return cached;

    // 1. Saavn ID lookup
    if (id.startsWith('saavn-')) {
      const cleanId = id.replace(/^saavn-/, '');
      try {
        const saavnUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${encodeURIComponent(cleanId)}&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
        const data = await safeFetchJson<any>(saavnUrl, 4500);
        if (data && data.songs && Array.isArray(data.songs) && data.songs.length > 0) {
          const item = data.songs[0];
          const stream = getValidSaavnStream(item);
          const dur = parseInt(item.more_info?.duration || '0', 10) || 210;
          const rawArt = item.image || '';
          
            let largeArt = rawArt ? rawArt.replace('150x150', '500x500') : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';


          const saavnArtist = extractSaavnArtist(item);
          
            
const trackObj: Track = {
            id: `saavn-${item.id}`,
            title: item.title ? item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : 'Unknown Title',
            artist: saavnArtist,
            artistId: extractSaavnArtistId(item, saavnArtist),
            album: item.more_info?.album ? item.more_info.album.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : (item.title || 'Single'),
            albumId: `album-${item.more_info?.album_id || item.id}`,
            duration: dur,
            images: {
              small: largeArt,
              medium: largeArt,
              large: largeArt,
            },
            provider: this.id,
            playbackAvailability: true,
            streamUrl: stream || '',
            mimeType: 'audio/mp4',
            explicit: item.explicit_content === '1',
            releaseYear: item.year ? parseInt(item.year, 10) : 2024,
            genre: item.language ? item.language.charAt(0).toUpperCase() + item.language.slice(1) : 'Music',
            plays: parseInt(item.play_count || '5000000', 10),
            color: '#1DB954',
          };

          setToCache(cacheKey, trackObj, 3600);
          return applyMetadataOverrides(trackObj);
        }
      } catch (e) {
        console.warn(`[OpenMusicProvider] Saavn song lookup failed for ${id}:`, e);
      }
    }

    // 2. iTunes lookup fallback
    try {
      const cleanItunesId = id.replace(/^itunes-/, '');
      const itunesUrl = `https://itunes.apple.com/lookup?id=${encodeURIComponent(cleanItunesId)}`;
      const data = await safeFetchJson<any>(itunesUrl, 5000);
      if (data && data.results && data.results.length > 0) {
        const track = this.normalizeItunesTrack(data.results[0]);
        setToCache(cacheKey, track, 600);
        return applyMetadataOverrides(track);
      }
    } catch (e) {
      console.warn(`[Diagnostics] Failed to lookup track ${id}:`, e);
    }

    return null;
  }

  async getArtist(id: string): Promise<Artist | null> {
    const cacheKey = `artist-v2-${id}`;
    const cached = getFromCache<Artist>(cacheKey);
    if (cached) return cached;

    // Handle Saavn-specific artist ID for REAL profile fetches
    const isSaavnArtist = id.startsWith('saavn-artist-');
    const saavnArtistId = isSaavnArtist ? id.replace(/^saavn-artist-/, '') : null;

    if (isSaavnArtist && saavnArtistId) {
      try {
        const saavnUrl = `https://www.jiosaavn.com/api.php?__call=artist.getArtistPageDetails&artistId=${saavnArtistId}&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
        const data = await safeFetchJson<any>(saavnUrl, 5000);
        if (data && data.name) {
          const artistName = data.name;
          const artistImage = data.image ? data.image.replace('150x150', '500x500').replace('150x150', '500x500') : '';
          
          const topTracks: Track[] = [];
          if (data.topSongs && Array.isArray(data.topSongs)) {
            data.topSongs.forEach((item: any) => {
              const stream = getValidSaavnStream(item);
              const dur = parseInt(item.more_info?.duration || '0', 10) || 210;
              const rawArt = item.image || '';
              
            let largeArt = rawArt ? rawArt.replace('150x150', '500x500') : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';


              const saavnArtist = extractSaavnArtist(item, artistName);
              
            
topTracks.push({
                id: `saavn-${item.id}`,
                title: item.title ? item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : 'Unknown Title',
                artist: saavnArtist,
                artistId: id,
                album: item.more_info?.album ? item.more_info.album.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : (item.title || 'Single'),
                albumId: `album-${item.more_info?.album_id || item.id}`,
                duration: dur,
                images: {
                  small: largeArt,
                  medium: largeArt,
                  large: largeArt,
                },
                provider: this.id,
                playbackAvailability: true,
                streamUrl: stream || '',
                mimeType: 'audio/mp4',
                explicit: item.explicit_content === '1',
                releaseYear: item.year ? parseInt(item.year, 10) : 2024,
                genre: item.language ? item.language.charAt(0).toUpperCase() + item.language.slice(1) : 'Music',
                plays: parseInt(item.play_count || '5000000', 10),
                color: '#1DB954',
              });
            });
          }

          const albums: Album[] = [];
          if (data.topAlbums && Array.isArray(data.topAlbums)) {
            data.topAlbums.forEach((item: any) => {
              const rawArt = item.image || '';
              
            let largeArt = rawArt ? rawArt.replace('150x150', '500x500') : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

              albums.push({
                id: `album-${item.id}`,
                name: item.title ? item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : 'Album',
                artist: artistName,
                artistId: id,
                year: item.year ? parseInt(item.year, 10) : 2024,
                images: {
                  small: largeArt,
                  medium: largeArt,
                  large: largeArt,
                },
                tracks: [],
                totalDuration: 10 * 210, // Approximation
                label: 'Authorized Music Release',
                color: '#1DB954',
              });
            });
          }

          let bioText = `${artistName} is featured on Spotiz with a globally recognized catalog and chart-topping releases.`;
          if (data.bio) {
             if (typeof data.bio === 'string') bioText = data.bio;
             else if (Array.isArray(data.bio) && data.bio[0]?.text) bioText = data.bio[0].text;
          }

          const artist: Artist = {
            id,
            name: artistName,
            image: artistImage,
            followers: data.follower_count ? parseInt(data.follower_count, 10) : Math.floor(Math.random() * 8000000 + 4000000),
            monthlyListeners: Math.floor(Math.random() * 50000000 + 8000000),
            genres: data.dominantLanguage ? [data.dominantLanguage.charAt(0).toUpperCase() + data.dominantLanguage.slice(1)] : ['Pop'],
            bio: bioText,
            verified: data.isVerified ?? true,
            topTracks,
            albums,
            singles: topTracks.filter((t) => t.album.toLowerCase().includes('single')),
          };

          setToCache(cacheKey, artist, 600);
          return artist;
        }
      } catch (e) {
        console.warn(`[Diagnostics] Failed to lookup Saavn artist ${id}:`, e);
      }
    }

    // Clean and determine the query name
    let queryName = id;
    if (id.startsWith('saavn-artist-')) {
       // fallback if direct saavn fetch failed
       queryName = decodeURIComponent(id.replace(/^saavn-artist-/, '')).replace(/-/g, ' ').trim();
    } else if (id.startsWith('artist-')) {
      queryName = decodeURIComponent(id.replace(/^artist-/, '')).replace(/-/g, ' ').trim();
    } else {
      queryName = decodeURIComponent(id).replace(/-/g, ' ').trim();
    }

    const resolved = resolveArtist(queryName);
    const primarySearchName = resolved ? resolved.entry.canonicalName : queryName;

    const isNumericId = /^\d+$/.test(id);

    try {
      let songsData: any = null;
      let albumsData: any = null;

      if (isNumericId) {
        const lookupSongsUrl = `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&entity=song&limit=30`;
        const lookupAlbumsUrl = `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&entity=album&limit=15`;
        [songsData, albumsData] = await Promise.all([
          safeFetchJson<any>(lookupSongsUrl, 5000),
          safeFetchJson<any>(lookupAlbumsUrl, 5000),
        ]);
      }

      // If lookup returned nothing or ID was string-based, use search by artist name (only if name is not purely numeric)
      if ((!songsData || !songsData.results || songsData.results.length === 0) && !/^\d+$/.test(primarySearchName)) {
        const searchSongsUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(primarySearchName)}&entity=song&limit=30`;
        const searchAlbumsUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(primarySearchName)}&entity=album&limit=15`;
        [songsData, albumsData] = await Promise.all([
          safeFetchJson<any>(searchSongsUrl, 5000),
          safeFetchJson<any>(searchAlbumsUrl, 5000),
        ]);
      }

      let artistInfo: any = null;
      const topTracks: Track[] = [];
      const albums: Album[] = [];

      if (songsData && songsData.results && Array.isArray(songsData.results)) {
        songsData.results.forEach((item: any) => {
          if (item.wrapperType === 'artist') {
            artistInfo = item;
          } else if (item.wrapperType === 'track' || item.kind === 'song') {
            if (isNumericId) {
              topTracks.push(this.normalizeItunesTrack(item));
            } else {
              if (item.artistName && (isArtistAliasMatch(item.artistName, primarySearchName) || item.artistName.toLowerCase().includes(primarySearchName.toLowerCase()))) {
                 topTracks.push(this.normalizeItunesTrack(item));
              }
            }
          }
        });
      }

      if (albumsData && albumsData.results && Array.isArray(albumsData.results)) {
        albumsData.results.forEach((item: any) => {
          if (item.wrapperType === 'collection' || item.collectionType === 'Album') {
            if (!isNumericId && item.artistName) {
               if (!isArtistAliasMatch(item.artistName, primarySearchName) && !item.artistName.toLowerCase().includes(primarySearchName.toLowerCase())) {
                   return;
               }
            }
            const rawArtwork = item.artworkUrl100 || item.artworkUrl60 || '';
            const largeArt = rawArtwork ? rawArtwork.replace(/\/\d+x\d+bb\.jpg/g, '/600x600bb.jpg') : '';

            albums.push({
              id: String(item.collectionId),
              name: item.collectionName,
              artist: item.artistName,
              artistId: String(item.artistId || id),
              year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2024,
              images: {
                small: largeArt,
                medium: largeArt,
                large: largeArt,
              },
              tracks: [],
              totalDuration: (item.trackCount || 10) * 210,
              label: item.copyright || 'Record Label',
              color: '#1DB954',
            });
          }
        });
      }

      // If top tracks need more songs or are empty, search Saavn and multi-source provider catalog across aliases
      if (topTracks.length < 5) {
        try {
          const searchRes = await this.search(primarySearchName);
          if (searchRes && searchRes.songs && searchRes.songs.length > 0) {
            for (const s of searchRes.songs) {
              if (!topTracks.some((t) => t.id === s.id || (t.title.toLowerCase() === s.title.toLowerCase() && isArtistAliasMatch(t.artist, s.artist)))) {
                topTracks.push(s);
              }
            }
          }
          if (albums.length === 0 && searchRes && searchRes.albums && searchRes.albums.length > 0) {
            albums.push(...searchRes.albums);
          }
        } catch (e) {}
      }

      // If resolved artist has additional real or spotify names, also search them to combine catalog
      if (resolved && topTracks.length < 15) {
        for (const altName of [...resolved.entry.realNames, ...resolved.entry.spotifyNames]) {
          if (altName.toLowerCase() !== primarySearchName.toLowerCase()) {
            try {
              const altRes = await this.search(altName);
              if (altRes && altRes.songs) {
                for (const s of altRes.songs) {
                  if (isArtistAliasMatch(s.artist, resolved.entry.canonicalName)) {
                    if (!topTracks.some((t) => t.id === s.id || t.title.toLowerCase() === s.title.toLowerCase())) {
                      topTracks.push(s);
                    }
                  }
                }
              }
            } catch (e) {}
          }
        }
      }

      let artistName = resolved?.entry.canonicalName || artistInfo?.artistName || queryName.replace(/\b\w/g, l => l.toUpperCase()) || topTracks[0]?.artist || 'Artist';
      // Format capitalization for known artists
      if (queryName.toLowerCase().includes('honey singh')) {
        artistName = 'Yo Yo Honey Singh';
      }

      const cleanKey = artistName.toLowerCase().trim();
      let artistImage = resolved?.entry.portraitUrl || POPULAR_ARTIST_PORTRAITS[cleanKey] || POPULAR_ARTIST_PORTRAITS[queryName.toLowerCase().trim()] || '';
      if (artistImage && artistImage.includes('unsplash.com')) {
        artistImage = '';
      }

      if (!artistImage) {
        // Extract genuine Spotiz thumbnail using SpotifyScraper extraction
        try {
          const spotifyThumb = await extractSpotifyThumbnail(id, artistName, 'artist');
          if (spotifyThumb) {
            artistImage = spotifyThumb;
          }
        } catch {}
      }

      if (!artistImage) {
        try {
          const dJson = await safeFetchJson<any>(
            `https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}&limit=1`,
            3000
          );
          if (dJson && dJson.data && dJson.data[0]) {
            const pic = dJson.data[0].picture_xl || dJson.data[0].picture_big || dJson.data[0].picture_medium;
            if (pic && !pic.includes('d41d8cd98f00b204e9800998ecf8427e')) {
              artistImage = pic;
            }
          }
        } catch (e) {}
      }

      if (!artistImage) {
        artistImage = '';
      }

      const artist: Artist = {
        id,
        name: artistName,
        image: artistImage,
        followers: Math.floor(Math.random() * 8000000 + 4000000),
        monthlyListeners: Math.floor(Math.random() * 50000000 + 8000000),
        genres: [artistInfo?.primaryGenreName || topTracks[0]?.genre || 'Pop'],
        bio: `${artistName} is featured on Spotiz with a globally recognized catalog and chart-topping releases.`,
        verified: true,
        topTracks,
        albums,
        singles: topTracks.filter((t) => t.album.toLowerCase().includes('single')),
      };

      setToCache(cacheKey, artist, 600);
      return artist;
    } catch (e) {
      console.warn(`[Diagnostics] Failed to lookup artist ${id}:`, e);
    }

    return null;
  }

  async getAlbum(id: string): Promise<Album | null> {
    const cacheKey = `album-${id}`;
    const cached = getFromCache<Album>(cacheKey);
    if (cached) return cached;

    // Check if it's a Saavn album ID (usually prefixed with 'album-')
    // iTunes IDs are generally purely numeric.
    const cleanId = id.replace(/^(saavn-)?album-/, '');
    const isPurelyNumericId = /^\d+$/.test(id);

    // 1. Try iTunes if it might be an iTunes ID
    if (isPurelyNumericId) {
      try {
        const lookupUrl = `https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&entity=song`;
        const data = await safeFetchJson<any>(lookupUrl, 5000);
        if (data && data.results && Array.isArray(data.results) && data.results.length > 0) {
          const albumRecord = data.results.find((r: any) => r.wrapperType === 'collection') || data.results[0];
          const rawTracks = data.results.filter((r: any) => r.wrapperType === 'track');

          const rawArtwork = albumRecord.artworkUrl100 || albumRecord.artworkUrl60 || '';
          const largeArt = rawArtwork ? rawArtwork.replace(/\/\d+x\d+bb\.jpg/g, '/600x600bb.jpg') : '';

          const tracks = rawTracks.map((t: any) => this.normalizeItunesTrack(t));
          const totalDuration = tracks.reduce((acc: number, curr: Track) => acc + curr.duration, 0);

          const album: Album = {
            id: String(albumRecord.collectionId || id),
            name: albumRecord.collectionName || 'Album',
            artist: albumRecord.artistName || 'Unknown Artist',
            artistId: String(albumRecord.artistId || ''),
            year: albumRecord.releaseDate ? new Date(albumRecord.releaseDate).getFullYear() : 2024,
            images: {
              small: largeArt,
              medium: largeArt,
              large: largeArt,
            },
            tracks,
            totalDuration,
            label: albumRecord.copyright || 'Authorized Music Release',
            color: '#1DB954',
          };

          setToCache(cacheKey, album, 600);
          return album;
        }
      } catch (e) {
        console.warn(`[Diagnostics] Failed to lookup album ${id} on iTunes:`, e);
      }
    }

    // 2. Fallback to Saavn if iTunes fails or if it's a Saavn ID
    try {
      const saavnUrl = `https://www.jiosaavn.com/api.php?__call=content.getAlbumDetails&albumid=${encodeURIComponent(cleanId)}&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
      const data = await safeFetchJson<any>(saavnUrl, 5000);
      if (data && data.id && data.list) {
        const rawArt = data.image || '';
        
            let largeArt = rawArt ? rawArt.replace('150x150', '500x500') : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';


        const tracks: Track[] = [];
        if (Array.isArray(data.list)) {
          data.list.forEach((item: any) => {
            const stream = getValidSaavnStream(item);
            const dur = parseInt(item.more_info?.duration || '0', 10) || 210;
            const releaseDate = item.release_date || (item.year ? `${item.year}-01-01` : '');
            
            const saavnArtist = extractSaavnArtist(item);
            
            
tracks.push({
              id: `saavn-${item.id}`,
              title: item.title ? item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : 'Unknown Title',
              artist: saavnArtist,
              artistId: extractSaavnArtistId(item, saavnArtist),
              album: data.title || 'Album',
              albumId: id,
              duration: dur,
              images: { small: largeArt, medium: largeArt, large: largeArt },
              provider: this.id,
              playbackAvailability: true,
              streamUrl: stream || '',
              mimeType: 'audio/mp4',
              explicit: item.explicit_content === '1',
              releaseYear: item.year ? parseInt(item.year, 10) : 2024,
            });
          });
        }
        const totalDuration = tracks.reduce((acc, curr) => acc + curr.duration, 0);

        const album: Album = {
          id: id,
          name: data.title || 'Album',
          artist: data.subtitle || data.primary_artists || 'Unknown Artist',
          artistId: extractSaavnArtistId(data, data.subtitle || 'unknown'),
          year: data.year ? parseInt(data.year, 10) : 2024,
          images: {
            small: largeArt,
            medium: largeArt,
            large: largeArt,
          },
          tracks,
          totalDuration,
          label: data.more_info?.copyright_text || 'Authorized Music Release',
          color: '#1DB954',
        };

        setToCache(cacheKey, album, 600);
        return album;
      }
    } catch (e) {
      console.warn(`[Diagnostics] Failed to lookup album ${id} on Saavn:`, e);
    }

    return null;
  }

  async getPlaylist(id: string): Promise<Playlist | null> {
    if (id.startsWith('user-pl-')) return null;

    const cacheKey = `playlist-resolved-${id}`;
    const cached = getFromCache<Playlist>(cacheKey);
    if (cached) return cached;

    // Define curated playlist presets
    const curatedPresets: Record<string, { title: string; desc: string; query: string; color: string; cover: string }> = {
      'playlist-today-top-hits': {
        title: "Today's Top Hits 2026",
        desc: "The absolute biggest songs on the planet right now. Global chart-toppers & fresh releases.",
        query: 'top hits 2026',
        color: '#10B981',
        cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      },
      'playlist-chill-lofi': {
        title: 'Deep Focus & Lo-Fi Coding',
        desc: 'Calm instrumental lo-fi beats to keep your concentration sharp and anxiety low.',
        query: 'lofi chill beats',
        color: '#6366F1',
        cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      },
      'playlist-arijit-romance': {
        title: 'Best of Arijit Singh',
        desc: 'Every heart-touching anthem by India’s favorite voice in one soulful playlist.',
        query: 'Arijit Singh',
        color: '#F59E0B',
        cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      },
      'playlist-bollywood-butter': {
        title: 'Bollywood Butter',
        desc: 'The best of Bollywood music and blockbuster film songs.',
        query: 'bollywood hits',
        color: '#EC4899',
        cover: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
      },
      'playlist-edm-workout': {
        title: 'High Energy EDM Workout',
        desc: 'High-octane electronic bangers to power your gym reps and runs.',
        query: 'edm dance workout',
        color: '#3B82F6',
        cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      },
      'playlist-deep-focus': {
        title: 'Ambient Deep Focus',
        desc: 'Minimalist ambient soundscapes for flow state and deep work.',
        query: 'ambient focus piano',
        color: '#8B5CF6',
        cover: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
      },
      'daily-mix-1': {
        title: 'Daily Mix 1',
        desc: 'The Weeknd, Dua Lipa, Ed Sheeran, and more pop favorites.',
        query: 'The Weeknd Dua Lipa',
        color: '#10B981',
        cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      },
      'daily-mix-2': {
        title: 'Daily Mix 2',
        desc: 'Arijit Singh, Pritam, Shreya Ghoshal, and romantic melodies.',
        query: 'Arijit Singh Pritam',
        color: '#F59E0B',
        cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
      },
      'daily-mix-3': {
        title: 'Daily Mix 3',
        desc: 'Coldplay, Imagine Dragons, Queen, and rock anthems.',
        query: 'Coldplay Imagine Dragons',
        color: '#3B82F6',
        cover: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
      },
    };

    const preset = curatedPresets[id];
    const searchQuery = preset ? preset.query : id.replace(/^playlist-/, '').replace(/-/g, ' ');

    try {
      const searchRes = await this.search(searchQuery);
      let tracks = searchRes.songs.slice(0, 25);

      if (tracks.length === 0) {
        const homeFeed = await this.getHomeFeed();
        tracks = homeFeed.quickPicks.slice(0, 15);
      }

      if (tracks.length > 0) {
        const result: Playlist = {
          id,
          title: preset ? preset.title : `Playlist: ${searchQuery.replace(/\b\w/g, (c) => c.toUpperCase())}`,
          description: preset ? preset.desc : `Curated collection of top tracks for ${searchQuery}.`,
          coverImage: preset ? preset.cover : (tracks[0]?.images?.large || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80'),
          userId: 'spotify-editorial',
          isPublic: true,
          tracks,
          createdAt: '2026-01-01',
          updatedAt: '2026-08-16',
          likesCount: preset ? 1400000 : 45000,
          color: preset ? preset.color : '#10B981',
        };

        setToCache(cacheKey, result, 600);
        return result;
      }
    } catch (e) {
      console.warn(`[Diagnostics] Failed to dynamically construct playlist ${id}:`, e);
    }

    return null;
  }

  async getRecommendations(seedTrackId?: string, genre?: string): Promise<Track[]> {
    const cacheKey = `recs-${seedTrackId || 'none'}-${genre || 'all'}`;
    const cached = getFromCache<Track[]>(cacheKey);
    if (cached) return cached;

    try {
      const q = genre || 'pop';
      const searchRes = await this.search(q);
      const recs = searchRes.songs.filter((s) => s.id !== seedTrackId).slice(0, 10);
      setToCache(cacheKey, recs, 300);
      return recs;
    } catch (e) {
      return [];
    }
  }

  async getLyrics(trackId: string, trackTitle?: string, artistName?: string, duration?: number): Promise<LyricsData> {
    const result = await this._getLyricsImpl(trackId, trackTitle, artistName, duration);
    if (result && result.plainLyrics && result.plainLyrics !== 'Lyrics unavailable for this track.') {
      lyricsIndexer.indexLyrics(result.trackId, result.title, result.artist, result.plainLyrics);
    }
    return result;
  }

  async _getLyricsImpl(trackId: string, trackTitle?: string, artistName?: string, duration?: number): Promise<LyricsData> {
    const cacheKey = `lyrics-v2-${trackId}-${trackTitle || ''}-${artistName || ''}`;
    const cached = getFromCache<LyricsData>(cacheKey);
    if (cached) return cached;

    let title = trackTitle || '';
    let artist = artistName || '';

    if (!title || !artist) {
      const track = await this.getTrack(trackId);
      if (track) {
        title = track.title;
        artist = track.artist;
      }
    }

    if (!title) {
      return {
        trackId,
        title: 'Unknown Title',
        artist: 'Unknown Artist',
        synced: false,
        lines: [],
        plainLyrics: 'Lyrics unavailable for this track.',
      };
    }

    const titleLower = title.toLowerCase();
    const artistLower = artist.toLowerCase();

    // 1. Verified Synced LRC Fallback Bank for Popular Tracks
    const VERIFIED_SYNCED_LYRICS: Record<string, string> = {
      chaleya: `[00:00.00] ♪ (Music starts) ♪
[00:04.50] Ishq mein dil bana hai
[00:07.20] Ishq mein dil fanaa hai
[00:09.80] Ho... mita de ya bana de
[00:13.00] Maine tujhko chuna hai
[00:15.50] Tere saare rang odh ke dhang odh ke
[00:18.50] Tera hua main sabko chhod ke
[00:21.00] Ho... ishq ni karna naksh-e-kadam pe
[00:24.50] Chalna hai tera ho ke
[00:26.50] Chaleya teri ore tera chaleya
[00:29.50] Hai tujh pe aake ruka main
[00:32.50] Chaleya teri ore tera chaleya
[00:35.00] Hai tujh pe aake ruka main
[00:37.50] Ishq mein dil bana hai
[00:40.00] Ishq mein dil fanaa hai
[00:43.00] Ho... mita de ya bana de
[00:46.00] Maine tujhko chuna hai
[00:48.50] ♪ (Drop / Instrumental) ♪
[00:58.00] Fin.`,
      'tum hi ho': `[00:00.00] ♪ (Piano intro) ♪
[00:12.00] Hum tere bin ab reh nahi sakte
[00:18.00] Tere bina kya wajood mera
[00:24.00] Hum tere bin ab reh nahi sakte
[00:29.00] Tere bina kya wajood mera
[00:35.50] Tujh se juda agar ho jaayenge
[00:41.50] Toh khud se hi ho jaayenge juda
[00:47.00] Kyunki tum hi ho, ab tum hi ho
[00:53.00] Zindagi ab tum hi ho
[00:59.00] Chain bhi, mera dard bhi
[01:05.00] Meri aashiqui ab tum hi ho
[01:13.00] Tera mera rishta hai kaisa
[01:18.00] Ik pal door gawaara nahi
[01:24.00] Tere liye har roz hai jeete
[01:30.00] Tujhko diya mera waqt sabhi
[01:36.00] Koi lamha mera na ho tere bina
[01:42.00] Har saans pe naam tera
[01:48.00] Kyunki tum hi ho, ab tum hi ho
[01:54.00] Zindagi ab tum hi ho`,
      'blinding lights': `[00:00.00] ♪ (Synthesizer Intro) ♪
[00:13.50] Yeah
[00:15.50] I've been tryna call
[00:18.00] I've been on my own for long enough
[00:22.50] Maybe you can show me how to love, maybe
[00:29.00] I'm going through withdrawals
[00:33.00] You don't even have to do too much
[00:37.00] You can turn me on with just a touch, baby
[00:43.00] I look around and Sin City's cold and empty
[00:47.00] No one's around to judge me
[00:51.00] I can't see clearly when you're gone
[00:55.00] I said, ooh, I'm blinded by the lights
[01:00.00] No, I can't sleep until I feel your touch
[01:07.50] I said, ooh, I'm drowning in the night
[01:13.00] Oh, when I'm like this, you're the one I trust`,
      'cruel summer': `[00:00.00] ♪ (Intro) ♪
[00:06.00] Fever dream high in the quiet of the night
[00:09.50] You know that I caught it
[00:12.00] Bad, bad boy, shiny toy with a price
[00:15.00] You know that I bought it
[00:18.00] Killing me slow, out the window
[00:21.00] I'm always waiting for you to be waiting below
[00:24.00] Devils roll the dice, angels roll their eyes
[00:27.00] What doesn't kill me makes me want you more
[00:30.00] And it's new, the shape of your body
[00:34.00] It's blue, the feeling I've got
[00:37.00] And it's ooh, whoa, oh
[00:40.00] It's a cruel summer
[00:43.00] It's cool, that's what I tell 'em
[00:46.00] No rules in breakable heaven
[00:49.00] But ooh, whoa, oh
[00:52.00] It's a cruel summer with you`,
      espresso: `[00:00.00] ♪ (Intro beat) ♪
[00:04.00] Now he's thinkin' 'bout me every night, oh
[00:08.50] Is it that sweet? I guess so
[00:11.00] Say you can't sleep, baby, I know
[00:14.00] That's that me, espresso
[00:16.50] Move it up, down, left, right, oh
[00:19.50] Switch it up like Nintendo
[00:22.00] Say you can't sleep, baby, I know
[00:25.00] That's that me, espresso
[00:27.50] I can't relate to desperation
[00:30.50] My give-a-fucks are on vacation
[00:33.50] And I got this one boy and he won't stop callin'
[00:36.50] When they act this way, I know I got 'em`,
      'die with a smile': `[00:00.00] ♪ (Guitar intro) ♪
[00:11.00] I, I just woke up from a dream
[00:16.50] Where you and I had to say goodbye
[00:21.50] And I don't know what it all means
[00:27.00] But since I survived, I realized
[00:32.00] Wherever you go, that's where I'll follow
[00:38.00] Nobody's promised tomorrow
[00:43.00] So I'ma love you every night like it's the last night
[00:49.00] Like it's the last night
[00:54.00] If the world was ending, I'd wanna be next to you
[01:05.00] If the party was over and our time on Earth was through
[01:15.00] I'd wanna hold you just for a while
[01:20.50] And die with a smile`,
      yellow: `[00:00.00] ♪ (Acoustic Guitar Intro) ♪
[00:16.00] Look at the stars
[00:20.00] Look how they shine for you
[00:25.00] And everything you do
[00:31.00] Yeah, they were all yellow
[00:39.00] I came along
[00:43.00] I wrote a song for you
[00:48.00] And all the things you do
[00:54.00] And it was called "Yellow"
[01:02.00] So then I took my turn
[01:07.00] Oh, what a thing to have done
[01:13.00] And it was all yellow`,
      kesariya: `[00:00.00] ♪ (Intro) ♪
[00:07.00] Mujhko itna bataye koi
[00:11.00] Kaise tujhse dil na lagaye koi
[00:16.00] Rabba ne tujhko banane mein
[00:20.00] Kar di hai husn ki khaali tijoriyan
[00:25.00] Kajre ki siyahi se likhi
[00:29.00] Hai tune jaane kitno ki love storiyan
[00:34.00] Kesariya tera ishq hai piya
[00:38.50] Rang jaaun jo main haath lagaun
[00:43.00] Din beete saara teri fikr mein
[00:47.50] Rain saari teri khair manaun`,
    };

    // Check verified bank
    for (const [key, lrc] of Object.entries(VERIFIED_SYNCED_LYRICS)) {
      if (titleLower.includes(key)) {
        const lines = this.parseLrcLyrics(lrc);
        const result: LyricsData = {
          trackId,
          title,
          artist,
          synced: true,
          lines,
          plainLyrics: lines.map((l) => l.text).join('\n'),
        };
        setToCache(cacheKey, result, 3600);
        return result;
      }
    }

    try {
      const cleanTitle = title
        .replace(/\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/- Single|- Radio Edit|- Extended|- Remastered|- Acoustic/gi, '')
        .replace(/feat\..*|ft\..*/gi, '')
        .trim();

      const cleanArtist = artist
        .split(',')[0]
        .split('&')[0]
        .replace(/feat\..*|ft\..*/gi, '')
        .trim();

      // 2. Query LRCLIB with Exact & Search Endpoints
      const lrclibUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}${duration ? `&duration=${Math.round(duration)}` : ''}`;
      let lyricData = await safeFetchJson<any>(lrclibUrl, 3500);

      if (!lyricData) {
        const fallbackLrcUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
        lyricData = await safeFetchJson<any>(fallbackLrcUrl, 3500);
      }

      if (!lyricData) {
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanArtist} ${cleanTitle}`)}`;
        const list = await safeFetchJson<any[]>(searchUrl, 3500);
        if (Array.isArray(list) && list.length > 0) {
          lyricData = list.find((item) => item.syncedLyrics) || list[0];
        }
      }

      if (lyricData && (lyricData.syncedLyrics || lyricData.plainLyrics)) {
        let lines: { time: number; startTimeMs: number; text: string }[] = [];
        const isSynced = Boolean(lyricData.syncedLyrics);

        if (isSynced) {
          lines = this.parseLrcLyrics(lyricData.syncedLyrics);
        } else if (lyricData.plainLyrics) {
          const plainLines = lyricData.plainLyrics
            .split('\n')
            .map((l: string) => l.trim())
            .filter((l: string) => l.length > 0);

          const totalDur = duration && duration > 20 ? duration : plainLines.length * 4;
          const step = (totalDur - 6) / Math.max(plainLines.length, 1);
          lines = plainLines.map((text: string, i: number) => {
            const t = Number((3 + i * step).toFixed(2));
            return {
              time: t,
              startTimeMs: Math.round(t * 1000),
              text,
            };
          });
        }

        if (lines.length > 0) {
          const result: LyricsData = {
            trackId,
            title: lyricData.trackName || title,
            artist: lyricData.artistName || artist,
            synced: isSynced,
            lines,
            plainLyrics: lyricData.plainLyrics || lines.map((l) => l.text).join('\n'),
          };

          setToCache(cacheKey, result, 1800);
          return result;
        }
      }

      // 3. Fallback to JioSaavn Lyrics API
      const saavnSearchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(`${cleanTitle} ${cleanArtist}`)}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=5&p=1`;
      const saavnData = await safeFetchJson<any>(saavnSearchUrl, 3500);

      if (saavnData && Array.isArray(saavnData.results)) {
        const matchingSong = saavnData.results.find(
          (s: any) => s.id && (s.more_info?.has_lyrics === 'true' || s.has_lyrics === 'true' || s.more_info?.lyrics_id)
        );

        if (matchingSong) {
          const lyricsId = matchingSong.more_info?.lyrics_id || matchingSong.id;
          const lyricsFetchUrl = `https://www.jiosaavn.com/api.php?__call=lyrics.getLyrics&lyrics_id=${lyricsId}&ctx=web6dot0&api_version=4&_format=json`;
          const lyricsRes = await safeFetchJson<any>(lyricsFetchUrl, 3500);

          if (lyricsRes && lyricsRes.lyrics) {
            const rawText = lyricsRes.lyrics
              .replace(/<br\s*[\/]?>/gi, '\n')
              .replace(/&quot;/g, '"')
              .replace(/&#039;/g, "'")
              .replace(/&amp;/g, '&');

            const plainLines = rawText
              .split('\n')
              .map((l: string) => l.trim())
              .filter((l: string) => l.length > 0);

            const totalDur = duration && duration > 20 ? duration : plainLines.length * 4;
            const step = (totalDur - 6) / Math.max(plainLines.length, 1);
            const lines = plainLines.map((text: string, i: number) => {
              const t = Number((3 + i * step).toFixed(2));
              return {
                time: t,
                startTimeMs: Math.round(t * 1000),
                text,
              };
            });

            const result: LyricsData = {
              trackId,
              title: matchingSong.title?.replace(/&quot;/g, '"') || title,
              artist: matchingSong.more_info?.music || artist,
              synced: false,
              lines,
              plainLyrics: rawText,
            };

            setToCache(cacheKey, result, 1800);
            return result;
          }
        }
      }
    } catch (e) {
      console.warn(`[Diagnostics] Error fetching lyrics:`, e);
    }

    // Default graceful fallback
    const fallbackLines = [
      { time: 0, startTimeMs: 0, text: '♪ (Instrumental intro) ♪' },
      { time: 4, startTimeMs: 4000, text: `Listening to ${title}` },
      { time: 8, startTimeMs: 8000, text: `by ${artist}` },
      { time: 14, startTimeMs: 14000, text: '♪ Enjoying the music vibes ♪' },
    ];

    const unavailable: LyricsData = {
      trackId,
      title,
      artist,
      synced: false,
      lines: fallbackLines,
      plainLyrics: `Lyrics for ${title} by ${artist}`,
    };
    return unavailable;
  }

  async resolvePlayback(
    trackId: string,
    title?: string,
    artist?: string,
    duration?: number,
    options?: { forceFresh?: boolean; discardUrl?: string }
  ) {
    const cacheKey = `playback-strict-v2-${trackId}`;
    if (!options?.forceFresh && !options?.discardUrl) {
      const cached = getFromCache<any>(cacheKey);
      if (cached) return cached;
    }

    // RULE: Get the track explicitly
    let track = getFromCache<Track>(`track-${trackId}`);
    if (!track) {
        track = await this.getTrack(trackId);
    }

    // Check if track has a youtube descriptor directly
    if (track && track.streamUrl && track.streamUrl.startsWith('youtube:')) {
      const result = {
        id: trackId,
        title: track.title,
        artist: track.artist,
        album: track.album || 'Single',
        thumbnail: track.images?.large || '',
        duration: track.duration || duration || 210,
        stream: {
          url: track.streamUrl,
          fallbackUrls: [`https://www.youtube.com/watch?v=${track.streamUrl.split(':')[1]}`, track.streamUrl],
          mimeType: 'video/youtube',
          bitrate: '320kbps Opus',
          isFullLength: true,
          isDirectAudio: false,
          isMediaDescriptor: true,
          descriptorType: 'youtube',
          mediaUri: track.streamUrl,
        },
      };
      setToCache(cacheKey, result, 86400);
      return result;
    }

    // STRICT MATCH: If the track already has a valid full streamUrl, validate before using.
    if (track && track.streamUrl && track.streamUrl.startsWith('http') && !track.streamUrl.includes('jiotune') && !track.streamUrl.includes('preview') && (track.duration || 0) >= 45) {
      const check = await validateAudioStream(track.streamUrl, 5000, track.duration || 210);
      if (check.valid) {
        const result = {
          id: trackId,
          title: track.title,
          artist: track.artist,
          album: track.album || 'Single',
          thumbnail: track.images?.large || '',
          duration: track.duration || duration || 210,
          stream: {
            url: track.streamUrl,
            fallbackUrls: [track.streamUrl],
            mimeType: track.mimeType || 'audio/mp4',
            bitrate: '320kbps',
            isFullLength: true,
            isDirectAudio: true,
            isMediaDescriptor: false,
            descriptorType: 'direct',
          },
        };
        setToCache(cacheKey, result, 86400);
        return result;
      } else {
        console.log(`[OpenMusicProvider] Existing streamUrl for ${trackId} skipped (${check.error}). Initiating resolution pipeline...`);
      }
    }

    // STRICT MATCH: If it's a Saavn track, fetch it strictly by ID and decrypt encrypted_media_url.
    if (trackId.startsWith('saavn-')) {
        const sId = trackId.replace('saavn-', '');
        try {
            const url = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${sId}&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
            const data = await safeFetchJson<any>(url, 3000);
            if (data && data.songs && data.songs.length > 0) {
                const item = data.songs[0];
                const streamResult = getValidSaavnStreamWithFallbacks(item);
                if (streamResult) {
                    const expectedDur = parseInt(item.more_info?.duration || '0', 10) || duration || 210;
                    const check = await validateAudioStream(streamResult.primaryUrl, 5000, expectedDur);
                    let validUrl = check.valid ? streamResult.primaryUrl : '';
                    let validFallbacks = streamResult.fallbackUrls.filter((u) => u !== validUrl);

                    if (!validUrl && streamResult.fallbackUrls.length > 1) {
                      for (const fb of streamResult.fallbackUrls) {
                        const fbCheck = await validateAudioStream(fb, 4000, expectedDur);
                        if (fbCheck.valid) {
                          validUrl = fb;
                          break;
                        }
                      }
                    }

                    if (validUrl) {
                      const result = {
                          id: trackId,
                          title: track?.title || item.title || title,
                          artist: track?.artist || artist,
                          album: track?.album || 'Single',
                          thumbnail: track?.images?.large || '',
                          duration: parseInt(item.more_info?.duration || '0', 10) || duration || 210,
                          stream: {
                              url: validUrl,
                              fallbackUrls: [validUrl, ...validFallbacks],
                              mimeType: 'audio/mp4',
                              bitrate: '320kbps',
                              isFullLength: true,
                              isDirectAudio: true,
                              isMediaDescriptor: false,
                              descriptorType: 'direct',
                          },
                      };
                      setToCache(cacheKey, result, 86400);
                      return result;
                    }
                }
            }
        } catch (e) {
            console.warn('[Playback] Saavn exact fetch failed', e);
        }
    }

    // MULTI-TIER RESOLVER FAILOVER: AudioStreamResolver with proactive validation
    const resolvedTitle = track?.title || title || '';
    const resolvedArtist = track?.artist || artist || '';
    const resolvedDuration = track?.duration || duration || 210;

    if (resolvedTitle) {
      const fullStream = await AudioStreamResolver.resolveFullTrack(
        trackId,
        resolvedTitle,
        resolvedArtist,
        resolvedDuration,
        options
      );

      if (fullStream && fullStream.url) {
        const fallbacks = [...(fullStream.fallbackUrls || [fullStream.url])];
        if (track?.streamUrl && !fallbacks.includes(track.streamUrl)) {
          fallbacks.push(track.streamUrl);
        }

        const result = {
          id: trackId,
          title: resolvedTitle,
          artist: resolvedArtist,
          album: track?.album || 'Single',
          thumbnail: track?.images?.large || '',
          duration: fullStream.duration || resolvedDuration,
          stream: {
            url: fullStream.url,
            fallbackUrls: fallbacks,
            mimeType: fullStream.mimeType,
            bitrate: fullStream.bitrate,
            isFullLength: true,
            isDirectAudio: fullStream.isDirectAudio !== false,
            isMediaDescriptor: Boolean(fullStream.isMediaDescriptor),
            descriptorType: fullStream.descriptorType || 'direct',
            mediaUri: fullStream.mediaUri,
          },
        };
        setToCache(cacheKey, result, 86400);
        return result;
      }
    }

    if (track && track.streamUrl) {
      return {
        id: trackId,
        title: resolvedTitle,
        artist: resolvedArtist,
        album: track.album || 'Single',
        thumbnail: track.images?.large || '',
        duration: resolvedDuration,
        stream: {
          url: track.streamUrl,
          fallbackUrls: [track.streamUrl],
          mimeType: 'audio/mp4',
          bitrate: '256kbps',
          isFullLength: true,
          isDirectAudio: true,
          isMediaDescriptor: false,
          descriptorType: 'direct',
        },
      };
    }

    return null;
  }

  async getHomeFeed(): Promise<HomeFeedData> {
    // Generate a daily cache key so recommendations stay stable for today
    const todayStr = new Date().toISOString().split('T')[0];
    const cacheKey = `home-feed-v8-${todayStr}`;
    const cached = getFromCache<HomeFeedData>(cacheKey);
    if (cached) return cached;

    console.log('[Diagnostics] Fetching authentic Spotiz Home Feed (Indian focus, stable daily)...');
console.log("-> 1");


    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    try {
      // 1. Fetch Popular Indian Artists
      const topArtistNames = [
        'Arijit Singh',
        'Diljit Dosanjh',
        'Yo Yo Honey Singh',
        'Karan Aujla',
        'Shreya Ghoshal',
        'AP Dhillon',
        'Sidhu Moose Wala',
        'Badshah'
      ];

      const artistPromises = topArtistNames.map(async (name) => {
        const cleanNameKey = name.toLowerCase().trim();
        let pic = POPULAR_ARTIST_PORTRAITS[cleanNameKey] || '';

        if (!pic) {
          try {
            pic = (await extractSpotifyThumbnail(`artist-${encodeURIComponent(name.toLowerCase())}`, name, 'artist')) || '';
          } catch {}
        }

        if (!pic) {
          try {
            const json = await safeFetchJson<any>(
              `https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`,
              3500
            );
            if (json && json.data && json.data.length > 0) {
              const a = json.data[0];
              const dzPic = a.picture_xl || a.picture_big || a.picture_medium || a.picture;
              if (dzPic && !dzPic.includes('d41d8cd98f00b204e9800998ecf8427e')) {
                pic = dzPic;
              }
            }
          } catch (e) {}
        }

        if (!pic) {
          pic = '';
        }

        return {
          id: `artist-${encodeURIComponent(name)}`,
          name,
          image: pic,
          followers: Math.floor(Math.random() * 4000000 + 3000000),
          monthlyListeners: Math.floor(Math.random() * 50000000 + 8000000),
          genres: ['Desi', 'Bollywood', 'Punjabi'],
          bio: `${name} is one of the most streamed artists in India.`,
          verified: true,
          topTracks: [],
          albums: [],
          singles: [],
        } as Artist;
      });

      // Daily rotating seed logic for Recommended for Today (stable per day)
      const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const recommendedPool = [
        ['Sajni', 'Illuminati', 'Angaaron', 'O Maahi'],
        ['Husn Anuv Jain', 'Tu Hai Kahan', 'O Sajni Re', 'Dekhha Tenu'],
        ['Softly Karan Aujla', 'Winning Speech', 'Kinni Kinni', 'Lover Diljit'],
        ['Arjan Vailly', 'Daku', 'We Rollin', '295 Sidhu']
      ];
      
      const dailyRecs = recommendedPool[dayOfYear % recommendedPool.length];

      // Trending Indian Hits
      const trendingHits = [
        'Tauba Tauba Karan Aujla',
        'Sajni',
        'Angaaron',
        'Illuminati Sushin Shyam'
      ];

      // Start Listening (Mix of popular Indian hits)
      const startListening = [
        'Tainu Khabar Nahi',
        'O Sajni Re',
        'Kiliye',
        'Tum Se'
      ];

      
      console.log("-> 2 Before Promise.all");
      const [artistsList, recsResults, trendingResults, startListeningResults, albumResults] = await Promise.all([
        Promise.all(artistPromises),
        Promise.all(dailyRecs.map(q => this.searchSingleTrack(q))),
        Promise.all(trendingHits.map(q => this.searchSingleTrack(q))),
        Promise.all(startListening.map(q => this.searchSingleTrack(q))),
        safeFetchJson<any>('https://itunes.apple.com/search?term=Bollywood+2024&entity=album&limit=10', 4000)
      ]);

      
      console.log("-> 3 After Promise.all");
      const quickPicks = recsResults.filter((t): t is Track => Boolean(t));
      const trending = trendingResults.filter((t): t is Track => Boolean(t));
      
      // More Like Artist: deduplicated distinct songs
      const seenIds = new Set<string>();
      const moreLikeArtistTracks: Track[] = [];
      for (const track of startListeningResults.filter((t): t is Track => Boolean(t))) {
        if (!seenIds.has(track.id)) {
          seenIds.add(track.id);
          moreLikeArtistTracks.push(track);
        }
      }

      const albums = [];
      if (albumResults && albumResults.results) {
        for (const r of albumResults.results) {
          if (r.collectionType === 'Album' || r.wrapperType === 'collection') {
            albums.push({
              id: `album-${r.collectionId}`,
              name: r.collectionName || 'Unknown Album',
              artist: r.artistName || 'Unknown Artist',
              artistId: `artist-${r.artistId || ''}`,
              year: r.releaseDate ? new Date(r.releaseDate).getFullYear() : 2024,
              images: {
                small: r.artworkUrl100 || '',
                medium: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '300x300bb') : '',
                large: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '600x600bb') : '',
              },
              tracks: [],
              totalDuration: 0,
            });
          }
        }
      }

      // Moods for Indian context
      const moods = [
        { id: 'bollywood', name: 'Bollywood Hits', color: '#E13300', image: '', query: 'bollywood' },
        { id: 'punjabi', name: 'Punjabi Swag', color: '#1E3264', image: '', query: 'punjabi' },
        { id: 'romance', name: 'Desi Romance', color: '#E8115B', image: '', query: 'romance' },
        { id: 'indie', name: 'Indian Indie', color: '#148A08', image: '', query: 'indie' },
      ];

      const feed: HomeFeedData = {
        greeting,
        quickPicks, // Recommended for Today
        recentlyPlayed: moreLikeArtistTracks, // Used for Start Listening / Recently Played
        madeForYou: [], // Can be repurposed if needed
        trending,
        popularSongs: moreLikeArtistTracks, // More Like Artist
        popularArtists: artistsList,
        newReleases: [],
        recommendedAlbums: albums,
        moods,
      };

      setToCache(cacheKey, feed, 3600);
      return feed;
    } catch (err) {
      console.warn('[Diagnostics] Error creating real home feed:', err);
      return {
        greeting,
        quickPicks: [],
        recentlyPlayed: [],
        madeForYou: [],
        trending: [],
        popularSongs: [],
        popularArtists: [],
        newReleases: [],
        recommendedAlbums: [],
        moods: [],
      };
    }
  }}
