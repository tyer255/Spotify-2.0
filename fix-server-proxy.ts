import fs from 'fs';

const serverFile = 'server.ts';
let code = fs.readFileSync(serverFile, 'utf8');

if (!code.includes('/api/playback/stream')) {
  const newProxy = `
// 25. General Audio Proxy (for JioSaavn CDNs if blocked)
app.get('/api/playback/stream', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) return res.status(400).send('Missing url parameter');
    
    const fetchRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!fetchRes.ok || !fetchRes.body) {
      return res.status(fetchRes.status).send('Proxy error');
    }
    
    res.setHeader('Content-Type', fetchRes.headers.get('content-type') || 'audio/mp4');
    const contentLength = fetchRes.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    
    // Pipe the response body to Express response
    // Node 18+ Web ReadableStream to Node WritableStream
    const { Readable } = require('stream');
    const nodeStream = Readable.fromWeb(fetchRes.body as any);
    nodeStream.pipe(res);
  } catch (err) {
    console.error('Audio Proxy Error:', err);
    res.status(500).send('Streaming error');
  }
});
`;

  // Insert before VITE INTEGRATION
  code = code.replace('// ================= VITE INTEGRATION =================', newProxy + '\n// ================= VITE INTEGRATION =================');
  fs.writeFileSync(serverFile, code);
  console.log('Added /api/playback/stream proxy');
} else {
  console.log('Proxy already exists');
}
