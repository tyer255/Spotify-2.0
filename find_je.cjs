const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');

const matches = bundle.match(/Je=\([^)]*\)=>[^{]*{[^}]+currentTime=[^}]+}/g);
if (matches) {
  console.log(matches[0]);
} else {
  // alternative pattern
  const snippet = `seek:Je`;
  const idx = bundle.indexOf(snippet);
  if (idx > -1) {
    console.log(bundle.substring(idx - 1000, idx + 100));
  }
}
