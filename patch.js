const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf-8');
code = code.replace('// 1. iTunes (Direct MP4, very fast)', 'return null; // 1. iTunes (Direct MP4, very fast)');
fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
