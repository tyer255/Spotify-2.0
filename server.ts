
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';
import dns from 'dns/promises';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import fetch from 'node-fetch';

import { adminAuth } from './server/firebaseAdmin';
import { MusicService } from './server/services/musicService';
import { smartRankingService } from './server/services/SmartRankingService';
import { providerManager } from './server/providers/ProviderManager';
import { RadioRecommendationService } from './server/services/RadioRecommendationService';
import { extractSpotifyThumbnail, resolveMissingSpotifyThumbnails } from './server/services/spotifyThumbnailExtractor';
import { SpotifyCanvasService } from './server/services/spotifyCanvasService';
import { ShareService } from './server/services/shareService';

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Cloud Run/Nginx)
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Set up CORS
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [/^https:\/\/.*\.run\.app$/, /^https:\/\/.*\.web\.app$/, process.env.FRONTEND_URL].filter(Boolean) as (string | RegExp)[]
  : '*'; // allow all in dev

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'x-user-id'],
  credentials: false // Set to false if allowing wildcard origins to avoid security issues
}));

// Set up Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // Limit each IP to 120 requests per `window` (here, per 1 minute)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    sendError(res, 'RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later.', 429);
  }
});

// Apply rate limiter to all API routes
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Auth Middleware for Android/External Clients
// Web uses direct Firebase client SDK for protected actions, but if they hit an API, we can verify it.
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'UNAUTHORIZED', 'Missing or invalid Authorization header', 401);
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth verification failed:', error);
    return sendError(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
  }
};

const optionalAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      req.user = decodedToken;
    } catch (error) {
      // ignore invalid token for optional auth
    }
  }
  next();
};

// Helper for standardized API responses
function sendSuccess(res: express.Response, data: any, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
  });
}

function sendError(res: express.Response, code: string, message: string, status = 400) {
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      code,
      message,
    },
  });
}

// ================= API ROUTES =================

// 1. Health check & Provider status
app.get('/api/health', (req, res) => {
  sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    provider: providerManager.getProviderStatus(),
  });
});

app.get('/api/provider-status', (req, res) => {
  sendSuccess(res, providerManager.getProviderStatus());
});

// 2. Home feed
app.get('/api/home', async (req, res) => {
  try {
    const feed = await MusicService.getHomeFeed();
    sendSuccess(res, feed);
  } catch (err: any) {
    console.error('[API] /api/home error:', err);
    sendError(res, 'SERVER_ERROR', 'Failed to retrieve home feed', 500);
  }
});


// 3. Search

app.get('/api/search', optionalAuth, async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const userId = req.user?.uid || (req.headers['x-user-id'] as string) || (req.headers['x-session-id'] as string) || 'anonymous';
    const results = await MusicService.search(q, userId);
    sendSuccess(res, results);
  } catch (err: any) {
    console.error('[API] /api/search error:', err);
    sendError(res, 'SEARCH_FAILED', 'Failed to execute search query', 500);
  }
});


// Smart Ranking Analytics Event
app.post('/api/analytics/event', optionalAuth, (req, res) => {
  try {
    const { event_type, song_id } = req.body;
    const userId = req.user?.uid || (req.headers['x-user-id'] as string) || (req.headers['x-session-id'] as string) || 'anonymous';
    
    if (event_type && song_id) {
      smartRankingService.logEvent({
        user_id: userId,
        song_id,
        event_type,
        session_id: req.headers['x-session-id'] as string
      });
    }
    sendSuccess(res, { logged: true });
  } catch (err: any) {
    console.error('[API] /api/analytics/event error:', err);
    sendError(res, 'ANALYTICS_FAILED', 'Failed to log event', 500);
  }
});


// 3b. Search Suggestions (Fast, title-matching song suggestions while typing)
app.get('/api/search/suggestions', async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const suggestions = await MusicService.getSongSuggestions(q);
    sendSuccess(res, suggestions);
  } catch (err: any) {
    console.error('[API] /api/search/suggestions error:', err);
    sendSuccess(res, []);
  }
});

