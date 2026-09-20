const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf-8');
const idx = bundle.indexOf('PLAYING FROM ALBUM');
console.log(bundle.substring(idx - 1500, idx + 2500));
