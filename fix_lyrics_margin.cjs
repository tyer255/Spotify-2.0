const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// Also remove absolute inset-0 from lyrics list so it doesn't collapse incorrectly
code = code.replace(
  /<div className="absolute inset-0">([\s\S]*?)<\/div>/,
  `<div className="flex flex-col h-full space-y-4">$1</div>`
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
