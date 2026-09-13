const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf-8');

// We need to move iTunes to the bottom (Tier 3), and JioSaavn to Tier 1, YouTube to Tier 2
const itunesBlock = `    // 1. iTunes (Direct MP4, very fast)
    try {
      const iq = \`\${cleanT} \${cleanA}\`.trim();
      const itunesUrl = \`https://itunes.apple.com/search?term=\${encodeURIComponent(iq)}&entity=song&limit=3\`;
      const itunesData = await safeFetchJson<any>(itunesUrl);
      if (itunesData?.results?.length > 0) {
        for (const itItem of itunesData.results) {
          if (!itItem.previewUrl) continue;
          const itTitle = cleanBaseTitle(itItem.trackName);
          const itArtist = cleanBaseTitle(itItem.artistName);
          
          if (itTitle.includes(cleanT) || cleanT.includes(itTitle)) {
            if (itArtist.includes(cleanA) || cleanA.includes(itArtist)) {
              return {
                url: itItem.previewUrl,
                fallbackUrls: [itItem.previewUrl],
                duration: itItem.trackTimeMillis ? Math.round(itItem.trackTimeMillis / 1000) : (expectedDuration || 210),
                source: \`iTunes (\${itItem.trackName})\`,
                bitrate: '256kbps AAC',
                mimeType: 'audio/mp4',
                isDirectAudio: true,
                isMediaDescriptor: false,
                descriptorType: 'direct',
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn('iTunes error', e);
    }
`;

code = code.replace(itunesBlock, '');
code = code.replace('return null;\n  }', itunesBlock.replace('// 1. iTunes', '// 3. iTunes Fallback (30s preview)') + '\n    return null;\n  }');
code = code.replace('// 2. JioSaavn', '// 1. JioSaavn');
code = code.replace('// 3. YouTube', '// 2. YouTube');

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
