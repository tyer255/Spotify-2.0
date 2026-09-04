import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/const \[isClonePlaylistOpen, setIsClonePlaylistOpen\] = useState\(false\);\n?\s*/g, '');

fs.writeFileSync('src/App.tsx', content);
console.log('Removed state hook from App.tsx');
