import fs from 'fs';
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf8');

code = code.replace(".replace(/[^a-z0-9\\s]/g, ' ')", ".replace(/[^\\p{L}\\p{N}\\s]/gu, ' ')");

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
console.log("Patched normalizeText regex successfully");
