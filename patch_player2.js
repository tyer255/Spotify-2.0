import fs from 'fs';

let code = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

// 1. Keep loading spinner active when switching to youtube
code = code.replace(
  /setYoutubeUrl\(yUrl\);\n\s*youtubeUrlRef\.current = yUrl;\n\s*setIsPlaying\(true\);\n\s*setIsLoading\(false\);/g,
  "setYoutubeUrl(yUrl);\n        youtubeUrlRef.current = yUrl;\n        setIsPlaying(true);\n        setIsLoading(true);" // Keep loading!
);

// 2. Ignore errors if we are playing youtube
code = code.replace(
  /const handleError = \(e: any\) => \{\n\s*console\.warn\('Audio playback error:', e\);/g,
  "const handleError = (e: any) => {\n      if (isTransitioningRef.current || youtubeUrlRef.current) return;\n      console.warn('Audio playback error:', e);"
);

// 3. Prevent native audio from emitting spurious errors on empty src
code = code.replace(
  /audio\.pause\(\);\n\s*audio\.src = '';/g,
  "audio.pause();\n        audio.removeAttribute('src');\n        audio.load();"
);

// 4. Add onBuffer and onBufferEnd to ReactPlayer
code = code.replace(
  /onWaiting=\{\(\) => setIsLoading\(true\)\}/g,
  "onWaiting={() => setIsLoading(true)}\n            onBuffer={() => setIsLoading(true)}\n            onBufferEnd={() => setIsLoading(false)}"
);

fs.writeFileSync('src/context/PlayerContext.tsx', code);
