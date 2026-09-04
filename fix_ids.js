import fs from 'fs';

const path = './server/services/spotifyCanvasService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(`    if (SPOTIFY_ID_MAP[query2]) return SPOTIFY_ID_MAP[query2];\n      return ids;\n  }`, `    if (SPOTIFY_ID_MAP[query2]) return SPOTIFY_ID_MAP[query2];\n      return null;\n  }`);

code = code.replace(`    if (!title) return null;`, `    if (!title) return [];`);

fs.writeFileSync(path, code);
