const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

code = code.replace(
  /<h3 className="font-bold text-white">Lyrics preview \{lyricsData\?\.lines\?\.length \? \`\(\$\{lyricsData\.lines\.length\}\)\` : ''\}<\/h3>/,
  '<h3 className="font-bold text-white">Lyrics</h3>'
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
