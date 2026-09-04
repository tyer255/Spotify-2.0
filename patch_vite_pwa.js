const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');
if (!code.includes('skipWaiting')) {
  code = code.replace(/workbox:\s*\{/, "workbox: {\n          clientsClaim: true,\n          skipWaiting: true,\n          cleanupOutdatedCaches: true,");
  fs.writeFileSync('vite.config.ts', code);
}
