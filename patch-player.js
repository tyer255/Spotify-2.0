import fs from 'fs';
let content = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

const oldLogic = `      } else {
        setYoutubeUrl(null);
        audio.src = playableUrl;
        audio.playbackRate = playbackRate;
        audio.volume = isMuted ? 0 : volume;
        try {
          await audio.play();
        } catch (err: any) {
          if (err.name !== 'AbortError') throw err;
        }
        setIsPlaying(true);
        setIsLoading(false);
      }`;

const newLogic = `      } else {
        setYoutubeUrl(null);
        audio.src = playableUrl;
        audio.playbackRate = playbackRate;
        audio.volume = isMuted ? 0 : volume;
        
        setIsPlaying(true);
        setIsLoading(false);
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err: any) => {
            if (err.name !== 'AbortError') {
              console.warn('Autoplay blocked or playback failed:', err);
              setIsPlaying(false);
            }
          });
        }
      }`;

if (content.includes(oldLogic)) {
  content = content.replace(oldLogic, newLogic);
  fs.writeFileSync('src/context/PlayerContext.tsx', content);
  console.log('Patched successfully');
} else {
  console.log('Could not find old logic in PlayerContext.tsx');
}
