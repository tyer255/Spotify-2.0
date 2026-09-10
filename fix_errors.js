const fs = require('fs');
let content = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

content = content.replace(
/setError\('Playback unavailable for this track\.'\);\s*setIsLoading\(false\);\s*setIsPlaying\(false\);/g,
`console.warn('Playback unavailable, silently skipping to next track...');
nextTrack();`
);

content = content.replace(
/setError\('Playback unavailable for this track\.'\);\s*setIsLoading\(false\);(\s*setIsPlaying\(false\);)?/g,
`console.warn('Playback unavailable, silently skipping to next track...');
nextTrack();`
);

// specifically fix the one with setTimeout
content = content.replace(
/setError\('Playback unavailable for this track\.'\);\s*setIsLoading\(false\);\s*setIsPlaying\(false\);\s*setTimeout\(\(\) => nextTrack\(\), 2000\);/g,
`console.warn('Playback unavailable, silently skipping to next track...');
nextTrack();`
);

fs.writeFileSync('src/context/PlayerContext.tsx', content);
