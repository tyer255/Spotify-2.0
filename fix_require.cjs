const fs = require('fs');
const path = 'server.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const ytdl = require('@distube/ytdl-core');",
  "import ytdl from '@distube/ytdl-core';"
);

fs.writeFileSync(path, code);
