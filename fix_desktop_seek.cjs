const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');

const oldCode = `es=()=>{Z.current=!0,J(!0)},Ar=gt=>{const qe=parseFloat(gt.target.value);he(qe)},Tt=()=>{Z.current&&(E(de),Z.current=!1,setTimeout(()=>{J(!1)},100))}`;
const newCode = `es=()=>{Z.current=!0,J(!0)},Ar=gt=>{const qe=parseFloat(gt.target.value);he(qe);E(qe)},Tt=()=>{Z.current&&(E(de),Z.current=!1,setTimeout(()=>{J(!1)},100))}`;

if (bundle.includes(oldCode)) {
  fs.writeFileSync('src/bundle/index-Bfvfzxe5.js', bundle.replace(oldCode, newCode));
  console.log("Patched desktop player!");
} else {
  console.log("Not found!");
}
