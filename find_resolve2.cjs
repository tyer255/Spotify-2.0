const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf-8');
const searchWords = ['resolve', '/playback/resolve'];
for (const term of searchWords) {
  let idx = 0;
  while (idx !== -1) {
    idx = bundle.indexOf(term, idx + 1);
    if (idx !== -1) {
      // just a small chunk to see if it's the one
      const chunk = bundle.substring(idx - 60, idx + 60);
      if (chunk.includes('fetch')) {
         console.log(bundle.substring(idx - 300, idx + 300));
      }
    }
  }
}
