const fs = require('fs');
let file = fs.readFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', 'utf8');

const regex = /const resolveMusic = async \(detectedTag: SpotifyTag, frame: HTMLCanvasElement \| null\) => \{[\s\S]*?scanControllerRef\.current\.transitionTo\('ERROR'[\s\S]*?\}\n  \};/;

const newResolve = `const resolveMusic = async (detectedTag: SpotifyTag, frame: HTMLCanvasElement | null) => {
    let trackIdToSearch = detectedTag.spotifyId;
    let queryToSearch = trackIdToSearch;
    
    let track = await musicResolverRef.current.resolve(trackIdToSearch);
    
    if (!track && frame) {
      try {
        const text = await Promise.race([
          extractTextFromImage(frame),
          new Promise<string>((_, reject) => setTimeout(() => reject(new Error('OCR timeout')), 3000))
        ]);
        const candidates = parseMusicCandidates(text);
        if (candidates.length > 0) {
          for (const candidate of candidates) {
            let possibleTrack = await musicResolverRef.current.resolve(candidate);
            if (possibleTrack) {
              track = possibleTrack;
              queryToSearch = candidate;
              break;
            }
          }
          if (!track) {
            queryToSearch = candidates[0]; // If no match, search the first candidate word
          }
        }
      } catch (e) {}
    }
    
    // As per user request: automatically search the found text/track, no auto-play, no "not found" error blocking the screen.
    if (onCodeScanned) {
      onCodeScanned(track ? \`\${track.title} \${track.artist}\` : queryToSearch, track || undefined);
    }
    onClose();
  };`;

file = file.replace(regex, newResolve);
fs.writeFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', file);
