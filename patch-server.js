import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const route = `
  // Proxy YouTube Audio
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

  // Vite middleware
`;

code = code.replace(/\/\/ Vite middleware for development/g, route + "\n  // Vite middleware for development");

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts successfully");
