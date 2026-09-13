const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');
const idx = bundle.indexOf('Ar=gt=>{const qe=parseFloat(gt.target.value);he(qe);E(qe)}');
if (idx > -1) {
  console.log("Desktop handlers OK");
}
