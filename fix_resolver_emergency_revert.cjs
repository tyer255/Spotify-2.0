const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf-8');

code = code.replace(
  "const hasArtist = cleanA === '' ? true : cleanA.split(' ').some(w => w.length > 2 && (vidAuthorLower.includes(w) || vidTitleLower.includes(w)));",
  "const hasArtist = cleanA.split(' ').some(w => w.length > 2 && (vidAuthorLower.includes(w) || vidTitleLower.includes(w)));"
);

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
