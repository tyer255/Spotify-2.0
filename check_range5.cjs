const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');
const idx = bundle.indexOf('N.current=ee,L(ee),g(ee)');
if (idx > -1) {
  console.log("Lyrics modal handlers OK");
}
