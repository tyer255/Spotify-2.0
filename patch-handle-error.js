import fs from 'fs';
let code = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

const replacement = `    const handleError = (e: any) => {
      console.warn('Audio playback error:', e);
      setIsLoading(false);
      setError('Playback unavailable for this track.');
      setIsPlaying(false);
    };`;

code = code.replace(/const handleError = \(e: any\) => \{[\s\S]*?setIsPlaying\(false\);\n\s*\}\n\s*\};/, replacement);

fs.writeFileSync('src/context/PlayerContext.tsx', code);
console.log("Patched handleError");
