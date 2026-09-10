const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

code = code.replace(
  "const displayIndex = activeLyricIndex >= 0 ? activeLyricIndex : 0;",
  "const displayIndex = Math.max(0, activeLyricIndex);"
);

// If lyrics are unsynced (-1 times), just show the first 4 lines
code = code.replace(
  "const activeLyricIndex = lyricsData?.lines",
  "const isUnsynced = lyricsData?.lines?.length && lyricsData.lines[0].time === -1;\n  const activeLyricIndex = (lyricsData?.lines && !isUnsynced)"
);

code = code.replace(
  "const isActive = i === 0 && activeLyricIndex >= 0;",
  "const isActive = i === 0 && activeLyricIndex >= 0 && !isUnsynced;"
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
