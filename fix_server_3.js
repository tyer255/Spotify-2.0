import fs from 'fs';
import path from 'path';

let content = fs.readFileSync('server/providers/ProviderManager.ts', 'utf8');
content = content.replace(/Music Player Web API Provider/g, "Spotify Web API Provider");
fs.writeFileSync('server/providers/ProviderManager.ts', content);

let content2 = fs.readFileSync('server/providers/SpotifyMusicProvider.ts', 'utf8');
content2 = content2.replace(/normalizeMusic PlayerTrack/g, "normalizeSpotifyTrack");
fs.writeFileSync('server/providers/SpotifyMusicProvider.ts', content2);

