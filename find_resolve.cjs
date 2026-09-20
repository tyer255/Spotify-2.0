const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf-8');
const idx = bundle.indexOf('/api/playback/resolve');
if (idx !== -1) {
  console.log(bundle.substring(idx - 1000, idx + 1000));
}
