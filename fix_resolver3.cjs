const fs = require('fs');
const path = 'server/services/AudioStreamResolver.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  "const query = \`\${cleanT} \${cleanA}\`;",
  "const query = \`\${cleanT} \${cleanA} song\`;"
);

code = code.replace(
  "const scored = videos.map(vid => {",
  "const scored = videos.map((vid, index) => {"
);

code = code.replace(
  "let score = 0;",
  "let score = Math.max(0, (10 - index) * 10); // Trust YouTube ranking"
);

// We should also allow substring match if length > 4 for title, because chehra vs chehre
code = code.replace(
  "if (cleanT.split(' ').every(w => hasWord(vidTitle, w))) score += 100;",
  "if (cleanT.split(' ').every(w => hasWord(vidTitle, w) || (w.length > 4 && vidTitle.includes(w.substring(0, w.length - 1))))) score += 100;"
);

fs.writeFileSync(path, code);
console.log('Fixed yt-search query and scoring');
