import fs from 'fs';
let code = fs.readFileSync('index.html', 'utf8');
code = code.replace(/Spotify/g, "Music Player");
fs.writeFileSync('index.html', code);
