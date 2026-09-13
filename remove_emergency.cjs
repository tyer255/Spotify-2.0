const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf-8');

const regex = /\/\/ Emergency fail-safe: Try resolving by title only[\s\S]*?return \{\s*success: false,\s*error: \{ code: 'PLAYBACK_UNAVAILABLE', message: 'Playback unavailable for this track.' \}\s*\};\s*\}/;

const match = code.match(regex);
if (match) {
  code = code.replace(/\/\/ Emergency fail-safe: Try resolving by title only[\s\S]*?\} catch \(err\) \{\s*console\.warn\('\[Playback\] Emergency resolution failed:', err\);\s*\}\s*\}/, '');
  fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
  console.log('Removed emergency fail-safe successfully.');
} else {
  console.log('Could not find emergency fail-safe block.');
}
