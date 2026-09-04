import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'node_modules', 'react-player', 'dist', 'Player.js');
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/playerRef\.current\.play\(\);/g, 'playerRef.current.play().catch(e => {});');
  fs.writeFileSync(file, code);
}

// Patch youtube-video-element and vimeo-video-element setVolume bugs
const webComponentPaths = [
  path.join(process.cwd(), 'node_modules', 'youtube-video-element', 'dist', 'youtube-video-element.js'),
  path.join(process.cwd(), 'node_modules', 'youtube-video-element', 'dist', 'cjs', 'youtube-video-element.js'),
  path.join(process.cwd(), 'node_modules', 'vimeo-video-element', 'dist', 'vimeo-video-element.js'),
  path.join(process.cwd(), 'node_modules', 'vimeo-video-element', 'dist', 'cjs', 'vimeo-video-element.js')
];

webComponentPaths.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Replace: (_a = this.api) == null ? void 0 : _a.setVolume(val)
    // with: if (this.api && typeof this.api.setVolume === "function") this.api.setVolume(val)
    code = code.replace(/\(_a = this\.api\) == null \? void 0 : _a\.setVolume\(([^)]+)\)/g, 
      'if (this.api && typeof this.api.setVolume === "function") this.api.setVolume($1)');

      
    fs.writeFileSync(file, code);
  }
});
