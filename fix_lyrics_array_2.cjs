const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// Some tracks might return plain lyrics as just an array of lines or the structure could be slightly different causing the slice to break. We need to defend against all of that.
code = code.replace(
  /<div className="space-y-4 flex-1 relative min-h-\[120px\]">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<div className="mt-6 flex justify-start">/,
  `<div className="space-y-4 flex-1 relative min-h-[120px]">
              {lyricsData?.lines?.length ? (
                <div className="absolute inset-0 flex flex-col space-y-4">
                  {lyricsData.lines.slice(displayIndex, displayIndex + 4).map((line, i) => {
                    const isActive = i === 0 && activeLyricIndex >= 0 && !isUnsynced;
                    return (
                      <p 
                        key={\`lyric-\${displayIndex}-\${i}\`} 
                        className={\`text-xl font-bold leading-tight transition-all duration-300 \${isActive ? 'text-white scale-105 origin-left' : 'text-white/50'}\`}
                      >
                        {line.text || '♪'}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col space-y-4">
                  <p className="text-xl font-bold text-white leading-tight">{track.title}</p>
                  <p className="text-xl font-bold text-white/50 leading-tight">Enjoy the music!</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex justify-start">`
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
