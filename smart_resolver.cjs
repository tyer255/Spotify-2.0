const fs = require('fs');
const filepath = 'server/services/AudioStreamResolver.ts';
let code = fs.readFileSync(filepath, 'utf8');

const startStr = "static async resolveFullTrack(";
const endStr = "export async function validateAudioStream";
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

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
        for (const entry of results.slice(0, 4)) {
          // Light Sanity Check: Does the result vaguely match our query?
          const resTitle = (entry.title || '').toLowerCase();
          const resSubtitle = (entry.subtitle || '').toLowerCase();
          const resSingers = (entry.more_info?.singers || '').toLowerCase();
          
          let titleMatch = resTitle.includes(cleanT) || cleanT.includes(resTitle) || cleanT.split(' ').some(w => w.length > 3 && resTitle.includes(w));
          let artistMatch = !cleanA ? true : cleanA.split(' ').some(w => w.length > 2 && (resSubtitle.includes(w) || resSingers.includes(w) || resTitle.includes(w)));
          
          if (!titleMatch && !artistMatch) {
             continue; // Skip completely unrelated Saavn results (e.g. "Chehra AUR" -> "Dil Sachaa Aur Chehra Jhutha")
          }

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

        if (videos.length > 0) {
          // Score videos to find the best match
          const scored = videos.map(vid => {
             const vidTitle = (vid.title || '').toLowerCase();
             const vidAuthor = (vid.author?.name || '').toLowerCase();
             let score = 0;
             
             // Topic channels usually have the official high-quality audio
             if (vidAuthor.includes('- topic')) score += 50;
             if (vidTitle.includes('official audio') || vidTitle.includes('lyric')) score += 30;

             // Match Title
             if (cleanT.split(' ').every(w => vidTitle.includes(w))) score += 100;
             else if (cleanT.split(' ').some(w => w.length > 3 && vidTitle.includes(w))) score += 50;

             // Match Artist
             if (cleanA && cleanA.split(' ').some(w => w.length > 2 && (vidAuthor.includes(w) || vidTitle.includes(w)))) score += 100;

             // Duration Penalty
             if (expectedDuration) {
                const diff = Math.abs((vid.seconds || vid.duration?.seconds || 0) - expectedDuration);
                if (diff <= 5) score += 80;
                else if (diff <= 15) score += 40;
                else score -= diff; // penalize long videos like 1 hour loops
             }

             return { vid, score };
          });

          scored.sort((a, b) => b.score - a.score);
          const bestVid = scored[0].vid; // Always take the best video to guarantee 100% success

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