// 4. Track details
app.get('/api/track/:id', async (req, res) => {
  try {
    const track = await MusicService.getTrack(req.params.id);
    if (!track) {
      return sendError(res, 'TRACK_NOT_FOUND', `Track with id ${req.params.id} could not be found`, 404);
    }
    sendSuccess(res, track);
  } catch (err: any) {
    console.error('[API] /api/track error:', err);
    sendError(res, 'SERVER_ERROR', 'Failed to retrieve track details', 500);
  }
});

// 5. Album details
app.get('/api/album/:id', async (req, res) => {
  try {
    const album = await MusicService.getAlbum(req.params.id);
    if (!album) {
      return sendError(res, 'ALBUM_NOT_FOUND', `Album with id ${req.params.id} could not be found`, 404);
    }
    sendSuccess(res, album);
  } catch (err: any) {
    console.error('[API] /api/album error:', err);
    sendError(res, 'SERVER_ERROR', 'Failed to retrieve album details', 500);
  }
});

// 6. Artist details
app.get('/api/artist/:id', async (req, res) => {
  try {
    const artist = await MusicService.getArtist(req.params.id);
    if (!artist) {
      return sendError(res, 'ARTIST_NOT_FOUND', `Artist with id ${req.params.id} could not be found`, 404);
    }
    sendSuccess(res, artist);
  } catch (err: any) {
    console.error('[API] /api/artist error:', err);
    sendError(res, 'SERVER_ERROR', 'Failed to retrieve artist details', 500);
  }
});

// 7. Playlist details
app.get('/api/playlist/:id', async (req, res) => {
  try {
    const playlist = await MusicService.getPlaylist(req.params.id);
    if (!playlist) {
      return sendError(res, 'PLAYLIST_NOT_FOUND', `Playlist with id ${req.params.id} could not be found`, 404);
    }
    sendSuccess(res, playlist);
  } catch (err: any) {
    console.error('[API] /api/playlist error:', err);
    sendError(res, 'SERVER_ERROR', 'Failed to retrieve playlist details', 500);
  }
});

// 14. Lyrics
app.get('/api/lyrics/:id', async (req, res) => {
  try {
    const trackTitle = req.query.title as string | undefined;
    const artistName = req.query.artist as string | undefined;
    const duration = req.query.duration ? parseInt(req.query.duration as string, 10) : undefined;

    const lyrics = await MusicService.getLyrics(req.params.id, trackTitle, artistName, duration);
    sendSuccess(res, lyrics);
  } catch (err) {
    console.error('[API] /api/lyrics error:', err);
    sendError(res, 'LYRICS_UNAVAILABLE', 'Lyrics could not be retrieved', 500);
  }
});

// 15. Playback Resolve (Authorized Stream Resolution)
app.post('/api/playback/resolve', async (req, res) => {
  const { trackId, title, artist, duration, forceFresh, discardUrl } = req.body;
  if (!trackId) {
    return sendError(res, 'INVALID_INPUT', 'trackId is required', 400);
  }

  try {
    const resolved = await MusicService.resolvePlayback(
      trackId,
      title,
      artist,
      duration ? parseInt(String(duration), 10) : undefined,
      { forceFresh: Boolean(forceFresh), discardUrl }
    );
    if (!resolved) {
      return sendError(res, 'PLAYBACK_UNAVAILABLE', 'Playback unavailable for this track.', 404);
    }
    sendSuccess(res, resolved);
  } catch (err: any) {
    console.error('[API] /api/playback/resolve error:', err);
    sendError(res, 'PLAYBACK_UNAVAILABLE', 'Playback unavailable for this track.', 500);
  }
});

