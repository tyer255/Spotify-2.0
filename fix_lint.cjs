const fs = require('fs');
let code = fs.readFileSync('src/context/UserContext.tsx', 'utf8');

code = code.replace(
  /await api\.reorderPlaylist\(playlistId, trackIds\);/g,
  "await api.reorderPlaylistTracks(playlistId, trackIds);"
);

fs.writeFileSync('src/context/UserContext.tsx', code);
