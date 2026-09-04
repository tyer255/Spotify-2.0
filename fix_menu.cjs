const fs = require('fs');
let code = fs.readFileSync('src/components/Navigation/CreateActionMenu.tsx', 'utf8');

code = code.replace(/\(props as any\)\.onSelectClonePlaylist\?\.\(\)/g, "onSelectClonePlaylist && onSelectClonePlaylist()");

fs.writeFileSync('src/components/Navigation/CreateActionMenu.tsx', code);
