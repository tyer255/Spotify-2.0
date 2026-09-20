const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf-8');
let idx = 0;
while (idx !== -1) {
  idx = bundle.indexOf('toggleDownloadTrack', idx + 1);
  if (idx !== -1) {
    console.log(bundle.substring(idx - 60, idx + 150));
  }
}
