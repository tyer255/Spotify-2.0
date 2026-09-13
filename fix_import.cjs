const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf-8');
code = code.replace("import { AudioStreamResolver } from '../services/AudioStreamResolver';\nimport { validateAudioStream } from '../utils/audioUtils.js';", "import { AudioStreamResolver, validateAudioStream } from '../services/AudioStreamResolver';");
fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
