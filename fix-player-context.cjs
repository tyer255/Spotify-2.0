const fs = require('fs');
let code = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

const target1 = `if (!playableUrl) {
        if (!immediateUrl) {
          setError('Playback unavailable for this track.');
          setIsPlaying(false);
          setIsLoading(false);
          isTransitioningRef.current = false;
        }`;

const replacement1 = `if (!playableUrl) {
        if (!immediateUrl) {
          setError('Playback unavailable for this track.');
          setIsPlaying(false);
          setIsLoading(false);
          isTransitioningRef.current = false;
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
          }
        }`;

code = code.replace(target1, replacement1);

// Also add it when `!immediateUrl` and the try/catch fails
const target2 = `if (!immediateUrl) {
          console.warn('Audio play request interrupted or failed:', err);
          setError('Playback unavailable for this track.');
          setIsLoading(false);
        }`;

const replacement2 = `if (!immediateUrl) {
          console.warn('Audio play request interrupted or failed:', err);
          setError('Playback unavailable for this track.');
          setIsLoading(false);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
          }
        }`;

code = code.replace(target2, replacement2);
fs.writeFileSync('src/context/PlayerContext.tsx', code);
console.log('Fixed PlayerContext.tsx');
