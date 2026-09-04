const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importLines = `
import fetch from 'node-fetch';
import spotifyUrlInfo from 'spotify-url-info';
const spotify = spotifyUrlInfo(fetch);
`;
code = code.replace(/import \{ createServer as createViteServer \} from 'vite';/, `import { createServer as createViteServer } from 'vite';\n${importLines}`);

const endpointCode = `
// Clone Playlist API
app.post('/api/clone-playlist', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.includes('spotify.com/playlist/')) {
      return res.status(400).json({ success: false, error: 'Invalid Spotify playlist URL' });
    }

    const data = await spotify.getData(url);
    if (!data || !data.trackList) {
      return res.status(404).json({ success: false, error: 'Playlist not found or is private' });
    }

    const playlistImage = data.coverArt?.sources?.[0]?.url || '';
    
    const tracks = data.trackList.map((t, index) => {
      // Create a clean ID from the Spotify URI
      const trackId = t.uri ? t.uri.replace(/:/g, '-') : \`sp-clone-\${Date.now()}-\${index}\`;
      const durationStr = String(t.duration || 0);
      const durationSecs = durationStr.length > 5 ? Math.floor(t.duration / 1000) : t.duration;
      
      return {
        id: trackId,
        title: t.title || 'Unknown Title',
        artist: t.subtitle || t.authors?.[0]?.name || 'Unknown Artist',
        album: data.name || 'Unknown Album',
        duration: durationSecs || 210,
        images: {
          small: playlistImage,
          medium: playlistImage,
          large: playlistImage
        },
        provider: 'spotify-clone',
        playbackAvailability: true,
        streamUrl: '',
        mimeType: 'audio/mp4',
        explicit: !!t.isExplicit,
        isOriginal: false
      };
    }).filter(t => t.title && t.title !== 'Unknown Title');

    sendSuccess(res, {
      title: data.name,
      description: data.subtitle || '',
      image: playlistImage,
      tracks
    });
  } catch (err) {
    console.error('Clone Playlist Error:', err);
    res.status(500).json({ success: false, error: 'Failed to import playlist' });
  }
});
`;

code = code.replace(/app\.get\('\/api\/search',/, `${endpointCode}\napp.get('/api/search',`);

fs.writeFileSync('server.ts', code);
