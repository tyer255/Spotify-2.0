const fs = require('fs');
let code = fs.readFileSync('src/views/PremiumView.tsx', 'utf8');
code = code.replace(/⚡ BASS BOOSTED/g, 'BASS BOOSTED');
fs.writeFileSync('src/views/PremiumView.tsx', code);
