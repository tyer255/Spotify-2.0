const fs = require('fs');
const path = 'server/services/AudioStreamResolver.ts';
let code = fs.readFileSync(path, 'utf8');

const originalMethodStr = `static async resolveFullTrack(
    trackId: string,
    title: string,
    artist: string,
    expectedDuration?: number,
    options?: { directAudioOnly?: boolean; allowFallbackTitle?: boolean; forceFresh?: boolean; discardUrl?: string }
  ): Promise<ResolvedStream | null> {`;

const newMethodStr = `static async resolveFullTrack(
    trackId: string,
    title: string,
    artist: string,
    expectedDuration?: number,
    options?: { directAudioOnly?: boolean; allowFallbackTitle?: boolean; forceFresh?: boolean; discardUrl?: string }
  ): Promise<ResolvedStream | null> {
    const cleanT = (title || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const cleanA = (artist || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    if (!cleanT) return null;

    const promises: Promise<ResolvedStream | null>[] = [];

    // 1. JioSaavn Task
    promises.push((async () => {
      try {
        const q = encodeURIComponent(\`\${cleanT} \${cleanA}\`.trim());
        const searchUrl = \`https://www.jiosaavn.com/api.php?__call=search.getResults&q=\${q}&p=1&n=15&_format=json&_marker=0&api_version=4&ctx=web6dot0\`;
        const searchData = await safeFetchJson<any>(searchUrl, 3000);
        let results = searchData?.results || [];
        if (results.length > 0) {
          for (const entry of results.slice(0, 4)) {
            const resTitle = (entry.title || '').toLowerCase();
            const resSubtitle = (entry.subtitle || '').toLowerCase();
            const resSingers = (entry.more_info?.singers || '').toLowerCase();
            
            let titleMatch = resTitle.includes(cleanT) || cleanT.includes(resTitle) || cleanT.split(' ').some(w => w.length > 3 && hasWord(resTitle, w));
            let artistMatch = !cleanA ? true : cleanA.split(' ').some(w => w.length > 1 && (hasWord(resSubtitle, w) || hasWord(resSingers, w) || (hasWord(resTitle, w) && resTitle.includes('feat'))));
            
            if (!titleMatch && !artistMatch) continue;
            
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
      } catch (e) { console.warn('[AudioStreamResolver] JioSaavn error:', e); }
      return null;
    })());

    // 2. YouTube Task
    if (!options?.directAudioOnly) {
      promises.push((async () => {
        try {
          const ytSearch = (await import('yt-search')).default;
          const query = \`\${cleanT} \${cleanA} song\`;
          const searchResults = await ytSearch(query);
          let videos = searchResults?.videos || [];
          if (videos.length > 0) {
            const scored = videos.map((vid, index) => {
               const vidTitle = (vid.title || '').toLowerCase();
               const vidAuthor = (vid.author?.name || '').toLowerCase();
               let score = Math.max(0, (10 - index) * 10);
               if (vidAuthor.includes('- topic')) score += 50;
               if (vidTitle.includes('official audio') || vidTitle.includes('lyric')) score += 30;
               if (cleanT.split(' ').every(w => hasWord(vidTitle, w) || (w.length > 4 && vidTitle.includes(w.substring(0, w.length - 1))))) score += 100;
               else if (cleanT.split(' ').some(w => w.length > 3 && hasWord(vidTitle, w))) score += 50;
               if (cleanA && cleanA.split(' ').some(w => w.length > 1 && (hasWord(vidAuthor, w) || hasWord(vidTitle, w)))) score += 100;
               if (expectedDuration) {
                  const diff = Math.abs((vid.seconds || vid.duration?.seconds || 0) - expectedDuration);
                  if (diff <= 5) score += 80;
                  else if (diff <= 15) score += 40;
                  else score -= diff;
               }
               return { vid, score };
            });
            scored.sort((a, b) => b.score - a.score);
            const bestVid = scored[0].vid;
            return {
              url: \`youtube:\${bestVid.videoId}\`,
              fallbackUrls: [\`youtube:\${bestVid.videoId}\`],
              duration: bestVid.seconds || 0,
              source: \`YouTube (\${bestVid.title})\`,
              bitrate: '320kbps',
              mimeType: 'video/youtube',
              isDirectAudio: false,
              isMediaDescriptor: true,
              descriptorType: 'youtube',
              mediaUri: \`youtube:\${bestVid.videoId}\`,
              resolvedTrackId: \`yt-\${bestVid.videoId}\`,
              resolvedTitle: bestVid.title,
              resolvedArtist: bestVid.author?.name || 'YouTube',
              provider: 'youtube'
            };
          }
        } catch (e) { console.warn('[AudioStreamResolver] YouTube error:', e); }
        return null;
      })());
    }

    // 3. Audius Task
    promises.push((async () => {
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
      } catch (e) { console.warn('[AudioStreamResolver] Audius error:', e); }
      return null;
    })());

    try {
      const winner = await Promise.any(promises.map(async p => {
        const res = await p;
        if (!res) throw new Error("Null stream");
        return res;
      }));
      return winner;
    } catch {
      return null;
    }
  }`;

const parts = code.split(originalMethodStr);
if (parts.length === 2) {
  // Find the end of the method
  const remaining = parts[1];
  let bracketCount = 1;
  let i = 0;
  for (; i < remaining.length; i++) {
    if (remaining[i] === '{') bracketCount++;
    if (remaining[i] === '}') bracketCount--;
    if (bracketCount === 0) break;
  }
  
  const endOfMethod = remaining.substring(i + 1);
  const finalCode = parts[0] + newMethodStr + endOfMethod;
  fs.writeFileSync(path, finalCode);
  console.log('Successfully parallelized AudioStreamResolver');
} else {
  console.log('Failed to find original method');
}
