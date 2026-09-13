const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');
const match = bundle.match(/seek:[^,}]+,/);
if (match) {
  console.log(bundle.substring(bundle.indexOf(match[0]) - 200, bundle.indexOf(match[0]) + 300));
}
