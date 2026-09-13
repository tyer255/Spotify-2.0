const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');

const matches = bundle.match(/onChange:[a-zA-Z_$]+,[a-zA-Z_$]+:[a-zA-Z_$]+,onPointerUp:[a-zA-Z_$]+,onPointerCancel:[a-zA-Z_$]+/g);
console.log(matches);
