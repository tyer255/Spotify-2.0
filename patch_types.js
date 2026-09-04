const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');
code = code.replace(
  /\| \{ type: 'artist'; artistId: string; expectedName\?: string \}/,
  "| { type: 'artist'; artistId: string; expectedName?: string; initialImage?: string }"
);
fs.writeFileSync('src/types.ts', code);
