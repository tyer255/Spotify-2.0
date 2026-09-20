const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf-8');
const lines = bundle.split('\n');
console.log(lines[4659].substring(24500, 25500));
