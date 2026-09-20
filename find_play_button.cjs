const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf-8');
// Find usages of togglePlay
let idx = 0;
while ((idx = bundle.indexOf('togglePlay', idx + 1)) !== -1) {
  console.log('---');
  console.log(bundle.substring(idx - 150, idx + 150));
}
