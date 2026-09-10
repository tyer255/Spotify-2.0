const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// Just cleaning up the debug lyrics count display in the header now that the bug is fixed.
code = code.replace(
  /<h3 className="font-bold text-white">Lyrics preview \{lyricsData\?\.lines\?\.length \? `\(\\$\{lyricsData\.lines\.length\}\)` : ''\}<\/h3>/,
  '<h3 className="font-bold text-white">Lyrics</h3>'
);

// We can also ensure it shows the track title rather than "Lyrics preview" when possible
fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
