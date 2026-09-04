const fs = require('fs');
let file = fs.readFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', 'utf8');

file = file.replace('src={foundTrack.images?.medium || foundTrack.images?.small}', 'src={foundTrack.images?.medium || foundTrack.images?.small || ""}');

fs.writeFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', file);
