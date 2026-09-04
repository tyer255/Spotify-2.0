const fs = require('fs');
let code = fs.readFileSync('src/views/SettingsView.tsx', 'utf8');
code = code.replace('value={crossfadeSeconds}', 'value={Number.isNaN(crossfadeSeconds) ? 3 : crossfadeSeconds}');
fs.writeFileSync('src/views/SettingsView.tsx', code);
