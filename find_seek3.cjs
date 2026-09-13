const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');
const idx = bundle.indexOf('Zte=');
if (idx > -1) {
  console.log(bundle.substring(idx, idx + 1500));
}
