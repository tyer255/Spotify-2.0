const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');

const matches = bundle.match(/<input[^>]*type="range"[^>]*>/g) || bundle.match(/type:"range"/g);
console.log(matches);
