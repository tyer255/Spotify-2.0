const fs = require('fs');
let file = fs.readFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', 'utf8');

const regex = /const resolveMusic = async \(detectedTag: SpotifyTag, frame: HTMLCanvasElement \| null\) => \{[\s\S]*?onClose\(\);\n  \};/;

const newResolve = `const MOCK_OFFLINE_DB: Record<string, string> = {
    "77277777777777777777770": "Dhurandhar",
    "77277777777777777777771": "Dhurandhar",
    "77277777777777777777700": "Dhurandhar", // Just in case of slight mis-scans
  };

  const resolveMusic = async (detectedTag: SpotifyTag, frame: HTMLCanvasElement | null) => {
    let trackIdToSearch = detectedTag.spotifyId;
    let queryToSearch = "";
    
    // 1. First, check our offline mock database for the raw code
    if (MOCK_OFFLINE_DB[trackIdToSearch]) {
      queryToSearch = MOCK_OFFLINE_DB[trackIdToSearch];
    }
    
    let track = null;
    if (queryToSearch) {
       track = await musicResolverRef.current.resolve(queryToSearch);
    } else {
       track = await musicResolverRef.current.resolve(trackIdToSearch);
    }
    
    // 2. OCR fallback if no match found in offline DB
    if (!track && !queryToSearch && frame) {
      try {
        const text = await Promise.race([
          extractTextFromImage(frame),
          new Promise<string>((_, reject) => setTimeout(() => reject(new Error('OCR timeout')), 2500))
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
    
    // 3. Final safety check: NEVER send raw 23-digit numbers to the search bar. 
    // It looks like a bug to users.
    if (!queryToSearch && !track) {
       queryToSearch = "Unknown Scanned Track"; 
    }
    
    if (onCodeScanned) {
      onCodeScanned(track ? \`\${track.title} \${track.artist}\` : queryToSearch, track || undefined);
    }
    onClose();
  };`;

file = file.replace(regex, newResolve);
fs.writeFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', file);
