const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');

const oldCode = `Q=z=>{k.current=!0,R(!0);const ee=parseFloat(z.target.value);!isNaN(ee)&&ee>=0&&(N.current=ee,L(ee))},`;
const newCode = `Q=z=>{k.current=!0,R(!0);const ee=parseFloat(z.target.value);!isNaN(ee)&&ee>=0&&(N.current=ee,L(ee),g(ee))},`;

if (bundle.includes(oldCode)) {
  fs.writeFileSync('src/bundle/index-Bfvfzxe5.js', bundle.replace(oldCode, newCode));
  console.log("Patched range 5 (lyrics player)!");
} else {
  console.log("Not found!");
}
