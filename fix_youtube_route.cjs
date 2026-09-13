const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const oldRoute = `app.get('/api/stream/youtube/:id', async (req, res) => {
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
});`;

const newRoute = `app.get('/api/stream/youtube/:id', async (req, res) => {
  try {
    const ytdl = require('@distube/ytdl-core');
    const videoId = req.params.id;
    if (!ytdl.validateID(videoId)) {
      return res.status(400).send('Invalid YouTube ID');
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const stream = ytdl(videoId, { filter: 'audioonly', quality: 'highestaudio' });
    stream.pipe(res);
    
    stream.on('error', (err: any) => {
      console.error('YTDL Stream Error:', err);
      if (!res.headersSent) res.status(500).send('Streaming error');
    });
  } catch (err) {
    console.error('YouTube Proxy Error:', err);
    if (!res.headersSent) res.status(500).send('Streaming error');
  }
});`;

code = code.replace(oldRoute, newRoute);
fs.writeFileSync('server.ts', code);