function isPrivateOrReservedIp(ip: string): boolean {
  if (ip.includes('.')) {
    const parts = ip.split('.').map(p => parseInt(p, 10));
    if (parts.length !== 4 || parts.some(isNaN)) return true;
    const [b0, b1] = parts;
    if (b0 === 0) return true; // 0.0.0.0/8
    if (b0 === 10) return true; // 10.0.0.0/8
    if (b0 === 127) return true; // 127.0.0.0/8 loopback
    if (b0 === 169 && b1 === 254) return true; // 169.254.0.0/16 link-local / cloud metadata
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true; // 172.16.0.0/12
    if (b0 === 192 && b1 === 168) return true; // 192.168.0.0/16
    if (b0 >= 224) return true; // Multicast & reserved
  } else if (ip.includes(':')) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1' || normalized === '::') return true;
    if (normalized.startsWith('fe80:') || normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (normalized.startsWith('::ffff:')) {
      const ipv4Part = normalized.replace('::ffff:', '');
      return isPrivateOrReservedIp(ipv4Part);
    }
  }
  return false;
}

const isSafeStreamUrl = async (urlString: string): Promise<boolean> => {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    // Reject embedded credentials
    if (url.username || url.password) return false;
    // Disallow non-standard ports (strictly standard web audio ports only)
    if (url.port && url.port !== '80' && url.port !== '443') return false;

    const host = url.hostname.toLowerCase().replace(/\.+$/, '');
    
    // Explicit whitelist of allowed domains for upstream audio proxies
    const allowedDomains = [
      'saavncdn.com',
      'jiosaavn.com',
      'audius.co',
      'googlevideo.com',
      'youtube.com',
      'deezer.com',
      'dzcdn.net',
      'spotify.com',
      'spotifycdn.com',
      'sndcdn.com',
      'mzstatic.com',
      'itunes.apple.com'
    ];
    
    const domainMatches = allowedDomains.some(domain => host === domain || host.endsWith('.' + domain));
    if (!domainMatches) return false;

    // Validate IP resolution against private / loopback / link-local / cloud metadata ranges
    try {
      const lookup = await dns.lookup(host);
      if (lookup && lookup.address && isPrivateOrReservedIp(lookup.address)) {
        return false;
      }
    } catch {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

async function safeStreamFetch(url: string, options: any, maxRedirects = 5): Promise<any> {
  let currentUrl = url;
  for (let i = 0; i < maxRedirects; i++) {
    const isSafe = await isSafeStreamUrl(currentUrl);
    if (!isSafe) {
      throw new Error(`SSRF Prevention: Blocked access or redirect to unsafe domain/IP: ${currentUrl}`);
    }
    const res = await fetch(currentUrl, { ...options, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400 && res.headers.has('location')) {
      let location = res.headers.get('location')!;
      if (!location.startsWith('http')) {
        location = new URL(location, currentUrl).toString();
      }
      currentUrl = location;
      continue;
    }
    return res;
  }
  throw new Error('Too many redirects');
}

// 15b. Audio Download Proxy (Fetches full audio buffer for reliable offline caching)
app.get('/api/audio-download', async (req, res) => {
  const audioUrl = req.query.url as string;
  if (!audioUrl) {
    return sendError(res, 'INVALID_INPUT', 'Audio url is required', 400);
  }
  if (!(await isSafeStreamUrl(audioUrl))) {
    return sendError(res, 'INVALID_INPUT', 'Unsupported audio URL domain', 403);
  }

  try {
    const audioRes = await safeStreamFetch(audioUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': 'https://www.jiosaavn.com/',
      },
    });

    if (!audioRes.ok) {
      return res.status(audioRes.status).send(`Failed to fetch audio stream: ${audioRes.statusText}`);
    }

    const contentType = audioRes.headers.get('content-type') || 'audio/mp4';
    const contentLength = audioRes.headers.get('content-length');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const arrayBuffer = await audioRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('[API] /api/audio-download error:', err);
    sendError(res, 'DOWNLOAD_FAILED', 'Failed to retrieve audio stream', 500);
  }
});

// 15c. Real-Time Audio Streaming Range Proxy
app.get('/api/playback/stream', async (req, res) => {
  const streamUrl = req.query.url as string;
  if (!streamUrl) {
    return sendError(res, 'INVALID_INPUT', 'url is required', 400);
  }
  if (!(await isSafeStreamUrl(streamUrl))) {
    return sendError(res, 'INVALID_INPUT', 'Unsupported stream URL domain', 403);
  }

  try {
    const rangeHeader = req.headers.range;
    const fetchHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Referer': streamUrl.includes('jiosaavn') || streamUrl.includes('saavncdn') ? 'https://www.jiosaavn.com/' : 'https://audius.co/',
    };

    if (rangeHeader) {
      fetchHeaders['Range'] = rangeHeader;
    }

    let upstreamRes = await safeStreamFetch(streamUrl, {
      headers: fetchHeaders,
      signal: AbortSignal.timeout(8000),
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      // Automatic failover for JioSaavn CDN formats: try different bitrate qualities
      const base = streamUrl.replace(/_\d+\.mp4$/, '');
      const fallbacks = [];
      if (streamUrl.includes('.mp4')) {
        fallbacks.push(`${base}_320.mp4`);
        fallbacks.push(`${base}_160.mp4`);
        fallbacks.push(`${base}_96.mp4`);
        fallbacks.push(`${base}_48.mp4`);
      } else {
        // Just as a safety, if we aren't sure, we can't guess easily
      }

      for (const fallback of fallbacks) {
        if (fallback === streamUrl) continue;
        try {
          const fallbackRes = await safeStreamFetch(fallback, {
            headers: fetchHeaders,
            signal: AbortSignal.timeout(6000),
          });
          if (fallbackRes.ok || fallbackRes.status === 206) {
            upstreamRes = fallbackRes;
            break;
          }
        } catch (err) {
          // Ignore network/timeout errors on fallbacks and try the next one
        }
      }
    }

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return res.status(upstreamRes.status).send(`Stream fetch failed: ${upstreamRes.statusText}`);
    }

    res.status(upstreamRes.status);
    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'last-modified',
      'etag',
    ];

    for (const h of headersToForward) {
      const val = upstreamRes.headers.get(h);
      if (val) {
        res.setHeader(h, val);
      }
    }

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Accept, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

    if (upstreamRes.body) {
      if (typeof (upstreamRes.body as any).pipe === 'function') {
        (upstreamRes.body as any).pipe(res);
      } else if (typeof (Readable as any).fromWeb === 'function') {
        (Readable as any).fromWeb(upstreamRes.body).pipe(res);
      } else {
        const arrayBuf = await upstreamRes.arrayBuffer();
        res.send(Buffer.from(arrayBuf));
      }
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error('[API] /api/playback/stream error:', err);
    if (!res.headersSent) {
      sendError(res, 'STREAM_FAILED', 'Failed to proxy audio stream', 500);
    }
  }
});

