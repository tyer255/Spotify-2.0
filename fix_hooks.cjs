const fs = require('fs');
let content = fs.readFileSync('src/views/ArtistView.tsx', 'utf8');

// The issue is early returns before useMemo is called. 
// We need to move useMemo up before the early returns.

// Find useMemo
const useMemoRegex = /const visibleTopTracks = React\.useMemo\(\(\) => \{\n\s*return artist\?\.topTracks \? artist\.topTracks\.filter\(t => !isTrackHidden\(t\.id\)\) : \[\];\n\s*\}, \[artist, isTrackHidden\]\);/g;

// Remove it from current position
content = content.replace(useMemoRegex, '');

// Insert it right after the other hooks, before the first early return (loading check)
// Let's insert it around line 133
const insertPos = content.indexOf('if (loading) {');
if (insertPos !== -1) {
  content = content.slice(0, insertPos) + 
`const visibleTopTracks = React.useMemo(() => {
    return artist?.topTracks ? artist.topTracks.filter(t => !isTrackHidden(t.id)) : [];
  }, [artist, isTrackHidden]);\n\n  ` + 
  content.slice(insertPos);
}

fs.writeFileSync('src/views/ArtistView.tsx', content);
