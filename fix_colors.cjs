const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

code = code.replace(
  /if \(colors && colors\.darkMuted\) \{\s*setDominantColor\(colors\.darkVibrant \|\| colors\.muted \|\| '#121212'\);\s*\}/g,
  "if (colors) {\n          setDominantColor(colors.primary || '#121212');\n        }"
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
