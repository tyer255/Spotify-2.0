const fs = require('fs');
const acorn = require('acorn');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf-8');
try {
  acorn.parse(bundle, { ecmaVersion: 2022, sourceType: 'module' });
  console.log('No syntax error found by acorn');
} catch(e) {
  console.log('Syntax error at pos', e.pos, e.message);
  console.log('Context:', bundle.substring(e.pos - 50, e.pos + 50));
}
