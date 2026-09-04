const fs = require('fs');
const file = 'src/context/PlayerContext.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /if \(freshUrl\.startsWith\('youtube:'\)\) \{[\s\S]*?return;\s*\}/m;
const replacement = `if (freshUrl.startsWith('youtube:')) {
              clearWatchdog();
              audio.pause();
              audio.removeAttribute('src');
              audio.load();
              const yUrl = 'https://www.youtube.com/watch?v=' + freshUrl.split(':')[1];
              setYoutubeUrl(yUrl);
              youtubeUrlRef.current = yUrl;
              setIsPlaying(true);
              setIsLoading(true);
              setTimeout(() => {
                if (reactPlayerRef.current && reactPlayerRef.current.getInternalPlayer()) {
                  try {
                    const player = reactPlayerRef.current.getInternalPlayer();
                    if (player && typeof player.getPlayerState === 'function') {
                      const state = player.getPlayerState();
                      if (state === -1 || state === 2 || state === 5) {
                         setIsPlaying(false);
                         setIsLoading(false);
                      }
                    }
                  } catch(e) {}
                }
              }, 2500);
              return;
            }`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
