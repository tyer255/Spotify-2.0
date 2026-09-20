import fs from 'fs';
console.log(fs.readFileSync('server.ts', 'utf8').substring(0, 50));
