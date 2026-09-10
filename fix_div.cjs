const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

code = code.replace(/<div className="flex flex-col gap-4 mt-2 w-full">\s*<div className="flex flex-col gap-4 mt-2 w-full">/, '<div className="flex flex-col gap-4 mt-2 w-full">');

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
