import fs from 'fs';
let code = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

code = code.replace(/if \(playableUrl\.startsWith\('youtube:'\)\) \{[\s\S]*?\} else \{/g, '{');

fs.writeFileSync('src/context/PlayerContext.tsx', code);
console.log("Patched interception successfully");
