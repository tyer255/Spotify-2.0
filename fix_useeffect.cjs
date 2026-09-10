const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

const useE = `  useEffect(() => {
    if (track?.id && (!lyricsData || lyricsData.trackId !== track.id)) {
      fetchLyrics(track.id, track.title, track.artist, track.duration);
    }
  }, [track?.id, lyricsData?.trackId, fetchLyrics]);
`;

code = code.replace(
  "const { position, duration } = usePlayerProgressStore();",
  "const { position, duration } = usePlayerProgressStore();\n" + useE
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
