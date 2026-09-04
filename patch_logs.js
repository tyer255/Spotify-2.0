const fs = require('fs');

let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

code = code.replace(
  'console.log(\'[Diagnostics] Fetching authentic Spotiz Home Feed',
  'console.log(\'[Diagnostics] Fetching authentic Spotiz Home Feed\');\nconsole.log("-> 1");'
);

code = code.replace(
  'const [artistsList, recsResults, trendingResults, startListeningResults, albumResults] = await Promise.all',
  'console.log("-> 2 Before Promise.all");\n      const [artistsList, recsResults, trendingResults, startListeningResults, albumResults] = await Promise.all'
);

code = code.replace(
  'const quickPicks = recsResults.filter',
  'console.log("-> 3 After Promise.all");\n      const quickPicks = recsResults.filter'
);

code = code.replace(
  'return {\n        popularArtists:',
  'console.log("-> 4 Returning feed");\n        return {\n        popularArtists:'
);

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