// 16. Recommendations
app.get('/api/recommendations', async (req, res) => {
  const seedTrackId = req.query.seedTrackId as string;
  const genre = req.query.genre as string;

  try {
    const recommended = await MusicService.getRecommendations(seedTrackId, genre);
    sendSuccess(res, recommended);
  } catch (err) {
    sendError(res, 'RECOMMENDATIONS_FAILED', 'Failed to fetch recommendations', 500);
  }
});

// 16b. Radio Station
app.get('/api/radio', async (req, res) => {
  const seedType = req.query.seedType as 'artist' | 'song' | 'album';
  const seedId = req.query.seedId as string;
  const seedTitle = req.query.seedTitle as string;

  if (!seedType || !seedId) {
    return sendError(res, 'INVALID_INPUT', 'seedType and seedId required', 400);
  }

  try {
    const radioTracks = await RadioRecommendationService.generateRadio(seedType, seedId, seedTitle);
    sendSuccess(res, radioTracks);
  } catch (err) {
    console.error('[Radio API] Error generating radio:', err);
    sendError(res, 'RADIO_FAILED', 'Failed to generate radio station', 500);
  }
});


// 23. Spotiz Thumbnail Extraction (SpotifyScraper Thumbnail Source)
app.get('/api/spotify/thumbnail', async (req, res) => {
  const query = (req.query.query || req.query.q) as string;
  const id = (req.query.id as string) || query;
  const type = ((req.query.type as string) || 'artist') as 'artist' | 'track' | 'album' | 'playlist';
  if (!query) {
    return sendError(res, 'INVALID_INPUT', 'Query parameter is required', 400);
  }

  try {
    const thumbnailUrl = await extractSpotifyThumbnail(id, query, type);
    sendSuccess(res, { thumbnailUrl });
  } catch (err: any) {
    sendError(res, 'EXTRACTION_FAILED', 'Failed to extract Spotiz thumbnail', 500);
  }
});

