const fs = require('fs');
const bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf8');

const oldCode = `v=E=>{const C=parseFloat(E.target.value);!isNaN(C)&&C>=0&&(h.current=C,u(C))},b=E=>{const C=parseFloat(E.currentTarget.value),T=!isNaN(C)&&C>=0?C:h.current;t(T),o(!1)};return a.jsxs("div",{className:"space-y-1.5 mb-4",children:[a.jsxs("div",{className:"relative w-full flex items-center h-4 group cursor-pointer select-none",children:[a.jsx("div",{className:"absolute inset-x-0 h-1 bg-white/30 rounded-full group-hover:h-1.5 transition-all overflow-hidden",children:a.jsx("div",{className:"h-full bg-white rounded-full transition-[transform] duration-75 ease-out",style:{transform:\`scaleX(\${Math.min(100,Math.max(0,g))/100})\`,transformOrigin:"left"}})}),a.jsx("div",{className:"absolute w-3 h-3 bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.5)] -translate-x-1/2 pointer-events-none transition-transform group-hover:scale-125",style:{left:\`\${Math.min(100,Math.max(0,g))}%\`}}),a.jsx("input",{id:"fullscreen-player-seek-slider",type:"range",min:0,max:m,step:.1,value:Math.min(m,Math.max(0,typeof p=="number"&&!Number.isNaN(p)?p:0)),onPointerDown:x,onChange:v,onPointerUp:b,onPointerCancel:b,onPointerLeave:E=>{s&&b(E)},`;

const newCode = `v=E=>{const C=parseFloat(E.target.value);!isNaN(C)&&C>=0&&(h.current=C,u(C),t(C))},b=E=>{const C=parseFloat(E.currentTarget.value),T=!isNaN(C)&&C>=0?C:h.current;t(T),o(!1)};return a.jsxs("div",{className:"space-y-1.5 mb-4",children:[a.jsxs("div",{className:"relative w-full flex items-center h-4 group cursor-pointer select-none",children:[a.jsx("div",{className:"absolute inset-x-0 h-1 bg-white/30 rounded-full group-hover:h-1.5 transition-all overflow-hidden",children:a.jsx("div",{className:"h-full bg-white rounded-full transition-[transform] duration-75 ease-out",style:{transform:\`scaleX(\${Math.min(100,Math.max(0,g))/100})\`,transformOrigin:"left"}})}),a.jsx("div",{className:"absolute w-3 h-3 bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.5)] -translate-x-1/2 pointer-events-none transition-transform group-hover:scale-125",style:{left:\`\${Math.min(100,Math.max(0,g))}%\`}}),a.jsx("input",{id:"fullscreen-player-seek-slider",type:"range",min:0,max:m,step:.1,value:Math.min(m,Math.max(0,typeof p=="number"&&!Number.isNaN(p)?p:0)),onPointerDown:x,onChange:v,onPointerUp:b,onPointerCancel:b,`;

if (bundle.includes(oldCode)) {
  fs.writeFileSync('src/bundle/index-Bfvfzxe5.js', bundle.replace(oldCode, newCode));
  console.log("Patched!");
} else {
  console.log("Not found! Let's check differences.");
}
