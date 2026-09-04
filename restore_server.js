import fs from 'fs';
const map = JSON.parse(fs.readFileSync('dist/server.cjs.map', 'utf8'));
const index = map.sources.indexOf('../server.ts');
if (index !== -1) {
    const source = map.sourcesContent[index];
    fs.writeFileSync('server.ts', source);
    console.log("Restored server.ts from sourcemap!");
} else {
    console.log("Could not find server.ts in sourcemap");
}
