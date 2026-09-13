const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf-8');
code = code.replace("const cleanT = cleanBaseTitle(title);", "const cleanT = cleanBaseTitle(title);\n    console.log('[AudioStreamResolver] resolveFullTrack called for:', title, artist);");
fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
