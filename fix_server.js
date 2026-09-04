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
      if (content.includes('Spotify')) {
        content = content.replace(/Spotify 2\.0/g, "Music Player 2.0");
        content = content.replace(/Spotify/g, "Music Player");
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

walk('server');
