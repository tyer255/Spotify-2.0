const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

const target = `      let lyricData: any = null;

      // 1. Query LRCLIB with Exact & Search Endpoints
      const lrclibUrl = \`https://lrclib.net/api/get?track_name=\${encodeURIComponent(cleanTitle)}&artist_name=\${encodeURIComponent(cleanArtist)}\${duration ? \`&duration=\${Math.round(duration)}\` : ''}\`;
      lyricData = await safeFetchJson<any>(lrclibUrl, 3500);

      if (!lyricData) {
        const fallbackLrcUrl = \`https://lrclib.net/api/get?track_name=\${encodeURIComponent(cleanTitle)}&artist_name=\${encodeURIComponent(cleanArtist)}\`;
        lyricData = await safeFetchJson<any>(fallbackLrcUrl, 3500);
      }

      if (!lyricData || (!lyricData.syncedLyrics && !lyricData.plainLyrics)) {
        const searchUrl = \`https://lrclib.net/api/search?q=\${encodeURIComponent(\`\${cleanArtist} \${cleanTitle}\`)}\`;
        const list = await safeFetchJson<any[]>(searchUrl, 3500);
        if (Array.isArray(list) && list.length > 0) {
          lyricData = list.find((item) => item.syncedLyrics) || list[0];
        }
      }`;

const replacement = `      let lyricData: any = null;

      // 1. First try Exact Endpoint with duration
      if (duration && duration > 20) {
        const lrclibUrl = \`https://lrclib.net/api/get?track_name=\${encodeURIComponent(cleanTitle)}&artist_name=\${encodeURIComponent(cleanArtist)}&duration=\${Math.round(duration)}\`;
        lyricData = await safeFetchJson<any>(lrclibUrl, 3500);
      }

      // 2. If no exact match by duration, try Intelligent Scored Search
      if (!lyricData || !lyricData.syncedLyrics) {
        const searchQueries = [
          \`\${cleanArtist} \${cleanTitle}\`,
          \`\${cleanTitle} \${cleanArtist}\`,
          cleanTitle,
        ];

        let candidateList = [];
        for (const query of searchQueries) {
          const searchUrl = \`https://lrclib.net/api/search?q=\${encodeURIComponent(query)}\`;
          const list = await safeFetchJson(searchUrl, 3500);
          if (Array.isArray(list) && list.length > 0) {
            candidateList = list;
            break;
          }
        }

        if (candidateList.length > 0) {
          const scored = candidateList.map((item) => {
            let score = 0;
            const itemTitle = (item.trackName || '').toLowerCase();
            const itemArtist = (item.artistName || '').toLowerCase();
            const cleanTitleLow = cleanTitle.toLowerCase();
            const cleanArtistLow = cleanArtist.toLowerCase();

            if (item.syncedLyrics && item.syncedLyrics.length > 20) score += 120;
            else if (item.plainLyrics && item.plainLyrics.length > 20) score += 20;

            if (itemTitle === cleanTitleLow) score += 60;
            else if (itemTitle.includes(cleanTitleLow)) score += 35;

            if (cleanArtistLow.length > 1 && itemArtist.includes(cleanArtistLow)) score += 45;
            else if (cleanArtistLow.length > 1 && cleanArtistLow.includes(itemArtist)) score += 30;

            const isRemixOrCover = /(remix|cover|lofi|slowed|reverb|karaoke|acoustic|live|tribute)/i.test(itemTitle);
            const originalWantedRemix = /(remix|cover|lofi|slowed|reverb|karaoke|acoustic|live)/i.test(cleanTitleLow);
            if (isRemixOrCover && !originalWantedRemix) score -= 60;

            if (duration && duration > 20 && item.duration) {
              const durDiff = Math.abs(item.duration - duration);
              if (durDiff <= 2) score += 80;
              else if (durDiff <= 5) score += 55;
              else if (durDiff <= 10) score += 30;
              else score -= Math.min(Math.round(durDiff * 2), 100);
            }

            return { item, score };
          });

          scored.sort((a, b) => b.score - a.score);
          if (scored[0] && scored[0].score > 0) {
            lyricData = scored[0].item;
          }
        }
      }

      // 3. Fallback to duration-less exact match if search also fails
      if (!lyricData) {
        const fallbackLrcUrl = \`https://lrclib.net/api/get?track_name=\${encodeURIComponent(cleanTitle)}&artist_name=\${encodeURIComponent(cleanArtist)}\`;
        lyricData = await safeFetchJson<any>(fallbackLrcUrl, 3500);
      }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
  console.log('Patched successfully');
} else {
  console.log('Target not found!');
}
