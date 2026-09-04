import fs from 'fs';
let code = fs.readFileSync('vite.config.ts', 'utf8');
code = code.replace(/name: 'Spotify 2\.0'/g, "name: 'Music Player 2.0'");
code = code.replace(/short_name: 'Spotify'/g, "short_name: 'Music'");
fs.writeFileSync('vite.config.ts', code);
