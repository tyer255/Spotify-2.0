const fs = require('fs');
const path = 'server/providers/OpenMusicProvider.ts';
let code = fs.readFileSync(path, 'utf8');

// Remove await validateAudioStream in direct streamUrl check
code = code.replace(
  "const check = await validateAudioStream(track.streamUrl, 800, track.duration || 210);\n      if (check.valid) {",
  "// SKIP VALIDATION FOR SPEED\n      if (true) {"
);

// Remove await validateAudioStream in saavn lookup
code = code.replace(
  "const check = await validateAudioStream(streamResult.primaryUrl, 800, expectedDur);\n                    const validUrl = check.valid ? streamResult.primaryUrl : (streamResult.fallbackUrls[0] || streamResult.primaryUrl);",
  "const validUrl = streamResult.primaryUrl;"
);

fs.writeFileSync(path, code);
console.log('Removed slow sequential validation');
