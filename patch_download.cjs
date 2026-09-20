const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');
code = code.replace(
  /if \(resolvedStream\?\.url && resolvedStream\.url\.startsWith\('http'\)\) \{/g,
  'if (resolvedStream?.url && (resolvedStream.url.startsWith("http") || resolvedStream.url.startsWith("youtube:"))) {'
);

code = code.replace(
  /if \(!audioUrl \|\| !audioUrl\.startsWith\('http'\)\) \{/g,
  'if (!audioUrl || (!audioUrl.startsWith("http") && !audioUrl.startsWith("youtube:"))) {'
);

// We need to inject the youtube download logic before the candidateUrls logic.
// Find: const candidateUrls: string[] = [audioUrl];
const injection = `
  if (audioUrl.startsWith('youtube:')) {
    const videoId = audioUrl.split(':')[1];
    res.setHeader('Content-Type', 'audio/mp4');
    let info = ytdlCache.get(videoId);
    if (!info && ytdlPromises.has(videoId)) {
      info = await ytdlPromises.get(videoId);
    }
    if (!info) {
      info = await prefetchYtdlInfo(videoId).catch(()=>null);
    }
    let stream;
    try {
      if (info) {
        stream = ytdl.downloadFromInfo(info, { filter: 'audioonly', quality: 'highestaudio' });
      } else {
        stream = ytdl(videoId, { filter: 'audioonly', quality: 'highestaudio' });
      }
      stream.pipe(res);
      stream.on('error', (err: any) => {
        console.error('YTDL Stream Error:', err);
        if (!res.headersSent) res.status(500).send('Streaming error');
      });
      return;
    } catch(e) {
      console.error(e);
      return sendError(res, 'DOWNLOAD_FAILED', 'Failed to retrieve audio stream', 500);
    }
  }

  const candidateUrls: string[] = [audioUrl];
`;
code = code.replace('const candidateUrls: string[] = [audioUrl];', injection);

fs.writeFileSync('server.ts', code);
