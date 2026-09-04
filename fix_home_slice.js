import fs from 'fs';

let code = fs.readFileSync('src/views/HomeView.tsx', 'utf8');

code = code.replace(
  /setDynamicRecommended\(newTracks\.slice\(0, 10\)\);/g,
  "setDynamicRecommended(newTracks.slice(0, 6));"
);

fs.writeFileSync('src/views/HomeView.tsx', code);
