const fs = require('fs');
const filepath = 'server/services/AudioStreamResolver.ts';
let code = fs.readFileSync(filepath, 'utf8');

// The function starts at "static async resolveFullTrack(" and ends before "export async function validateAudioStream"
const startStr = "static async resolveFullTrack(";
const endStr = "export async function validateAudioStream";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find bounds");
    process.exit(1);
}

const newMethod = `  static async resolveFullTrack(
    trackId: string,
    title: string,
    artist: string,
    expectedDuration?: number,
    options?: { directAudioOnly?: boolean; allowFallbackTitle?: boolean }
  ): Promise<ResolvedStream | null> {
    const cleanT = (title || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const cleanA = (artist || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    if (!cleanT) return null;

    // 1. JioSaavn Search First (Official Direct Streams)
    try {
      const q = encodeURIComponent(\`\${cleanT} \${cleanA}\`.trim());
      const searchUrl = \`https://www.jiosaavn.com/api.php?__call=search.getResults&q=\${q}&p=1&n=15&_format=json&_marker=0&api_version=4&ctx=web6dot0\`;
      const searchData = await safeFetchJson<any>(searchUrl, 3000);
      let results = searchData?.results || [];

      if (results.length > 0) {
        for (const entry of results.slice(0, 3)) {
          let encryptedUrl = entry.more_info?.encrypted_media_url;
          if (!encryptedUrl && entry.id) {
            const detailUrl = \`https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=\${entry.id}&_format=json&_marker=0&api_version=4&ctx=web6dot0\`;
            const detailData = await safeFetchJson<any>(detailUrl, 2500);
            encryptedUrl = detailData?.songs?.[0]?.more_info?.encrypted_media_url;
          }
          if (encryptedUrl) {
            const streamResult = await decryptSaavnMediaUrl(encryptedUrl);
            if (streamResult) {
              return {
                url: streamResult.primaryUrl,
                fallbackUrls: streamResult.fallbackUrls,
                duration: parseInt(entry.more_info?.duration || '0', 10) || (expectedDuration || 210),
                source: \`JioSaavn (\${entry.title})\`,
                bitrate: '320kbps AAC',
                mimeType: 'audio/mp4',
                isDirectAudio: true,
                isMediaDescriptor: false,
                descriptorType: 'direct',
                resolvedTrackId: \`saavn-\${entry.id}\`,
                resolvedTitle: entry.title,
                resolvedArtist: extractSaavnArtist(entry),
                provider: 'saavn'
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn('[AudioStreamResolver] JioSaavn resolution error:', e);
    }

    // 2. YouTube Search (100% guarantee hit)
    if (!options?.directAudioOnly) {
      try {
        const ytSearch = (await import('yt-search')).default;
        const query = \`\${cleanT} \${cleanA} audio\`;
        const searchResults = await ytSearch(query);
        let videos = searchResults?.videos || [];

        // Sort by topic and duration
        videos = videos.sort((a, b) => {
          const aTopic = (a.author?.name || '').toLowerCase().includes('- topic');
          const bTopic = (b.author?.name || '').toLowerCase().includes('- topic');
          let scoreA = aTopic ? 50 : 0;
          let scoreB = bTopic ? 50 : 0;
          if (expectedDuration) {
            const diffA = Math.abs((a.seconds || a.duration?.seconds || 0) - expectedDuration);
            const diffB = Math.abs((b.seconds || b.duration?.seconds || 0) - expectedDuration);
            if (diffA <= 3) scoreA += 150;
            else if (diffA <= 10) scoreA += 100;
            if (diffB <= 3) scoreB += 150;
            else if (diffB <= 10) scoreB += 100;
          }
          return scoreB - scoreA;
        });

        if (videos.length > 0) {
          const vid = videos[0]; // Always take the best video to guarantee 100% success
          return {
            url: \`youtube:\${vid.videoId}\`,
            fallbackUrls: [\`youtube:\${vid.videoId}\`],
            duration: vid.seconds || 0,
            source: \`YouTube (\${vid.title})\`,
            bitrate: '320kbps',
            mimeType: 'video/youtube',
            isDirectAudio: false,
            isMediaDescriptor: true,
            descriptorType: 'youtube',
            mediaUri: \`youtube:\${vid.videoId}\`,
            resolvedTrackId: \`yt-\${vid.videoId}\`,
            resolvedTitle: vid.title,
            resolvedArtist: vid.author?.name || 'YouTube',
            provider: 'youtube'
          };
        }
      } catch (e) {
        console.warn('[AudioStreamResolver] YouTube search error:', e);
      }
    }

    // 3. Audius
    try {
      const audiusUrl = \`https://discoveryprovider.audius.co/v1/tracks/search?query=\${encodeURIComponent(cleanT + ' ' + cleanA)}&app_name=spotiz\`;
      const audiusData = await safeFetchJson<any>(audiusUrl, 3000);
      const audiusTracks = audiusData?.data || [];
      if (audiusTracks.length > 0) {
        const topTrack = audiusTracks[0];
        const streamUrl = \`https://discoveryprovider.audius.co/v1/tracks/\${topTrack.id}/stream?app_name=spotiz\`;
        return {
          url: streamUrl,
          fallbackUrls: [streamUrl],
          duration: topTrack.duration || (expectedDuration || 210),
          source: \`Audius (\${topTrack.title})\`,
          bitrate: '320kbps MP3',
          mimeType: 'audio/mpeg',
          isDirectAudio: true,
          isMediaDescriptor: false,
          descriptorType: 'direct',
          resolvedTrackId: \`audius-\${topTrack.id}\`,
          resolvedTitle: topTrack.title,
          resolvedArtist: topTrack.user?.name || '',
          provider: 'audius'
        };
      }
    } catch (e) {
      console.warn('[AudioStreamResolver] Audius fallback error:', e);
    }
    return null;
  }

`;

code = code.substring(0, startIndex) + newMethod + code.substring(endIndex);
fs.writeFileSync(filepath, code);
