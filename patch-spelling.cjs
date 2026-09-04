const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');
code = code.replace(/'Ve Haamya'/g, "'Ve Haniya Danny'");
code = code.replace(/'Kalki Theme'/g, "'Bhairava Anthem Kalki'");
fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
