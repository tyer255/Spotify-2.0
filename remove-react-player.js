import fs from 'fs';
let code = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

code = code.replace(/import ReactPlayer from 'react-player';/g, '');
code = code.replace(/<ReactPlayer[\s\S]*?\/>/g, '');

fs.writeFileSync('src/context/PlayerContext.tsx', code);
console.log("Removed ReactPlayer successfully");
