const fs = require('fs');

const files = [
  'src/components/Player/FullscreenPlayer.tsx',
  'src/components/Player/MiniPlayer.tsx',
  'src/components/Player/LyricsDrawer.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/value=\{currentDisplayTime\}/g, "value={Number.isNaN(currentDisplayTime) ? 0 : currentDisplayTime}");
    code = code.replace(/value=\{currentPos\}/g, "value={Number.isNaN(currentPos) ? 0 : currentPos}");
    fs.writeFileSync(file, code);
  }
}
