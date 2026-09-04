const fs = require('fs');
const file = 'src/context/PlayerContext.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /bottom: '-500px',\s*right: '-500px',/;
const replacement = `bottom: '0px',\n            right: '0px',`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
