const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf-8');
code = code.replace(/\/\/ 3\. iTunes \(30s preview fallback\)[\s\S]*?\} catch \(e\) \{\s*console\.warn\('iTunes error', e\);\s*\}/, '');
fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
