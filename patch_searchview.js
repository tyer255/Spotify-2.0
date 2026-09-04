import fs from 'fs';

let code = fs.readFileSync('src/views/SearchView.tsx', 'utf8');

const regex = /\{results\.songs\.map\(\(track, idx\) => \{/g;
const replacement = `{results.songs.filter((track, index, self) => index === self.findIndex((t) => t.title.toLowerCase() === track.title.toLowerCase() && (t.artist.toLowerCase().includes(track.artist.toLowerCase()) || track.artist.toLowerCase().includes(t.artist.toLowerCase())))).map((track, idx) => {`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/views/SearchView.tsx', code);
