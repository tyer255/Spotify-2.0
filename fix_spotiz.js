import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    if (content.includes('Music Player 2.0')) {
      content = content.replace(/Music Player 2\.0/g, 'Spotiz');
      changed = true;
    }
    if (content.includes('Music Player')) {
      content = content.replace(/Music Player/g, 'Spotiz');
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(filePath, content);
    }
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css') || fullPath.endsWith('.json') || fullPath.endsWith('.html')) {
      replaceInFile(fullPath);
    }
  }
}

replaceInFile('metadata.json');
replaceInFile('vite.config.ts');
replaceInFile('index.html');
replaceInFile('public/manifest.json');
replaceInFile('public/sw.js');
walk('src');
walk('server');
