const fs = require('fs');
const path = 'server.ts';
let code = fs.readFileSync(path, 'utf8');

// Patch search
code = code.replace(
  "const results = await MusicService.search(q, userId);\n    sendSuccess(res, results);",
  "const results = await MusicService.search(q, userId);\n    sendSuccess(res, results);\n\n    // Pre-resolve top track in background for instant 1s playback\n    if (results && results.topResult) {\n      MusicService.resolvePlayback(\n        results.topResult.id, \n        results.topResult.title, \n        results.topResult.artist, \n        results.topResult.duration\n      ).catch(() => {});\n    }\n    if (results && results.songs && results.songs.length > 0) {\n      MusicService.resolvePlayback(\n        results.songs[0].id, \n        results.songs[0].title, \n        results.songs[0].artist, \n        results.songs[0].duration\n      ).catch(() => {});\n    }"
);

// Patch track
code = code.replace(
  "const track = await MusicService.getTrack(req.params.id);\n    if (!track) {\n      return sendError(res, 'TRACK_NOT_FOUND', `Track with id ${req.params.id} could not be found`, 404);\n    }\n    sendSuccess(res, track);",
  "const track = await MusicService.getTrack(req.params.id);\n    if (!track) {\n      return sendError(res, 'TRACK_NOT_FOUND', `Track with id ${req.params.id} could not be found`, 404);\n    }\n    sendSuccess(res, track);\n\n    // Pre-resolve in background\n    MusicService.resolvePlayback(track.id, track.title, track.artist, track.duration).catch(() => {});"
);

fs.writeFileSync(path, code);
console.log('Added pre-resolution to server.ts');
