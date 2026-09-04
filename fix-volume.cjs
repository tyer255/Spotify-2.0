const fs = require('fs');
let code = fs.readFileSync('src/components/Player/MiniPlayer.tsx', 'utf8');
code = code.replace(/value=\{isMuted \? 0 : volume\}/g, "value={isMuted ? 0 : (Number.isNaN(volume) ? 1 : volume)}");
fs.writeFileSync('src/components/Player/MiniPlayer.tsx', code);
