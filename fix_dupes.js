const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

const regex = /const trackKey = `\$\{track.title.toLowerCase\(\)\}.*?;/;
code = code.replace(
  /const trackKey = `\$\{title.toLowerCase\(\)\}::\$\{artist.toLowerCase\(\)\}`;/g,
  `const titleClean = title.toLowerCase().replace(/[^a-z0-9]/g, '');
            const trackKey = \`\${titleClean}\`;`
);

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
