const fs = require('fs');
let code = fs.readFileSync('src/components/Common/PWAInstallButton.tsx', 'utf8');

code = code.replace(/  \} \$\{className\}`\}\n      >\n        \{justInstalled \? \([\s\S]*?  \}/, '');
fs.writeFileSync('src/components/Common/PWAInstallButton.tsx', code);
