const fs = require('fs');
let bundle = fs.readFileSync('src/bundle/index-Bfvfzxe5.js', 'utf-8');
bundle = bundle.replace(/a\.jsx\(ch,\{className:"w-7 h-7 text-black fill-emerald-500"\}\)\)/g, 'a.jsx(ch,{className:"w-7 h-7 text-black fill-emerald-500"})');
bundle = bundle.replace(/a\.jsx\(ch,\{className:"w-6 h-6 text-black fill-emerald-500"\}\)\)/g, 'a.jsx(ch,{className:"w-6 h-6 text-black fill-emerald-500"})');
fs.writeFileSync('src/bundle/index-Bfvfzxe5.js', bundle);
console.log('Fixed extra parentheses');
