const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf-8');
const searchWords = ['resolvePlayback('];
for (const term of searchWords) {
  let idx = 0;
  while (idx !== -1) {
    idx = bundle.indexOf(term, idx + 1);
    if (idx !== -1) {
      console.log(bundle.substring(idx - 600, idx + 600));
    }
  }
}
