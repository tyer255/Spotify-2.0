const fs = require('fs');
const file = 'src/context/PlayerContext.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /audio\.src = 'data:audio\/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';\s*audio\.load\(\);\s*\}/;
const replacement = `audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
          audio.load();
          const p = audio.play();
          if (p !== undefined) p.catch(() => {});
        }`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
