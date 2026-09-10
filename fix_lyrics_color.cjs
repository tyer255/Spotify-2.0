const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

code = code.replace(/<div className="mt-4 flex-1">/, '<div className="flex flex-col gap-4 mt-2 w-full">');

// Update lyrics box color
code = code.replace(/bg-\[#5a1c3e\]/g, 'bg-[#7e123c]');
code = code.replace(/hover:bg-\[#6c224a\]/g, 'hover:bg-[#8b1442]');

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
