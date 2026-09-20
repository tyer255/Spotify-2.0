const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf-8');
const match = bundle.match(/ch\s*=\s*rt\(['"]([^'"]+)['"]/);
if (match) console.log('ch is:', match[1]);
else console.log('Not found via match. Let me check comma separated var decls.');
