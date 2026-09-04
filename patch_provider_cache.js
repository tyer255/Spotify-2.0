import fs from 'fs';

let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

code = code.replace(
  /const cacheKey = 'home-feed-real-v4';/g,
  "const cacheKey = 'home-feed-real-v5';"
);

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
