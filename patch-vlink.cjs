const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

// Replace all instances of `const stream = enc ? decryptSaavnMediaUrl(enc) : null;`
// with `const stream = item.vlink || (enc ? decryptSaavnMediaUrl(enc) : null);`

code = code.replace(/const stream = enc \? decryptSaavnMediaUrl\(enc\) : null;/g, "const stream = item.vlink || (enc ? decryptSaavnMediaUrl(enc) : null);");

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
console.log('Patched vlink');
