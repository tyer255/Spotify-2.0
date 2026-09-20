const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf-8');
let idx = 0;
while (idx !== -1) {
  idx = bundle.indexOf('drag:"y"', idx + 1);
  if (idx !== -1) {
    console.log(`\n\n--- MATCH ---`);
    console.log(bundle.substring(idx - 200, idx + 200));
  }
}
