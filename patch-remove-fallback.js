import fs from 'fs';
let code = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

code = code.replace(/if \(!playableUrl && newTrack\.streamUrl\) \{[\s\S]*?playableUrl = newTrack\.streamUrl;\n\s*\}/, '');

code = code.replace(/if \(newTrack\.streamUrl && newTrack\.streamUrl\.trim\(\) !== ''\) \{[\s\S]*?\} else \{[\s\S]*?setError\('Playback unavailable for this track\.'\);\n\s*\}/, `setError('Playback unavailable for this track.');`);

fs.writeFileSync('src/context/PlayerContext.tsx', code);
console.log("Removed fallback to 30s preview");
