import fs from 'fs';
const map = JSON.parse(fs.readFileSync('dist/server.cjs.map', 'utf8'));
console.log(map.sources.filter(s => s.includes('server.ts')));
