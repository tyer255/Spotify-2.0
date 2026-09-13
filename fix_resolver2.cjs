const fs = require('fs');
const path = 'server/services/AudioStreamResolver.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const query = \`\${cleanT} \${cleanA} audio\`;",
  "const query = \`\${cleanT} \${cleanA}\`;"
);

fs.writeFileSync(path, code);
console.log('Fixed yt-search query');
