const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /const data = await spotify\.getData\(url\);\s*if \(\!data \|\| \!data\.trackList\) \{\s*return res\.status\(404\)\.json\(\{ success: false, error: 'Playlist not found or is private' \}\);\s*\}/;

const newLogic = `const data = await spotify.getData(url);

    if (!data) {
      return res.status(404).json({ success: false, error: 'Link not found or is private' });
    }
    
    // Support Albums, Playlists, and single Tracks
    if (!data.trackList && data.type === 'track') {
      data.trackList = [data];
      data.name = data.title || data.name || 'Single Track';
    }

    if (!data.trackList || data.trackList.length === 0) {
      return res.status(404).json({ success: false, error: 'No tracks found for this link' });
    }`;

if (regex.test(content)) {
  content = content.replace(regex, newLogic);
  fs.writeFileSync('server.ts', content);
  console.log("Replaced successfully!");
} else {
  console.log("Regex did not match. Current block:");
  const match = content.match(/const data = await spotify\.getData\(url\);[\s\S]{1,200}/);
  console.log(match ? match[0] : "Not found at all");
}
