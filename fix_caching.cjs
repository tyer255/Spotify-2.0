const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf-8');

// Remove normKey reads
code = code.replace(/const normKey = cleanT && cleanA \? \`playback-ta-v5-\$\{cleanT\}::\$\{cleanA\}\` : null;\s*if \(!options\?\.forceFresh && !options\?\.discardUrl && normKey\) \{\s*const cachedByTA = getFromCache<any>\(normKey\);\s*if \(cachedByTA\) return cachedByTA;\s*\}/g, 'const normKey = null;');

// Remove normKey writes
code = code.replace(/if \(normKey\) setToCache\(normKey, result, 86400\);/g, '');

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
