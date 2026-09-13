const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');
const idx = bundle.indexOf('id:"miniplayer-seek-slider"');
if (idx > -1) {
  console.log(bundle.substring(idx - 100, idx + 200));
}
