const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

code = code.replace(
  "key={displayIndex + i}",
  "key={`lyric-\${displayIndex + i}`}"
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
