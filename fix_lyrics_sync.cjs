const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// I am modifying the isActive flag to just match i === 0 so the first line is always highlighted even if we aren't synced. Also making sure displayIndex is safe.
code = code.replace(
  "const isActive = i === 0 && activeLyricIndex >= 0 && !isUnsynced;",
  "const isActive = i === 0;"
);

// We need to handle the fact that if a track's audio is currently loaded, the `usePlayer()` context might provide old lyrics or no lyrics due to race conditions.
code = code.replace(
  "const activeLyricIndex = (lyricsData?.lines && !isUnsynced) \n    ? lyricsData.lines.findIndex((line, idx, arr) => {\n        const nextLine = arr[idx + 1];\n        return position >= line.time && (!nextLine || position < nextLine.time);\n      })\n    : -1;",
  `const activeLyricIndex = (lyricsData?.lines && !isUnsynced) 
    ? lyricsData.lines.findIndex((line, idx, arr) => {
        const nextLine = arr[idx + 1];
        // Ensure that position allows us to reach line 0 even before its formal start time if we are close to it
        if (idx === 0 && position < line.time) return true;
        return position >= line.time && (!nextLine || position < nextLine.time);
      })
    : -1;`
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
