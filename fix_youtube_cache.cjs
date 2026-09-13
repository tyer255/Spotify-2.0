const fs = require('fs');
const path = 'server.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('const ytdlCache = new Map<string, any>();')) {
  // Add the cache map and pre-fetch function at the top level
  code = code.replace(
    "const app = express();",
    `const ytdl = require('@distube/ytdl-core');
const ytdlCache = new Map<string, any>();
const ytdlPromises = new Map<string, Promise<any>>();

async function prefetchYtdlInfo(videoId: string) {
  if (ytdlCache.has(videoId)) return ytdlCache.get(videoId);
  if (ytdlPromises.has(videoId)) return ytdlPromises.get(videoId);
  
  const promise = ytdl.getInfo(videoId).then((info: any) => {
    ytdlCache.set(videoId, info);
    setTimeout(() => ytdlCache.delete(videoId), 1000 * 60 * 60); // 1 hr cache
    return info;
  }).catch((err: any) => {
    console.error('Prefetch ytdl error:', err);
    return null;
  }).finally(() => {
    ytdlPromises.delete(videoId);
  });
  
  ytdlPromises.set(videoId, promise);
  return promise;
}

const app = express();`
  );

  // Update the stream route
  code = code.replace(
    "app.get('/api/stream/youtube/:id', async (req, res) => {",
    "app.get('/api/stream/youtube/:id', async (req, res) => {"
  );

  const oldYtdlRoute = `    const ytdl = require('@distube/ytdl-core');
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
    stream.pipe(res);`;

  const newYtdlRoute = `    const videoId = req.params.id;
    if (!ytdl.validateID(videoId)) {
      return res.status(400).send('Invalid YouTube ID');
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    let info = ytdlCache.get(videoId);
    if (!info && ytdlPromises.has(videoId)) {
      info = await ytdlPromises.get(videoId);
    }
    if (!info) {
      info = await prefetchYtdlInfo(videoId);
    }
    
    let stream;
    if (info) {
      stream = ytdl.downloadFromInfo(info, { filter: 'audioonly', quality: 'highestaudio' });
    } else {
      stream = ytdl(videoId, { filter: 'audioonly', quality: 'highestaudio' });
    }
    stream.pipe(res);`;

  code = code.replace(oldYtdlRoute, newYtdlRoute);
  
  // Hook prefetch into /api/playback/resolve
  code = code.replace(
    "sendSuccess(res, resolved);",
    "sendSuccess(res, resolved);\n    \n    // Pre-fetch youtube info to make stream playback instant\n    if (resolved && resolved.url && resolved.url.includes('/api/stream/youtube/')) {\n      const vidId = resolved.url.split('/').pop();\n      if (vidId) prefetchYtdlInfo(vidId).catch(() => {});\n    } else if (resolved && resolved.url && resolved.url.startsWith('youtube:')) {\n      const vidId = resolved.url.split(':')[1];\n      if (vidId) prefetchYtdlInfo(vidId).catch(() => {});\n    }"
  );

  fs.writeFileSync(path, code);
  console.log('Added youtube prefetch cache');
} else {
  console.log('Already added');
}
