const fs = require('fs');
let code = fs.readFileSync('src/utils/searchRanker.ts', 'utf8');

const replacement = `
  const qNorm = parsed.normalized;

  // 1. Sort Songs (with deep personalization)
  let rawSongs = results.songs || [];
  // Strict deduplication to avoid history/API duplicates
  rawSongs = rawSongs.filter((track, index, self) => {
    const normTitle = track.title.toLowerCase().replace(/\\([^)]*\\)/g, '').replace(/\\[[^\\]]*\\]/g, '').replace(/[^a-z0-9]/g, '');
    const normArtist = track.artist.split(/[,&\\/\\|]/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    return index === self.findIndex((t) => {
      const tNormTitle = t.title.toLowerCase().replace(/\\([^)]*\\)/g, '').replace(/\\[[^\\]]*\\]/g, '').replace(/[^a-z0-9]/g, '');
      const tNormArtist = t.artist.split(/[,&\\/\\|]/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      return normTitle === tNormTitle && normArtist === tNormArtist;
    });
  });

  const sortedSongs = rankAndSortTracks(rawSongs, q, personalization);
`;

code = code.replace(/const qNorm = parsed\.normalized;\s*\/\/\ 1\. Sort Songs \(with deep personalization\)\s*const sortedSongs = rankAndSortTracks\(results\.songs \|\| \[\], q, personalization\);/g, replacement);

fs.writeFileSync('src/utils/searchRanker.ts', code);
console.log('Patched searchRanker.ts');
