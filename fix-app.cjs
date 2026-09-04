const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/searchQuery=\{searchQuery \|\| currentView\.initialQuery\}/g, "searchQuery={searchQuery || currentView.initialQuery || ''}");
fs.writeFileSync('src/App.tsx', code);
