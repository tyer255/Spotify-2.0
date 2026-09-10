const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// Add import
code = code.replace(
  "import { motion } from 'motion/react';",
  "import { motion } from 'motion/react';\nimport { extractColorsFromImage } from '../../utils/colorExtractor';"
);

// Add state for colors
code = code.replace(
  "const [seekPos, setSeekPos] = useState(0);",
  "const [seekPos, setSeekPos] = useState(0);\n  const [dominantColor, setDominantColor] = useState<string>('#121212');\n\n  useEffect(() => {\n    if (track?.images?.large || track?.images?.medium) {\n      extractColorsFromImage(track.images.large || track.images.medium || '').then(colors => {\n        if (colors && colors.darkMuted) {\n          setDominantColor(colors.darkVibrant || colors.muted || '#121212');\n        }\n      });\n    }\n  }, [track?.id]);"
);

// Change the background wrapper
code = code.replace(
  /<aside className="hidden md:flex flex-col w-\[350px\] lg:w-\[380px\] xl:w-\[420px\] h-full bg-\[#121212\] flex-shrink-0 z-30 p-4 pt-6 overflow-y-auto pb-24 scrollbar-hide">/,
  `<aside 
      className="hidden md:flex flex-col w-[350px] lg:w-[380px] xl:w-[420px] h-full flex-shrink-0 z-30 p-4 pt-6 overflow-y-auto pb-24 scrollbar-hide transition-colors duration-1000 ease-in-out relative"
      style={{
        background: dominantColor !== '#121212' ? \`linear-gradient(to bottom, \${dominantColor} 0%, #121212 60%)\` : '#121212'
      }}
    >
      <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col h-full w-full">`
);

// Close the wrapper at the end
code = code.replace(
  /<\/aside>/,
  `</div>\n    </aside>`
);

// Fix lyrics index logic
const activeLyricLogic = `
  const activeLyricIndex = lyricsData?.lines 
    ? lyricsData.lines.findIndex((line, idx, arr) => {
        const nextLine = arr[idx + 1];
        return position >= line.time && (!nextLine || position < nextLine.time);
      })
    : -1;
  const displayIndex = activeLyricIndex >= 0 ? activeLyricIndex : 0;
`;

code = code.replace(
  "if (!track) return null;",
  activeLyricLogic + "\n  if (!track) return null;"
);

// Fix the lyrics display map
const oldLyricsMap = `{lyricsData && lyricsData.lines && lyricsData.lines.length > 0 ? (
                lyricsData.lines.slice(0, 4).map((line, i) => (
                  <p key={i} className={\`text-xl font-bold leading-tight \${i === 0 ? 'text-white' : 'text-white/50'}\`}>
                    {line.text || '♪'}
                  </p>
                ))
              ) : (`;

const newLyricsMap = `{lyricsData && lyricsData.lines && lyricsData.lines.length > 0 ? (
                lyricsData.lines.slice(displayIndex, displayIndex + 4).map((line, i) => {
                  const isActive = i === 0 && activeLyricIndex >= 0;
                  return (
                    <p 
                      key={displayIndex + i} 
                      className={\`text-xl font-bold leading-tight transition-all duration-300 \${isActive ? 'text-white scale-105 origin-left' : 'text-white/50'}\`}
                    >
                      {line.text || '♪'}
                    </p>
                  );
                })
              ) : (`;

code = code.replace(oldLyricsMap, newLyricsMap);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
