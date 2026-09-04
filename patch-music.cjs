const fs = require('fs');
let code = fs.readFileSync('server/services/musicService.ts', 'utf8');

code = code.replace(
  /results.songs = smartRankingService.rankSongs/g,
  "results.songs = await smartRankingService.rankSongs"
);

fs.writeFileSync('server/services/musicService.ts', code);
