const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

const activeLyricLogic = `
  const activeLyricIndex = lyricsData?.lines 
    ? lyricsData.lines.findIndex((line, idx, arr) => {
        const nextLine = arr[idx + 1];
        return position >= line.time && (!nextLine || position < nextLine.time);
      })
    : -1;
  const displayIndex = activeLyricIndex >= 0 ? activeLyricIndex : 0;
`;

code = code.replace(
  activeLyricLogic + "\n  if (!track) return null;",
  "  if (!track) return null;\n\n" + activeLyricLogic
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
