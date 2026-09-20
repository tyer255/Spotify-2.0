const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf-8');
const idx = bundle.lastIndexOf('drag:"y"');
console.log(bundle.substring(idx + 1000, idx + 4000));
