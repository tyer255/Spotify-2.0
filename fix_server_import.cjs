const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /import spotifyUrlInfo from 'spotify-url-info';/,
  "import * as _spotifyUrlInfo from 'spotify-url-info';\nconst spotifyUrlInfo = _spotifyUrlInfo.default || _spotifyUrlInfo;"
);

fs.writeFileSync('server.ts', code);
