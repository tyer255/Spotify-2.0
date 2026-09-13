const fs = require('fs');
const path = 'server.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "if (results && results.topResult) {\n      MusicService.resolvePlayback(\n        results.topResult.id, \n        results.topResult.title, \n        results.topResult.artist, \n        results.topResult.duration\n      ).catch(() => {});\n    }",
  "if (results && results.topResult && results.topResult.type === 'track') {\n      MusicService.resolvePlayback(\n        results.topResult.data.id, \n        results.topResult.data.title, \n        results.topResult.data.artist, \n        results.topResult.data.duration\n      ).catch(() => {});\n    }"
);

fs.writeFileSync(path, code);
console.log('Fixed pre-resolve data accessor');
