import fs from 'fs';
let code = fs.readFileSync('src/views/PremiumView.tsx', 'utf8');

code = code.replace(/\\n/g, '\n');

fs.writeFileSync('src/views/PremiumView.tsx', code);
console.log("Patched start tag");
