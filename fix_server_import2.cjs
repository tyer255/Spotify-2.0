const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /import \* as _spotifyUrlInfo from 'spotify-url-info';\nconst spotifyUrlInfo = _spotifyUrlInfo\.default \|\| _spotifyUrlInfo;/,
  "// @ts-ignore\nimport spotifyUrlInfo from 'spotify-url-info';"
);

fs.writeFileSync('server.ts', code);
