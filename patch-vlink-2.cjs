const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

code = code.replace(/item\.vlink/g, "item.more_info?.vlink");

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
console.log('Patched item.vlink to item.more_info?.vlink');
