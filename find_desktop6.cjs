const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');
const idx = bundle.indexOf('Ar=gt=>{const qe=parseFloat(gt.target.value);he(qe)}');
if (idx > -1) {
  console.log(bundle.substring(idx - 400, idx + 400));
}
