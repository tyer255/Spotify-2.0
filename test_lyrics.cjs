const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// The issue is likely that Lyrics aren't displaying because lyricsData logic or the DOM component is not correctly structured. Let's make sure it defaults properly
code = code.replace(
  /<div className="space-y-4 flex-1">([\s\S]*?)<\/div>\s*<div className="mt-6 flex justify-start">/,
  `<div className="space-y-4 flex-1 relative min-h-[120px]">
              {lyricsData && lyricsData.lines && lyricsData.lines.length > 0 ? (
                <div className="absolute inset-0">
                  {lyricsData.lines.slice(Math.max(0, displayIndex), Math.max(0, displayIndex) + 4).map((line, i) => {
                    const isActive = i === 0 && activeLyricIndex >= 0 && !isUnsynced;
                    return (
                      <p 
                        key={displayIndex + i} 
                        className={\`text-xl font-bold leading-tight transition-all duration-300 \${isActive ? 'text-white scale-105 origin-left mb-4' : 'text-white/50 mb-3'}\`}
                      >
                        {line.text || '♪'}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="absolute inset-0">
                  <p className="text-xl font-bold text-white leading-tight mb-3">{track.title}</p>
                  <p className="text-xl font-bold text-white/50 leading-tight">Enjoy the music!</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-start">`
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
