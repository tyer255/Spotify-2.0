import fs from 'fs';

let code = fs.readFileSync('src/views/HomeView.tsx', 'utf8');

code = code.replace(
  /const historyArtists = profile\.recentHistory\.map\(t => t\.artist\);/g,
  "const historyArtists = profile.recentHistory.map(t => t.track?.artist).filter(Boolean);"
);

code = code.replace(
  /const seenIds = new Set\(profile\.recentHistory\.map\(t => t\.id\)\);/g,
  "const seenIds = new Set(profile.recentHistory.map(t => t.track?.id).filter(Boolean));"
);

fs.writeFileSync('src/views/HomeView.tsx', code);
