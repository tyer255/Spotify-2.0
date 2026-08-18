import fs from 'fs';
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf8');

// Parallelize saavn queries
code = code.replace(/for \(const q of saavnQueries\) {[\s\S]*?\/\/\s*={40}\n\s*\/\/ Tier 2:/, `
    const saavnPromises = saavnQueries.map(async (q) => {
      try {
        const saavnUrl = \`https://www.jiosaavn.com/api.php?__call=search.getResults&q=\${encodeURIComponent(q)}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=10&p=1\`;
        const data = await safeFetchJson<any>(saavnUrl, 3500);
        if (data && data.results && Array.isArray(data.results) && data.results.length > 0) {
          const candidates = [];
          for (const item of data.results) {
            const itemTitle = item.title ? item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : '';
            const itemArtist = item.more_info?.music || item.subtitle || '';
            const score = calculateMatchScore(itemTitle, itemArtist, title, artist);
            const enc = item.more_info?.encrypted_media_url;
            const streamUrl = enc ? decryptSaavnMediaUrl(enc) : null;
            if (streamUrl) {
              const dur = parseInt(item.more_info?.duration || '0', 10) || (expectedDuration || 210);
              candidates.push({ item, score, streamUrl, duration: dur });
            }
          }
          candidates.sort((a, b) => b.score - a.score);
          if (candidates.length > 0 && candidates[0].score >= 50) {
            return candidates[0];
          }
        }
      } catch (err) {
        // ignore
      }
      return null;
    });

    const saavnResults = await Promise.all(saavnPromises);
    const bestSaavn = saavnResults.filter(r => r !== null).sort((a, b) => b.score - a.score)[0];
    if (bestSaavn) {
      const finalDuration = bestSaavn.duration > 40 ? bestSaavn.duration : (expectedDuration || 210);
      const resolved: ResolvedStream = {
        url: bestSaavn.streamUrl,
        duration: finalDuration,
        source: \`JioSaavn 320kbps (\${bestSaavn.item.title})\`,
        bitrate: '320kbps AAC',
        mimeType: 'audio/mp4',
      };
      console.log(\`[AudioResolver] Verified Match (Score \${bestSaavn.score}): "\${bestSaavn.item.title}" for "\${title} - \${artist}"\`);
      streamCache.set(cacheKey, { stream: resolved, expiresAt: Date.now() + 86400 * 1000 });
      return resolved;
    }

    // ==========================================
    // Tier 2:`);

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
console.log("Patched resolver successfully");
