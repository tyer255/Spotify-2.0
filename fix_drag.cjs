const fs = require('fs');
let bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf-8');
bundle = bundle.replace(
  /drag:"y",dragConstraints:\{top:0\},dragElastic:\.15,onDragEnd:\([^)]+\)=>\{[^}]+\},className:"fixed inset-0 z-50 flex flex-col text-white select-none overflow-hidden/g,
  'drag:false,className:"fixed inset-0 z-50 flex flex-col text-white select-none overflow-hidden'
);
fs.writeFileSync('src/bundle/index-Bfvfzxe5.js', bundle);
console.log('Fixed drag');
