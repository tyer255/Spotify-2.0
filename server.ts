
import express from 'express';
import path from 'path';
import { Readable } from 'stream';
import { createServer as createViteServer } from 'vite';

import fetch from 'node-fetch';


import { MusicService, userDatabase } from './server/services/musicService';
import { smartRankingService } from './server/services/SmartRankingService';
import { providerManager } from './server/providers/ProviderManager';
import { extractSpotifyThumbnail, resolveMissingSpotifyThumbnails } from './server/services/spotifyThumbnailExtractor';
import { SpotifyCanvasService } from './server/services/spotifyCanvasService';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

app.get('/api/search', async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const userId = (req.headers['x-user-id'] as string) || (req.headers['x-session-id'] as string) || 'anonymous';
    const results = await MusicService.search(q, userId);
    sendSuccess(res, results);
  } catch (err: any) {
    console.error('[API] /api/search error:', err);
    sendError(res, 'SEARCH_FAILED', 'Failed to execute search query', 500);
  }
});


// Smart Ranking Analytics Event
app.post('/api/analytics/event', (req, res) => {
  try {
    const { event_type, song_id } = req.body;
    const userId = (req.headers['x-user-id'] as string) || (req.headers['x-session-id'] as string) || 'anonymous';
    
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

// 8. Create Playlist
app.post('/api/playlist', (req, res) => {
  const { title, description, coverImage, id } = req.body;
  if (!title || typeof title !== 'string') {
    return sendError(res, 'INVALID_INPUT', 'Playlist title is required', 400);
  }

  const newPlaylist = {
    id: id || `user-pl-${Date.now()}`,
    title: title.trim(),
    description: description ? String(description).trim() : 'Custom playlist created on Spotiz',
    coverImage: coverImage || '',
    userId: userDatabase.id,
    isPublic: true,
    tracks: [],
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    likesCount: 0,
    color: '#10B981',
  };

  userDatabase.playlists.unshift(newPlaylist);
  sendSuccess(res, newPlaylist, 201);
});

// 9. Update / Rename Playlist
app.put('/api/playlist/:id', (req, res) => {
  const { title, description, coverImage } = req.body;
  const pl = userDatabase.playlists.find((p) => p.id === req.params.id);
  if (!pl) {
    return sendError(res, 'PLAYLIST_NOT_FOUND', 'User playlist not found or cannot be modified', 404);
  }

  if (title) pl.title = String(title).trim();
  if (description !== undefined) pl.description = String(description).trim();
  if (coverImage) pl.coverImage = coverImage;
  pl.updatedAt = new Date().toISOString().split('T')[0];

  sendSuccess(res, pl);
});

// 10. Delete Playlist
app.delete('/api/playlist/:id', (req, res) => {
  const index = userDatabase.playlists.findIndex((p) => p.id === req.params.id);
  if (index !== -1) {
    userDatabase.playlists.splice(index, 1);
  }
  sendSuccess(res, { deletedId: req.params.id });
});

// 11. Add track to playlist
app.post('/api/playlist/:id/tracks', async (req, res) => {
  const { trackId, track: clientTrack } = req.body;
  let pl = userDatabase.playlists.find((p) => p.id === req.params.id);
  if (!pl) {
    // If playlist was created locally or after server reload, register it on the fly
    const newPlaylist = {
      id: req.params.id,
      title: 'My Playlist',
      description: 'Custom playlist created on Spotiz',
      coverImage: '',
      userId: userDatabase.id,
      isPublic: true,
      tracks: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      likesCount: 0,
      color: '#10B981',
    };
    userDatabase.playlists.unshift(newPlaylist);
    pl = newPlaylist;
  }

  let trackToPush = clientTrack;
  if (!trackToPush && trackId) {
    trackToPush = await MusicService.getTrack(trackId);
  }
  if (!trackToPush) {
    return sendError(res, 'TRACK_NOT_FOUND', 'Track to add was not found', 404);
  }

  if (!pl.tracks.some((t: any) => t.id === trackToPush.id)) {
    pl.tracks.push(trackToPush);
  }
  pl.updatedAt = new Date().toISOString().split('T')[0];
  sendSuccess(res, pl);
});

// 12. Remove track from playlist
app.delete('/api/playlist/:id/tracks/:trackId', (req, res) => {
  const pl = userDatabase.playlists.find((p) => p.id === req.params.id);
  if (pl) {
    pl.tracks = pl.tracks.filter((t) => t.id !== req.params.trackId);
    pl.updatedAt = new Date().toISOString().split('T')[0];
  }
  sendSuccess(res, pl || { id: req.params.id, tracks: [] });
});

// 13. Reorder tracks in playlist
app.put('/api/playlist/:id/reorder', (req, res) => {
  const { trackIds } = req.body;
  const pl = userDatabase.playlists.find((p) => p.id === req.params.id);
  if (!pl) {
    return sendError(res, 'PLAYLIST_NOT_FOUND', 'Playlist not found', 404);
  }

  if (Array.isArray(trackIds)) {
    const reordered: typeof pl.tracks = [];
    trackIds.forEach((id) => {
      const found = pl.tracks.find((t) => t.id === id);
      if (found) reordered.push(found);
    });
    pl.tracks = reordered;
  }
  sendSuccess(res, pl);
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

// 15b. Audio Download Proxy (Fetches full audio buffer for reliable offline caching)
app.get('/api/audio-download', async (req, res) => {
  const audioUrl = req.query.url as string;
  if (!audioUrl) {
    return sendError(res, 'INVALID_INPUT', 'Audio url is required', 400);
  }

  try {
    const audioRes = await fetch(audioUrl, {
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

    let upstreamRes = await fetch(streamUrl, {
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
          const fallbackRes = await fetch(fallback, {
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

// 17. User Profile & Library Data
app.get('/api/profile', (req, res) => {
  sendSuccess(res, userDatabase);
});

// 18. Update Profile / Settings
app.put('/api/profile', (req, res) => {
  const { name, username, avatar, settings, playlists, likedTrackIds } = req.body;
  if (name) userDatabase.name = name;
  if (username) userDatabase.username = username;
  if (avatar) userDatabase.avatar = avatar;
  if (settings) {
    userDatabase.settings = {
      ...userDatabase.settings,
      ...settings,
    };
  }
  if (playlists && Array.isArray(playlists)) {
    userDatabase.playlists = playlists;
  }
  if (likedTrackIds && Array.isArray(likedTrackIds)) {
    userDatabase.likedTrackIds = likedTrackIds;
  }
  sendSuccess(res, userDatabase);
});

// 19. Like / Unlike track toggle
app.post('/api/like-track', (req, res) => {
  const { trackId } = req.body;
  if (!trackId) return sendError(res, 'INVALID_INPUT', 'trackId required', 400);

  const idx = userDatabase.likedTrackIds.indexOf(trackId);
  let isLiked = false;
  if (idx > -1) {
    userDatabase.likedTrackIds.splice(idx, 1);
    isLiked = false;
  } else {
    userDatabase.likedTrackIds.push(trackId);
    isLiked = true;
  }

  sendSuccess(res, { trackId, isLiked, likedTrackIds: userDatabase.likedTrackIds });
});

// 19b. Get all liked tracks
app.get('/api/liked-tracks', async (req, res) => {
  try {
    const tracks = await Promise.all(
      userDatabase.likedTrackIds.map(id => MusicService.getTrack(id))
    );
    sendSuccess(res, tracks.filter(Boolean));
  } catch (err) {
    sendError(res, 'SERVER_ERROR', 'Failed to fetch liked tracks', 500);
  }
});

// 20. Follow / Unfollow artist
app.post('/api/follow-artist', (req, res) => {
  const { artistId } = req.body;
  if (!artistId) return sendError(res, 'INVALID_INPUT', 'artistId required', 400);

  const idx = userDatabase.followedArtistIds.indexOf(artistId);
  let isFollowed = false;
  if (idx > -1) {
    userDatabase.followedArtistIds.splice(idx, 1);
    isFollowed = false;
  } else {
    userDatabase.followedArtistIds.push(artistId);
    isFollowed = true;
  }
  userDatabase.followingCount = userDatabase.followedArtistIds.length;
  if (userDatabase.stats) {
    userDatabase.stats.followingCount = userDatabase.followedArtistIds.length;
  }

  sendSuccess(res, {
    artistId,
    isFollowed,
    followedArtistIds: userDatabase.followedArtistIds,
    followingCount: userDatabase.followingCount,
  });
});

// 21. Download / Remove download toggle
app.post('/api/download-track', (req, res) => {
  const { trackId } = req.body;
  if (!trackId) return sendError(res, 'INVALID_INPUT', 'trackId required', 400);

  const idx = userDatabase.downloadedTrackIds.indexOf(trackId);
  let isDownloaded = false;
  if (idx > -1) {
    userDatabase.downloadedTrackIds.splice(idx, 1);
    isDownloaded = false;
  } else {
    userDatabase.downloadedTrackIds.push(trackId);
    isDownloaded = true;
  }

  sendSuccess(res, { trackId, isDownloaded, downloadedTrackIds: userDatabase.downloadedTrackIds });
});

// 22. Record History
app.post('/api/history', async (req, res) => {
  const { trackId } = req.body;
  const track = await MusicService.getTrack(trackId);
  if (track) {
    userDatabase.recentHistory.unshift({
      track,
      playedAt: new Date().toISOString(),
    });
    if (userDatabase.recentHistory.length > 30) {
      userDatabase.recentHistory.pop();
    }
  }
  sendSuccess(res, { ok: true });
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

// Cache for live resolved artist images
const artistLiveImageCache = new Map<string, string>();

// 23b. Direct High-Resolution Artist Image Resolver (Deezer + Wikipedia + Spotify fallback)
app.get('/api/artist-image', async (req, res) => {
  const name = (req.query.name || req.query.q || req.query.artist) as string;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name parameter required' });
  }

  const cleanName = name.trim().replace(/^artist-/i, '');
  const cacheKey = cleanName.toLowerCase();

  if (artistLiveImageCache.has(cacheKey)) {
    return res.json({ ok: true, imageUrl: artistLiveImageCache.get(cacheKey) });
  }

  // 1. Try Deezer Search
  try {
    const deezerRes = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(cleanName)}&limit=1`);
    if (deezerRes.ok) {
      const d: any = await deezerRes.json();
      if (d?.data?.[0]) {
        const art = d.data[0];
        const pic = art.picture_xl || art.picture_big || art.picture_medium || art.picture;
        // Ignore Deezer blank image placeholder MD5 hash
        if (pic && !pic.includes('d41d8cd98f00b204e9800998ecf8427e') && pic.startsWith('http')) {
          artistLiveImageCache.set(cacheKey, pic);
          return res.json({ ok: true, imageUrl: pic });
        }
      }
    }
  } catch (err) {
    // continue to fallback
  }

  // 2. Try Wikipedia PageImages API
  try {
    const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanName)}&prop=pageimages&format=json&pithumbsize=600`);
    if (wikiRes.ok) {
      const wikiData: any = await wikiRes.json();
      const pages = wikiData?.query?.pages;
      if (pages) {
        for (const pageId in pages) {
          const thumb = pages[pageId]?.thumbnail?.source;
          if (thumb && thumb.startsWith('http')) {
            artistLiveImageCache.set(cacheKey, thumb);
            return res.json({ ok: true, imageUrl: thumb });
          }
        }
      }
    }
  } catch (err) {
    // continue to fallback
  }

  // 3. Try Spotify Scraper Thumbnail
  try {
    const thumb = await extractSpotifyThumbnail(cleanName, cleanName, 'artist');
    if (thumb && thumb.startsWith('http')) {
      artistLiveImageCache.set(cacheKey, thumb);
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


// ================= VITE INTEGRATION =================



async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { setHeaders: (res, path) => { if (path.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); } }));
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
