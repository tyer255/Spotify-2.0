import fs from 'fs';
let code1 = fs.readFileSync('public/manifest.json', 'utf8');
code1 = code1.replace(/Spotify/g, "Music Player");
fs.writeFileSync('public/manifest.json', code1);

let code2 = fs.readFileSync('public/sw.js', 'utf8');
code2 = code2.replace(/Spotify/g, "Music Player");
fs.writeFileSync('public/sw.js', code2);
