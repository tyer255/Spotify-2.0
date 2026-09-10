const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// I am modifying the display index so that we see something even if active index is -1
code = code.replace(
  "const displayIndex = Math.max(0, activeLyricIndex);",
  "const displayIndex = activeLyricIndex >= 0 ? activeLyricIndex : 0;"
);

// If lyrics are just static strings, we want to at least show the first ones instead of nothing.
code = code.replace(
  "const isActive = i === 0 && activeLyricIndex >= 0 && !isUnsynced;",
  "const isActive = i === 0 && activeLyricIndex >= 0 && !isUnsynced;"
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
