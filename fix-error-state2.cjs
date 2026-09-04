const fs = require('fs');
let file = fs.readFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', 'utf8');

const regex = /const resolveMusic = async \(detectedTag: SpotifyTag, frame: HTMLCanvasElement \| null\) => \{[\s\S]*?onClose\(\);\n  \};/;

const newResolve = `const resolveMusic = async (detectedTag: SpotifyTag, frame: HTMLCanvasElement | null) => {
    let trackIdToSearch = detectedTag.spotifyId;
    let queryToSearch = "";
    
    // 1. Try to resolve the raw ID directly (MusicResolver handles mapping)
    let track = await musicResolverRef.current.resolve(trackIdToSearch);
    
    // 2. OCR fallback
    if (!track && frame) {
      try {
        const text = await Promise.race([
          extractTextFromImage(frame),
          new Promise<string>((_, reject) => setTimeout(() => reject(new Error('OCR timeout')), 4000))
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
            queryToSearch = candidates[0];
          }
        }
      } catch (e) {}
    }
    
    // 3. Prevent raw octal sequence search and remove hardcoded placeholders.
    if (!queryToSearch && !track) {
       scanControllerRef.current.transitionTo('ERROR', { 
           message: "Could not read the song name from the image. Please ensure the song title is clearly visible in the camera frame." 
       });
       return;
    }
    
    if (onCodeScanned) {
      onCodeScanned(track ? \`\${track.title} \${track.artist}\` : queryToSearch, track || undefined);
    }
    onClose();
  };`;

file = file.replace(regex, newResolve);
fs.writeFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', file);
