import fs from 'fs';
let code = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

const replacement = `      if (playableUrl.startsWith('youtube:')) {
        audio.pause();
        audio.src = '';
        setYoutubeUrl('https://www.youtube.com/watch?v=' + playableUrl.split(':')[1]);
        setIsPlaying(true);
        setIsLoading(false);
      } else {
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

code = code.replace(/\{\s*setYoutubeUrl\(null\);\s*audio\.src = playableUrl;[\s\S]*?setIsLoading\(false\);\s*\}/, replacement);

fs.writeFileSync('src/context/PlayerContext.tsx', code);
console.log("Restored interception successfully");
