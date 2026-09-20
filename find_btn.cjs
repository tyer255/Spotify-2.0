const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf-8');
const searchFor = ['onClick:Ae', 'onClick:b', 'onClick:D', 'onClick:z', 'onClick:Nt'];
for (const term of searchFor) {
  let idx = 0;
  while (idx !== -1) {
    idx = bundle.indexOf(term, idx + 1);
    if (idx !== -1) {
      console.log(`\n\n--- MATCH ${term} ---`);
      console.log(bundle.substring(idx - 250, idx + 350));
    }
  }
}
