const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// Destructure fetchLyrics
code = code.replace(
  "lyricsData,",
  "lyricsData,\n    fetchLyrics,"
);

// Add useEffect to fetch lyrics on mount/track change if not present
const useE = `  useEffect(() => {
    if (track?.id && (!lyricsData || lyricsData.trackId !== track.id)) {
      fetchLyrics(track.id, track.title, track.artist, track.duration);
    }
  }, [track?.id, lyricsData?.trackId, fetchLyrics]);
`;

code = code.replace(
  "const { position, duration, activeLyricIndex } = usePlayerProgressStore();",
  "const { position, duration, activeLyricIndex } = usePlayerProgressStore();\n" + useE
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
