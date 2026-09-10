const fs = require('fs');
let content = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

// There is one with a setTimeout that we added
content = content.replace(
/setError\('Playback unavailable for this track\.'\);\s*setIsLoading\(false\);\s*setIsPlaying\(false\);\s*setTimeout\(\(\) => nextTrack\(\), 2000\);/g,
`console.warn('Playback unavailable, silently skipping to next track...');
setIsLoading(true);
nextTrack();`
);

content = content.replace(
/setError\('Playback unavailable for this track\.'\);\s*setIsLoading\(false\);\s*setIsPlaying\(false\);/g,
`console.warn('Playback unavailable, silently skipping to next track...');
setIsLoading(true);
nextTrack();`
);

content = content.replace(
/setError\('Playback unavailable for this track\.'\);\s*setIsLoading\(false\);/g,
`console.warn('Playback unavailable, silently skipping to next track...');
setIsLoading(true);
nextTrack();`
);

fs.writeFileSync('src/context/PlayerContext.tsx', content);
