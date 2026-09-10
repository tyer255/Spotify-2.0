const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// 1. Add lyricsData to usePlayer destructuring
code = code.replace(/isLoading,\s*\} = usePlayer\(\);/, 'isLoading,\n    lyricsData,\n  } = usePlayer();');

// 2. Fix the header to use dynamic track data instead of hardcoded Playlist name
code = code.replace(
  /<h2 className="text-\[11px\] font-bold text-neutral-400 uppercase tracking-wider mb-0\.5">Playing from Playlist<\/h2>\s*<h3 className="text-sm font-bold text-white truncate hover:underline cursor-pointer">Chill ☕️ songs<\/h3>/,
  `<h2 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">{track.album ? 'Playing from Album' : 'Now Playing'}</h2>
          <h3 className="text-sm font-bold text-white truncate hover:underline cursor-pointer">{track.album || track.artist}</h3>`
);

// 3. Fix the hardcoded lyrics
code = code.replace(
  /<div className="space-y-4 flex-1">\s*<p className="text-xl font-bold text-white leading-tight">Chaand mera dil, chaand mera dil<\/p>\s*<p className="text-xl font-bold text-white\/50 leading-tight">Tu sitaaron bhara raat ka aasmaan<\/p>\s*<p className="text-xl font-bold text-white\/50 leading-tight">Chaand mera dil, chaand mera dil<\/p>\s*<p className="text-xl font-bold text-white\/50 leading-tight">Jo kabhi na dhale, chaahe<\/p>\s*<\/div>/,
  `<div className="space-y-4 flex-1">
              {lyricsData && lyricsData.lines && lyricsData.lines.length > 0 ? (
                lyricsData.lines.slice(0, 4).map((line, i) => (
                  <p key={i} className={\`text-xl font-bold leading-tight \${i === 0 ? 'text-white' : 'text-white/50'}\`}>
                    {line.text || '♪'}
                  </p>
                ))
              ) : (
                <>
                  <p className="text-xl font-bold text-white leading-tight">{track.title}</p>
                  <p className="text-xl font-bold text-white/50 leading-tight">Enjoy the music!</p>
                </>
              )}
            </div>`
);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
