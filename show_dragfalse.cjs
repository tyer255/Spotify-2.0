const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf-8');
const idx = bundle.indexOf('drag:false');
if (idx !== -1) {
  console.log(bundle.substring(idx - 100, idx + 100));
} else {
  console.log('NOT FOUND');
}
