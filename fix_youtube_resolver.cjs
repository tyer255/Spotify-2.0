const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf-8');

const searchRegex = /const originalTitleLower = \(trackName \|\| ''\)\.toLowerCase\(\);/;

const replacement = `const originalTitleLower = (title || '').toLowerCase();`;

code = code.replace(searchRegex, replacement);
fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
