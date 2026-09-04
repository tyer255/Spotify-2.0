const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

const targetFunctionRegex = /async resolvePlayback\(trackId: string, title\?: string, artist\?: string, duration\?: number\) \{[\s\S]*?return null;\s*\}/;

const newFunction = `async resolvePlayback(trackId: string, title?: string, artist?: string, duration?: number) {
    const cacheKey = \`playback-\${trackId}-\${(title || '').toLowerCase()}-\${(artist || '').toLowerCase()}\`;
    const cached = getFromCache<any>(cacheKey);
    if (cached) return cached;

    // RULE: Audio source must be associated with the canonical unique identifier of that exact track.
    // Do not independently search for audio by title/artist if a direct stream is available for the track ID.
    const track = getFromCache<Track>(\`track-\${trackId}\`) || await this.getTrack(trackId);
    
    // If the track natively has a full stream URL (e.g., from JioSaavn), use it directly!
    // We do not want to fallback to title/artist search if the canonical audio is already available.
    if (track && track.streamUrl && trackId.startsWith('saavn-')) {
      const result = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album || 'Single',
        thumbnail: track.images?.large || track.images?.medium || '',
        duration: track.duration || duration || 210,
        stream: {
          url: track.streamUrl,
          mimeType: track.mimeType || 'audio/mp4',
          bitrate: '320kbps',
          isFullLength: true,
        },
      };
      setToCache(cacheKey, result, 86400);
      return result;
    }

    const resolvedTitle = title || track?.title || '';
    const resolvedArtist = artist || track?.artist || '';
    const resolvedDuration = duration || track?.duration || 210;

    // Only fallback to AudioStreamResolver (which searches by title/artist) if native stream is missing/incomplete
    if (resolvedTitle) {
      const fullStream = await AudioStreamResolver.resolveFullTrack(
        trackId,
        resolvedTitle,
        resolvedArtist,
        resolvedDuration
      );

      if (fullStream && fullStream.url) {
        const result = {
          id: trackId,
          title: resolvedTitle,
          artist: resolvedArtist,
          album: track?.album || 'Single',
          thumbnail: track?.images?.large || track?.images?.medium || '',
          duration: fullStream.duration || resolvedDuration,
          stream: {
            url: fullStream.url,
            mimeType: fullStream.mimeType,
            bitrate: fullStream.bitrate,
            isFullLength: true,
          },
        };
        setToCache(cacheKey, result, 86400);
        return result;
      }
    }

    return null;
  }`;

if (!targetFunctionRegex.test(code)) {
  console.log("Failed to match resolvePlayback");
} else {
  code = code.replace(targetFunctionRegex, newFunction);
  fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
  console.log("Successfully replaced resolvePlayback");
}
