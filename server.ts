import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { MusicService, userDatabase } from './server/services/musicService';
import { providerManager } from './server/providers/ProviderManager';

const app = express();
const PORT = 3000;

app.use(express.json());

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
    const results = await MusicService.search(q);
    sendSuccess(res, results);
  } catch (err: any) {
    console.error('[API] /api/search error:', err);
    sendError(res, 'SEARCH_FAILED', 'Failed to execute search query', 500);
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
  const { title, description, coverImage } = req.body;
  if (!title || typeof title !== 'string') {
    return sendError(res, 'INVALID_INPUT', 'Playlist title is required', 400);
  }

  const newPlaylist = {
    id: `user-pl-${Date.now()}`,
    title: title.trim(),
    description: description ? String(description).trim() : 'Custom playlist created on Spotify 2.0',
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
  if (index === -1) {
    return sendError(res, 'PLAYLIST_NOT_FOUND', 'Playlist not found or cannot be deleted', 404);
  }

  const deleted = userDatabase.playlists.splice(index, 1)[0];
  sendSuccess(res, { deletedId: deleted.id });
});

// 11. Add track to playlist
app.post('/api/playlist/:id/tracks', async (req, res) => {
  const { trackId } = req.body;
  const pl = userDatabase.playlists.find((p) => p.id === req.params.id);
  if (!pl) {
    return sendError(res, 'PLAYLIST_NOT_FOUND', 'Playlist not found', 404);
  }

  const track = await MusicService.getTrack(trackId);
  if (!track) {
    return sendError(res, 'TRACK_NOT_FOUND', 'Track to add was not found', 404);
  }

  pl.tracks.push(track);
  pl.updatedAt = new Date().toISOString().split('T')[0];
  sendSuccess(res, pl);
});

// 12. Remove track from playlist
app.delete('/api/playlist/:id/tracks/:trackId', (req, res) => {
  const pl = userDatabase.playlists.find((p) => p.id === req.params.id);
  if (!pl) {
    return sendError(res, 'PLAYLIST_NOT_FOUND', 'Playlist not found', 404);
  }

  pl.tracks = pl.tracks.filter((t) => t.id !== req.params.trackId);
  pl.updatedAt = new Date().toISOString().split('T')[0];
  sendSuccess(res, pl);
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
  const { trackId, title, artist, duration } = req.body;
  if (!trackId) {
    return sendError(res, 'INVALID_INPUT', 'trackId is required', 400);
  }

  try {
    const resolved = await MusicService.resolvePlayback(
      trackId,
      title,
      artist,
      duration ? parseInt(String(duration), 10) : undefined
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
  const { name, username, avatar, settings } = req.body;
  if (name) userDatabase.name = name;
  if (username) userDatabase.username = username;
  if (avatar) userDatabase.avatar = avatar;
  if (settings) {
    userDatabase.settings = {
      ...userDatabase.settings,
      ...settings,
    };
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

  sendSuccess(res, { artistId, isFollowed, followedArtistIds: userDatabase.followedArtistIds });
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


// 23. YouTube Audio Proxy
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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Spotify 2.0 Audio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
