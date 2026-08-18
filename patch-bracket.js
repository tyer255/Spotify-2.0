import fs from 'fs';
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

code = code.replace(/return null;\n\n\s*async getHomeFeed\(\)/, 'return null;\n  }\n\n  async getHomeFeed()');

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
console.log("Fixed bracket");
