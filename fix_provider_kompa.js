import fs from 'fs';

let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

code = code.replace(
  /const results = rankAndSortSearchResults\(rawResults, q\);/g,
  `const results = rankAndSortSearchResults(rawResults, q);\n      results.songs = results.songs.filter(t => !t.title.toLowerCase().includes("punjabi kompa"));`
);

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
