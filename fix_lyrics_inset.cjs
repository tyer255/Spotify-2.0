const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// The issue might still be absolute inset-0 colliding with min-height. I'm taking off absolute inset-0 from the lyrics container and making it just normal document flow since the container has flex-1 anyway.
code = code.replace(
  /<div className="absolute inset-0 flex flex-col space-y-4">/g,
  `<div className="flex flex-col flex-1 space-y-4">`
);

code = code.replace(
  /<div className="absolute inset-0">/g,
  `<div className="flex flex-col flex-1 space-y-4 justify-center">`
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
