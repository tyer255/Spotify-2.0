const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');
code = code.replace(/registerType:\s*'autoUpdate'/, "registerType: 'prompt'");
code = code.replace(/clientsClaim:\s*true,\s*skipWaiting:\s*true,/, "");
fs.writeFileSync('vite.config.ts', code);
