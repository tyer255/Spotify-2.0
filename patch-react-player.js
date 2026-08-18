import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'node_modules', 'react-player', 'dist', 'Player.js');
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/playerRef\.current\.play\(\);/g, 'playerRef.current.play().catch(e => {});');
  fs.writeFileSync(file, code);
}
