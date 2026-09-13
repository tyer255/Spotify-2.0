const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');
const snippet = `e:{left:\`\${Math.min(100,Math.max(0,M))}%\`}}),a.jsx("input",{type:"range",min:0,max:X,step:.1,value:Math.min(X,Math.max(0,typeof G=="number"&&!Number.isNaN(G)?G:0)),onPointerDown:ne,onTouchStart:ne,onMouseDown:ne,onChange:Q,onInput:Q,onPointerUp:D,onMouseUp:D,onTouchEnd:D,className:"w-full relative z-20 cursor-pointer opacity-0"})`;
const idx2 = bundle.indexOf('onMouseUp:D,onTouchEnd:D,className:"w-full relative z-20 cursor-pointer opacity-0"');
if (idx2 > -1) {
  console.log(bundle.substring(idx2 - 1000, idx2 + 100));
}
