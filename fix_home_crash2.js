import fs from 'fs';

let code = fs.readFileSync('src/views/HomeView.tsx', 'utf8');

code = code.replace(
  /if \(\!profile \|\| \!profile\.history\) return;/g,
  "if (!profile || !profile.recentHistory) return;"
);

code = code.replace(
  /profile\.history\.map/g,
  "profile.recentHistory.map"
);

code = code.replace(
  /\[profile\?\.history\]/g,
  "[profile?.recentHistory]"
);

fs.writeFileSync('src/views/HomeView.tsx', code);
