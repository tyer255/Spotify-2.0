const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');

const matches = bundle.match(/[a-zA-Z0-9_$]+=[^,]*\bparseFloat\([^)]*\)[^}]*\}/g);
if (matches) {
  matches.forEach(m => console.log(m.substring(0, 100)));
}
