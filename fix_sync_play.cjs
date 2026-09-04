const fs = require('fs');
const file = 'src/context/PlayerContext.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /} else if \(youtubeUrl\) {\s*setIsPlaying\(true\);\s*}/;
const replacement = `} else if (youtubeUrl) {
        setIsPlaying(true);
        if (reactPlayerRef.current && reactPlayerRef.current.getInternalPlayer()) {
          try {
            const internalPlayer = reactPlayerRef.current.getInternalPlayer();
            if (internalPlayer && typeof internalPlayer.playVideo === 'function') {
              internalPlayer.playVideo();
            }
          } catch (e) { console.warn("Sync playVideo error:", e); }
        }
      }`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
