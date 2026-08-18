import fs from 'fs';
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

code = code.replace(/return \{\n\s*success: false,\n\s*error: "Extraction failed: Full length audio could not be resolved\."\n\s*\};/, 'return null;');

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
console.log("Patched Provider");