// 23b. Image Proxy to bypass ISP restrictions / CORS for artist images & CDNs
app.get('/api/image-proxy', async (req, res) => {
  const imageUrl = (req.query.url as string) || '';
  if (!imageUrl || !imageUrl.startsWith('http')) {
    return res.status(400).send('Invalid url');
  }

  try {
    const upstreamRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send('Upstream image error');
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const buffer = await upstreamRes.arrayBuffer();
    return res.send(Buffer.from(buffer));
  } catch (err) {
    return res.status(500).send('Proxy error');
  }
});

// Follow / Unfollow Artist endpoint
app.post('/api/follow-artist', (req, res) => {
  const artistId = req.body?.artistId;
  sendSuccess(res, { success: true, artistId });
});

// Download track state endpoint
app.post('/api/download-track', (req, res) => {
  const trackId = req.body?.trackId;
  sendSuccess(res, { success: true, trackId });
});

// Cache for live resolved artist images
const artistLiveImageCache = new Map<string, string>();
const MAX_ARTIST_CACHE = 5000;

// 23b. Direct High-Resolution Artist Image Resolver (Deezer + Wikipedia + Spotify fallback)
app.get('/api/artist-image', async (req, res) => {
  const name = (req.query.name || req.query.q || req.query.artist) as string;
  const id = (req.query.id || req.query.spotifyId) as string;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name parameter required' });
  }

  const cleanName = name.trim().replace(/^artist-/i, '');
  // If an ID is provided, use it for the cache key, otherwise fallback to the cleaned name
  const cacheKey = (id || cleanName).toLowerCase();

  if (artistLiveImageCache.has(cacheKey)) {
    return res.json({ ok: true, imageUrl: artistLiveImageCache.get(cacheKey) });
  }

  const addToCache = (key: string, val: string) => {
    if (artistLiveImageCache.size >= MAX_ARTIST_CACHE) {
      const first = artistLiveImageCache.keys().next().value;
      if (first) artistLiveImageCache.delete(first);
    }
    artistLiveImageCache.set(key, val);
  };

  // 0. Exact ID Resolution (if Spotify ID is provided)
  const targetId = id || (cleanName.startsWith('spotify-artist-') ? cleanName : '');
  if (targetId && targetId.startsWith('spotify-artist-')) {
    try {
      const artistData = await MusicService.getArtist(targetId);
      if (artistData && (artistData as any).image) {
        const pic = (artistData as any).image;
        if (pic && typeof pic === 'string') {
          addToCache(cacheKey, pic);
          return res.json({ ok: true, imageUrl: pic });
        }
      }
    } catch (err) {
      console.warn('[ArtistImage] Spotify ID resolution failed, falling back to name search:', err);
    }
  }

  // 1. Use the strict SpotifyScraper Thumbnail Extractor
  // This extractor checks Saavn, iTunes, and Deezer with strict name matching
  // to avoid fuzzy logic returning the wrong artist (e.g. returning 'Makar' for 'Mazaq').
  try {
    const thumb = await extractSpotifyThumbnail(targetId || cacheKey, cleanName, 'artist');
    if (thumb && thumb.startsWith('http')) {
      addToCache(cacheKey, thumb);
      return res.json({ ok: true, imageUrl: thumb });
    }
  } catch (err) {
    // fallback failed
  }

  return res.json({ ok: false, imageUrl: '' });
});

