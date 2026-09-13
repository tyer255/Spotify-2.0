const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf8');

// The regex might have left this weird string: 
// - ${artist}) != res(${streamObj.resolvedTitle} - ${streamObj.resolvedArtist})`);
// Let's remove it and any trailing '}' if it's broken.

// Easiest is to just replace the whole Audius block since it's the last one.
// Let's first clean up the string:
code = code.replace(/ - \$\{artist\}\) != res\(\$\{streamObj\.resolvedTitle\} - \$\{streamObj\.resolvedArtist\}\)\`\);/g, '');

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
