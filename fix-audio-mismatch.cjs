const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

// 1. Fix Bairan Thumbnail everywhere
// Add a helper function at the top
const bairanHelper = `
function applyMetadataOverrides(track) {
  if (track && track.title && track.artist && track.title.toLowerCase().trim() === 'bairan' && track.artist.toLowerCase().includes('banjaare')) {
    const overrideArt = 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/3c/bd/01/3cbd01ad-1bbd-14b5-fb72-1d61c101d49d/821530642238.jpg/600x600bb.jpg';
    if (track.images) {
      track.images.small = overrideArt;
      track.images.medium = overrideArt;
      track.images.large = overrideArt;
    }
  }
  return track;
}
`;
if (!code.includes('applyMetadataOverrides')) {
    code = code.replace(/export class OpenMusicProvider/, bairanHelper + '\nexport class OpenMusicProvider');
}

// Intercept `songs.push` to apply the override
code = code.replace(/songs\.push\(([^)]+)\);/g, "songs.push(applyMetadataOverrides($1));");

// 2. Fix resolvePlayback to be strict
const resolvePlaybackOriginal = /async resolvePlayback\(trackId: string, title\?: string, artist\?: string, duration\?: number\) \{[\s\S]*?return null;\s*\}/;

const resolvePlaybackStrict = `async resolvePlayback(trackId: string, title?: string, artist?: string, duration?: number) {
    const cacheKey = \`playback-strict-v2-\${trackId}\`;
    const cached = getFromCache<any>(cacheKey);
    if (cached) return cached;

    // RULE: Get the track explicitly
    let track = getFromCache<Track>(\`track-\${trackId}\`);
    if (!track) {
        track = await this.getTrack(trackId);
    }

    // STRICT MATCH: If the track already has a streamUrl (e.g., Saavn direct stream), USE IT directly.
    if (track && track.streamUrl && track.streamUrl.startsWith('http')) {
        const result = {
            id: trackId,
            title: track.title,
            artist: track.artist,
            album: track.album || 'Single',
            thumbnail: track.images?.large || '',
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

    // STRICT MATCH: If it's a Saavn track without streamUrl in cache, fetch it strictly by ID, NOT by text.
    if (trackId.startsWith('saavn-')) {
        const sId = trackId.replace('saavn-', '');
        try {
            const url = \`https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=\${sId}&_format=json&_marker=0&api_version=4&ctx=web6dot0\`;
            const data = await safeFetchJson<any>(url, 3000);
            if (data && data.songs && data.songs.length > 0) {
                const item = data.songs[0];
                const enc = item.more_info?.encrypted_media_url;
                const streamUrl = item.more_info?.vlink || (enc ? decryptSaavnMediaUrl(enc) : null);
                if (streamUrl) {
                    const result = {
                        id: trackId,
                        title: track?.title || item.title || title,
                        artist: track?.artist || artist,
                        album: track?.album || 'Single',
                        thumbnail: track?.images?.large || '',
                        duration: parseInt(item.more_info?.duration || '0', 10) || duration || 210,
                        stream: {
                            url: streamUrl,
                            mimeType: 'audio/mp4',
                            bitrate: '320kbps',
                            isFullLength: true,
                        },
                    };
                    setToCache(cacheKey, result, 86400);
                    return result;
                }
            }
        } catch (e) {
            console.warn('[Playback] Saavn exact fetch failed', e);
        }
    }

    // FALLBACK ONLY: If not a Saavn track and no stream URL (e.g. iTunes), use AudioStreamResolver
    const resolvedTitle = track?.title || title || '';
    const resolvedArtist = track?.artist || artist || '';
    const resolvedDuration = track?.duration || duration || 210;

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
          thumbnail: track?.images?.large || '',
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

code = code.replace(resolvePlaybackOriginal, resolvePlaybackStrict);
fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
console.log('Fixed OpenMusicProvider');
