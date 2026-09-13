const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');

const matches = bundle.match(/[^;]+currentTime\s*=[^;]+/g);
if (matches) {
  matches.forEach(m => console.log(m.trim()));
}
