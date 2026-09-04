import fs from 'fs';
import path from 'path';

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      if (content.includes('Music PlayerThumbnail')) {
        content = content.replace(/Music PlayerThumbnail/g, "SpotifyThumbnail");
        changed = true;
      }
      if (content.includes('Music PlayerMusicProvider')) {
        content = content.replace(/Music PlayerMusicProvider/g, "SpotifyMusicProvider");
        changed = true;
      }
      if (content.includes('Music PlayerScraper')) {
        content = content.replace(/Music PlayerScraper/g, "SpotifyScraper");
        changed = true;
      }
      if (content.includes('Music Player2-Music')) {
        content = content.replace(/Music Player2-Music/g, "Spotify2-Music");
        changed = true;
      }
      if (content.includes('Music Player-style')) {
        content = content.replace(/Music Player-style/g, "Spotify-style");
        changed = true;
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

walk('server');
walk('src');
