const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

// replace occurrences of `return trackObj;` inside getTrack and getPlaylist
// Let's just find where they return tracks and apply it.
code = code.replace(/return (trackObj|track|trackRes);/g, (match, p1) => {
    return `return applyMetadataOverrides(${p1});`;
});

// also for getHomeFeed tracks
code = code.replace(/const qp: Track = \{/g, 'const qp: Track = applyMetadataOverrides({');
code = code.replace(/const t: Track = \{/g, 'const t: Track = applyMetadataOverrides({');

// Add cast back to any for applyMetadataOverrides
code = code.replace(/function applyMetadataOverrides\(track\)/g, "function applyMetadataOverrides(track: any)");

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
console.log('Fixed applyMetadataOverrides globally');
