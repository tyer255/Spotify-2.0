const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');
const match = bundle.match(/[a-zA-Z_$]+=\(?[a-zA-Z_$]*\)?=>{[^}]*currentTime[^}]*}/);
if (match) {
  console.log(match[0]);
}

const idx = bundle.indexOf('Je=');
if (idx > -1) {
  let sub = bundle.substring(idx - 10, idx + 200);
  console.log("----");
  console.log(sub);
}
