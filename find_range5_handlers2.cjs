const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');

const idx = bundle.indexOf('onMouseUp:D,onTouchEnd:D,className:"w-full relative z-20 cursor-pointer opacity-0"');
if (idx > -1) {
  console.log(bundle.substring(idx - 4500, idx - 2500));
}
