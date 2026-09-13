const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf-8');

const searchRegex = /const autoSongs = autoData\?\.songs\?\.data \|\| \[\];[\s\S]*?\} catch \(e\) \{\n      console.warn\('JioSaavn error', e\);\n    \}/;

const replacement = `const autoSongs = autoData?.songs?.data || [];
      const jioResults = [];
      for (const as of autoSongs.slice(0, 5)) {
        if (as.id) {
          const detailUrl = \`https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=\${as.id}&_format=json&_marker=0&api_version=4&ctx=web6dot0\`;
          const detailData = await safeFetchJson<any>(detailUrl);
          const item = detailData?.songs?.[0];
          
          if (item && item.more_info?.encrypted_media_url) {
            const itemTitle = cleanBaseTitle(item.title || '');
            const primaryArt = cleanBaseTitle(item.more_info?.artistMap?.primary_artists?.map((a: any) => a.name).join(', ') || item.primary_artists || '');
            
            if ((itemTitle.includes(cleanT) || cleanT.includes(itemTitle)) && (primaryArt.includes(cleanA) || cleanA.includes(primaryArt))) {
              jioResults.push(item);
            }
          }
        }
      }

      if (jioResults.length > 0) {
        // Sort JioSaavn results
        const originalTitleLower = (title || '').toLowerCase();
        const unwantedKeywords = ['acoustic', 'slowed', 'reverb', '8d', 'remix', 'mashup', 'female', 'cover', 'instrumental', 'karaoke', 'speed up', 'sped up', 'lofi', 'live', 'edit', 'version'];
        
        jioResults.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;

            const penalize = (t) => {
                const lowerTitle = (t || '').toLowerCase();
                let penalty = 0;
                for (const kw of unwantedKeywords) {
                    if (lowerTitle.includes(kw) && !originalTitleLower.includes(kw)) {
                        penalty += 200;
                    }
                }
                return penalty;
            };

            scoreA -= penalize(a.title);
            scoreB -= penalize(b.title);

            if (expectedDuration) {
                const durA = parseInt(a.more_info?.duration || '0', 10);
                const durB = parseInt(b.more_info?.duration || '0', 10);
                const diffA = Math.abs(durA - expectedDuration);
                const diffB = Math.abs(durB - expectedDuration);
                
                if (diffA <= 3) scoreA += 150;
                else if (diffA <= 10) scoreA += 100;
                else if (diffA <= 30) scoreA += 50;

                if (diffB <= 3) scoreB += 150;
                else if (diffB <= 10) scoreB += 100;
                else if (diffB <= 30) scoreB += 50;
            }

            return scoreB - scoreA;
        });

        const bestItem = jioResults[0];
        const streamResult = await decryptSaavnMediaUrl(bestItem.more_info.encrypted_media_url);
        if (streamResult) {
            return {
                url: streamResult.primaryUrl,
                fallbackUrls: streamResult.fallbackUrls,
                duration: parseInt(bestItem.more_info?.duration || '0', 10) || (expectedDuration || 210),
                source: \`JioSaavn (\${bestItem.title})\`,
                bitrate: '320kbps AAC',
                mimeType: 'audio/mp4',
                isDirectAudio: true,
                isMediaDescriptor: false,
                descriptorType: 'direct',
            };
        }
      }
    } catch (e) {
      console.warn('JioSaavn error', e);
    }`;

code = code.replace(searchRegex, replacement);
fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
