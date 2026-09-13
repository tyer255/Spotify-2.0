const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf8');

code = code.replace(/  \}\n\nexport async function validateAudioStream/g, '  }\n}\n\nexport async function validateAudioStream');

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
