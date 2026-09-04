import fs from 'fs';
let code = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

// 1. Add youtubeUrlRef
code = code.replace(
  "const reactPlayerRef = useRef<any>(null);",
  "const reactPlayerRef = useRef<any>(null);\n  const youtubeUrlRef = useRef<string | null>(null);"
);

// 2. Update all setYoutubeUrl calls to also update the ref
code = code.replace(
  /setYoutubeUrl\(null\);/g,
  "setYoutubeUrl(null); youtubeUrlRef.current = null;"
);
code = code.replace(
  /setYoutubeUrl\('https:\/\/www\.youtube\.com\/watch\?v=' \+ playableUrl\.split\(':'\)\[1\]\);/g,
  "const yUrl = 'https://www.youtube.com/watch?v=' + playableUrl.split(':')[1];\n        setYoutubeUrl(yUrl);\n        youtubeUrlRef.current = yUrl;"
);

// 3. Update handlePause to check youtubeUrlRef
code = code.replace(
  "const handlePause = () => {\n      if (isTransitioningRef.current) return;\n      setIsPlaying(false);",
  "const handlePause = () => {\n      if (isTransitioningRef.current) return;\n      if (youtubeUrlRef.current) return;\n      setIsPlaying(false);"
);

fs.writeFileSync('src/context/PlayerContext.tsx', code);
