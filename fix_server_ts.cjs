const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/extractSpotizThumbnail/g, "extractSpotifyThumbnail");
code = code.replace(/resolveMissingSpotizThumbnails/g, "resolveMissingSpotifyThumbnails");
fs.writeFileSync('server.ts', code);
