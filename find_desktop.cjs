const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');
const idx = bundle.indexOf('id:"desktop-player-seek-slider"'); // maybe it has an id?
if (idx > -1) {
  console.log(bundle.substring(idx - 600, idx + 200));
} else {
  // Try to find it using the variable names
  const snippet = `e:{left:\`\${Math.min(100,Math.max(0,rn))}%\`}}),a.jsx("input",{type:"range",min:0,max:nr,step:.1,value:Math.min(nr,Math.max(0,typeof Dt=="number"&&!isNaN(Dt)?Dt:0)),onPointerDown:es,onChange:Ar,onPointerUp:Tt,onPointerCancel:Tt,className:"absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10","aria-label":"Track progress"})]}),a.jsxs("div",{className:"flex items-cen`;
  const idx2 = bundle.indexOf(snippet);
  if (idx2 > -1) {
    console.log(bundle.substring(idx2 - 1000, idx2 + 100));
  } else {
    console.log("not found");
  }
}
