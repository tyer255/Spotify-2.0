const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// I am ensuring the lyrics preview card expands completely when lyrics load to show them all.
code = code.replace(
  /<div className="space-y-4 flex-1 relative min-h-\[120px\]">/,
  `<div className="space-y-4 flex-1 min-h-[140px] flex flex-col justify-center">`
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
