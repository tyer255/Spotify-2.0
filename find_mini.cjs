const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');

const parts = bundle.split('type:"range"');
for (let i=0; i<parts.length-1; i++) {
  const context = parts[i].slice(-300) + 'type:"range"' + parts[i+1].slice(0, 300);
  console.log(`--- RANGE ${i+1} ---`);
  console.log(context);
}
