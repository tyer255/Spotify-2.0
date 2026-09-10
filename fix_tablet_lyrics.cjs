const fs = require('fs');
let code = fs.readFileSync('src/components/Player/TabletRightPlayer.tsx', 'utf8');

// I'm going to add a useMemo for fallback lyrics.
const importStatement = "import { usePlayer } from '../../context/PlayerContext';";
const useMemoImport = "import { useState, useEffect, useRef, useMemo } from 'react';";
code = code.replace("import { useState, useEffect, useRef } from 'react';", useMemoImport);

const fallbackLogic = `
  const fallbackLyricsLines = useMemo(() => {
    if (track?.lyrics) {
      return track.lyrics.split('\\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    }
    if (lyricsData?.plainLyrics) {
      return lyricsData.plainLyrics.split('\\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    }
    return [];
  }, [track?.lyrics, lyricsData?.plainLyrics]);

  const hasSyncedLines = lyricsData?.lines && lyricsData.lines.length > 0;
  const displayLinesToRender = hasSyncedLines 
    ? lyricsData.lines.slice(Math.max(0, displayIndex), Math.max(0, displayIndex) + 4) 
    : fallbackLyricsLines.slice(0, 4).map(text => ({ text, time: 0 }));
`;

// Insert after displayIndex definition
code = code.replace(
  "const displayIndex = activeLyricIndex >= 0 ? activeLyricIndex : 0;",
  "const displayIndex = activeLyricIndex >= 0 ? activeLyricIndex : 0;\n" + fallbackLogic
);

// Modify rendering logic
const renderLogicOld = `{lyricsData && lyricsData.lines && lyricsData.lines.length > 0 ? (
                <div className="flex flex-col h-full space-y-4">
                  {lyricsData.lines.slice(Math.max(0, displayIndex), Math.max(0, displayIndex) + 4).map((line, i) => {
                    const isActive = i === 0;
                    return (
                      <p 
                        key={\`lyric-\${displayIndex + i}\`} 
                        className={\`text-xl font-bold leading-tight transition-all duration-300 \${isActive ? 'text-white scale-105 origin-left mb-4' : 'text-white/50 mb-3'}\`}
                      >
                        {line.text || '♪'}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col flex-1 space-y-4 justify-center">
                  <p className="text-xl font-bold text-white leading-tight mb-3">{track.title}</p>
                  <p className="text-xl font-bold text-white/50 leading-tight">Enjoy the music!</p>
                </div>
              )}`;

const renderLogicNew = `{displayLinesToRender.length > 0 ? (
                <div className="flex flex-col h-full space-y-4">
                  {displayLinesToRender.map((line, i) => {
                    const isActive = i === 0 && (hasSyncedLines ? !isUnsynced : true);
                    return (
                      <p 
                        key={\`lyric-\${displayIndex + i}\`} 
                        className={\`text-xl font-bold leading-tight transition-all duration-300 \${isActive ? 'text-white scale-105 origin-left mb-4' : 'text-white/50 mb-3'}\`}
                      >
                        {line.text || '♪'}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col flex-1 space-y-4 justify-center">
                  <p className="text-xl font-bold text-white leading-tight mb-3">{track.title}</p>
                  <p className="text-xl font-bold text-white/50 leading-tight">Enjoy the music!</p>
                </div>
              )}`;

code = code.replace(renderLogicOld, renderLogicNew);

fs.writeFileSync('src/components/Player/TabletRightPlayer.tsx', code);
