const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');
const snippet = `onPointerUp:D,onMouseUp:D,onTouchEnd:D,className:"w-full relative z-20 cursor-pointer opacity-0"`;
const match = bundle.match(/[a-zA-Z_$]+=\{[a-zA-Z_$]+\}/g);
const idx = bundle.indexOf(snippet);
if (idx > -1) {
  console.log(bundle.substring(idx - 6000, idx - 4500));
}