// 24. Spotify Canvas Proxy & Resolution
app.get(['/api/canvas/search', '/api/canvas'], async (req, res) => {
  try {
    const title = (req.query.title as string) || '';
    const artist = (req.query.artist as string) || '';
    const trackId = (req.query.trackId as string) || (req.query.id as string) || '';
    const spotifyId = (req.query.spotifyId as string) || '';
    const spotifyUri = (req.query.spotifyUri as string) || (req.query.uri as string) || '';
    const isrc = (req.query.isrc as string) || '';
    const album = (req.query.album as string) || '';
    const duration = req.query.duration ? Number(req.query.duration) : undefined;
    
    if (!title && !trackId && !spotifyUri && !spotifyId && !isrc) {
      return sendError(res, 'MISSING_PARAMS', 'Title, trackId, spotifyId, isrc, or spotifyUri is required');
    }

    const result = await SpotifyCanvasService.getCanvasForTrack({
      title,
      artist,
      trackId,
      spotifyId,
      spotifyUri,
      isrc,
      album,
      duration,
    });

    if (result) {
      return sendSuccess(res, {
        requestedTrackId: result.requestedTrackId || result.trackId,
        canonicalSpotifyTrackId: result.canonicalSpotifyTrackId || result.canvasTrackId,
        canvasAssetId: result.canvasAssetId,
        canvasEntityUri: result.canvasEntityUri,
        canvasUrl: result.canvasUrl,
        videoUrl: result.canvasUrl,
        trackUri: result.trackUri,
        trackId: result.trackId,
        canvasTrackId: result.canvasTrackId,
        isrc: result.isrc,
        title: result.title || title,
        artist: result.artist || artist,
        album: result.album || album,
        artistUri: result.artistUri,
        canvasType: result.canvasType,
        trackMatched: result.trackMatched,
        canvasAssetMatched: result.canvasAssetMatched,
        verified: result.verified,
        verificationReason: result.verificationReason,
        status: result.status,
      });
    }

    return sendError(res, 'NOT_FOUND', 'Could not find a valid verified canvas MP4 video for this track', 404);
  } catch (err: any) {
    console.warn('[CanvasAPI] Error resolving canvas:', err?.message || err);
    return sendError(res, 'SERVER_ERROR', 'Internal canvas resolution error', 500);
  }
});
// 24. YouTube Audio Proxy
app.get('/api/stream/youtube/:id', async (req, res) => {
  try {
    const ytdl = require('@distube/ytdl-core');
    const videoId = req.params.id;
    if (!ytdl.validateID(videoId)) {
      return res.status(400).send('Invalid YouTube ID');
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    const stream = ytdl(videoId, { filter: 'audioonly', quality: 'highestaudio' });
    stream.pipe(res);
    
    stream.on('error', (err: any) => {
      console.error('YTDL Stream Error:', err);
      if (!res.headersSent) res.status(500).send('Streaming error');
    });
  } catch (err) {
    console.error('YouTube Proxy Error:', err);
    res.status(500).send('Streaming error');
  }
});


// ================= SHARE ROUTES =================
app.post('/api/share', async (req, res) => {
  const { type, songId, title, artist, artwork, album, duration, lyrics, customImageBase64 } = req.body;
  if (!type || !songId || !title || !artist) {
    return sendError(res, 'INVALID_INPUT', 'Missing required share fields', 400);
  }
  
  try {
    const record = ShareService.createShare({
      type, songId, title, artist, artwork, album, duration, lyrics, customImageBase64
    });
    sendSuccess(res, record);
  } catch (err) {
    sendError(res, 'SHARE_FAILED', 'Failed to generate share link', 500);
  }
});

app.get('/api/share/:id', (req, res) => {
  const record = ShareService.getShare(req.params.id);
  if (!record) {
    return sendError(res, 'NOT_FOUND', 'Share link not found', 404);
  }
  sendSuccess(res, record);
});

app.get('/api/share/:id/image.png', (req, res) => {
  const record = ShareService.getShare(req.params.id);
  if (!record || !record.customImageBase64) {
    return res.status(404).send('Image not found');
  }
  
  const base64Data = record.customImageBase64.replace(/^data:image\/png;base64,/, "");
  const img = Buffer.from(base64Data, 'base64');
  
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': img.length,
    'Cache-Control': 'public, max-age=86400'
  });
  res.end(img);
});

