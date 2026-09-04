const fs = require('fs');
let code = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');
code = code.replace(/setPosition\(playedSeconds\);/g, "setPosition(typeof playedSeconds === 'number' && !Number.isNaN(playedSeconds) ? playedSeconds : 0);");
fs.writeFileSync('src/context/PlayerContext.tsx', code);
