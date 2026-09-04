const fs = require('fs');
const file = 'src/context/PlayerContext.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /if \(playableUrl\.startsWith\('youtube:'\)\) \{[\s\S]*?isTransitioningRef\.current = false;\s*\}/m;
const replacement = `if (playableUrl.startsWith('youtube:')) {
        clearWatchdog();
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        const yUrl = 'https://www.youtube.com/watch?v=' + playableUrl.split(':')[1];
        setYoutubeUrl(yUrl);
        youtubeUrlRef.current = yUrl;
        setIsPlaying(true);
        setIsLoading(true);
        isTransitioningRef.current = false;
        
        // Anti-deadlock watchdog for Mobile YouTube Autoplay Block
        setTimeout(() => {
          if (reactPlayerRef.current && reactPlayerRef.current.getInternalPlayer()) {
            try {
               const player = reactPlayerRef.current.getInternalPlayer();
               if (player && typeof player.getPlayerState === 'function') {
                 const state = player.getPlayerState();
                 // -1 (unstarted), 0 (ended), 2 (paused), 5 (video cued)
                 if (state === -1 || state === 2 || state === 5) {
                    console.warn("YouTube Autoplay Blocked! Reverting UI to paused state.");
                    setIsPlaying(false);
                    setIsLoading(false);
                 }
               }
            } catch(e) {}
          }
        }, 2500);
      }`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