// ================= VITE INTEGRATION =================



function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function sanitizeMediaUrl(urlStr: string): string {
  if (!urlStr || typeof urlStr !== 'string') return '/pwa-512x512.png';
  if (urlStr.startsWith('/') && !urlStr.startsWith('//')) {
    return escapeHtml(urlStr);
  }
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return escapeHtml(parsed.href);
    }
  } catch {
    // invalid url
  }
  return '/pwa-512x512.png';
}

const currentFilePath = typeof __filename !== 'undefined' ? __filename : (import.meta?.url ? fileURLToPath(import.meta.url) : '');
const isProduction = process.env.NODE_ENV === 'production' || currentFilePath.endsWith('.cjs') || currentFilePath.includes('dist');

async function startServer() {
  let vite: any;
  if (!isProduction) {
    try {
      const { createServer } = await import('vite');
      vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
    } catch (err) {
      console.warn('Vite dev server failed to initialize, falling back to static build:', err);
    }
  }

  app.get('/share/:type/:id', async (req, res, next) => {
    try {
      const shareId = req.params.id;
      const record = ShareService.getShare(shareId);
      
      let html = '';
      if (!isProduction && vite) {
         html = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf-8');
         html = await vite.transformIndexHtml(req.originalUrl, html);
      } else {
         html = fs.readFileSync(path.join(process.cwd(), 'dist', 'index.html'), 'utf-8');
      }

      if (record) {
         const isLyrics = record.type === 'lyrics';
         const title = isLyrics ? `${record.title} — Lyrics` : `${record.title} — ${record.artist}`;
         const description = isLyrics && record.lyrics
           ? `"${record.lyrics.split('\n')[0]}" — Listen on Spotiz`
           : `Listen to "${record.title}" by ${record.artist} on Spotiz`;
         const host = escapeHtml(req.get('host') || 'localhost');
         const path = escapeHtml(req.originalUrl || '');
         const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
         const customImageUrl = record.customImageBase64 ? `${protocol}://${host}/api/share/${record.shareId}/image.png` : sanitizeMediaUrl(record.artwork);
         const artworkUrl = customImageUrl;
         const safeTitle = escapeHtml(title);
         const safeDescription = escapeHtml(description);
         
         const ogTags = `
           <meta property="og:title" content="${safeTitle}" />
           <meta property="og:description" content="${safeDescription}" />
           <meta property="og:image" content="${artworkUrl}" />
           <meta property="og:type" content="music.song" />
           <meta property="og:url" content="${protocol}://${host}${path}" />
           <meta name="twitter:card" content="summary_large_image" />
         `;
         // Remove existing OG tags before inserting dynamic ones
         html = html.replace(/<meta property="og:[^>]+>/g, '');
         html = html.replace(/<meta name="twitter:[^>]+>/g, '');
         html = html.replace('</head>', `${ogTags}</head>`);
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      next(e);
    }
  });

  if (!isProduction && vite) {
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { setHeaders: (res, filePath) => { if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); } }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Spotiz Audio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
