const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');
console.log(code.includes('Tainu Khabar Nahi'));
