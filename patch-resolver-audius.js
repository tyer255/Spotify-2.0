import fs from 'fs';
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf8');

code = code.replace(/for \(const query of audiusQueries\) {[\s\S]*?\/\/\s*={40}\n\s*\/\/ Tier 3:/, `
    const audiusPromises = audiusQueries.map(async (query) => {
      try {
        const audiusUrl = \`\${this.AUDIUS_API_BASE}/v1/tracks/search?query=\${encodeURIComponent(query)}&app_name=SPOTIFY2&limit=8\`;
        const json = await safeFetchJson<any>(audiusUrl, 3000);
        if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
          const candidates = [];
          for (const item of json.data) {
            const itemTitle = item.title || '';
            const itemArtist = item.user?.name || item.user?.handle || '';
            const score = calculateMatchScore(itemTitle, itemArtist, title, artist);
            if (item.id && (item.duration || 0) >= 45) {
              candidates.push({ item, score });
            }
          }
          candidates.sort((a, b) => b.score - a.score);
          if (candidates.length > 0 && candidates[0].score >= 60) {
            return candidates[0];
          }
        }
      } catch {
        // Skip
      }
      return null;
    });

    const audiusResults = await Promise.all(audiusPromises);
    const bestAudius = audiusResults.filter(r => r !== null).sort((a, b) => b.score - a.score)[0];
    if (bestAudius) {
      const streamUrl = \`\${this.AUDIUS_API_BASE}/v1/tracks/\${bestAudius.item.id}/stream?app_name=SPOTIFY2\`;
      const duration = Math.max(bestAudius.item.duration || expectedDuration || 210, 120);
      const resolved: ResolvedStream = {
        url: streamUrl,
        duration,
        source: \`Audius Verified (\${bestAudius.item.title})\`,
        bitrate: '320kbps MP3',
        mimeType: 'audio/mpeg',
      };
      console.log(\`[AudioResolver] Audius Verified Match (Score \${bestAudius.score}): "\${bestAudius.item.title}" for "\${title} - \${artist}"\`);
      streamCache.set(cacheKey, { stream: resolved, expiresAt: Date.now() + 86400 * 1000 });
      return resolved;
    }

    // ==========================================
    // Tier 3:`);

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
console.log("Patched audius successfully");
