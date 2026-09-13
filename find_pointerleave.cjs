const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');

let idx = bundle.indexOf('onPointerLeave');
while (idx !== -1) {
  console.log(bundle.substring(idx - 50, idx + 100));
  idx = bundle.indexOf('onPointerLeave', idx + 1);
}
