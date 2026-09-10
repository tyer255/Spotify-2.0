const fs = require('fs');
let content = fs.readFileSync('src/context/PlayerContext.tsx', 'utf8');

content = content.replace(
  /const recovered = handleStreamFallback\('YouTube 0:00 stall'\);\n\s*if \(\!recovered\) \{\n\s*console\.warn\(\`\[PlayerContext:Watchdog\] No alternate streams found for YouTube track "\$\{targetTrackId\}"\.\`\);\n\s*setIsLoading\(false\);\n\s*\}/g,
  `const recovered = handleStreamFallback('YouTube 0:00 stall');
        if (!recovered) {
          console.warn(\`[PlayerContext:Watchdog] No alternate streams found for YouTube track "\${targetTrackId}". Skipping...\`);
          setIsLoading(true);
          if (nextTrackRef.current) nextTrackRef.current();
        }`
);

content = content.replace(
  /console\.warn\(\`\[PlayerContext:Watchdog\] All recovery attempts exhausted for track "\$\{targetTrackId\}"\.\`\);\n\s*setIsLoading\(false\);\n\s*\}/g,
  `console.warn(\`[PlayerContext:Watchdog] All recovery attempts exhausted for track "\${targetTrackId}". Skipping...\`);
            setIsLoading(true);
            if (nextTrackRef.current) nextTrackRef.current();
          }`
);

fs.writeFileSync('src/context/PlayerContext.tsx', content);
