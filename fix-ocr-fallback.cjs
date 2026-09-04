const fs = require('fs');
let file = fs.readFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', 'utf8');

const oldResolve = `
    // OCR fallback: If we couldn't properly extract an octal code but want to ensure Dhurandhar works
    if (frame && trackIdToSearch.length < 15) {
      try {
        const text = await extractTextFromImage(frame);
        const candidates = parseMusicCandidates(text);
        if (candidates.length > 0) {
          trackIdToSearch = candidates[0]; // use OCR title as fallback search
        }
      } catch (e) {}
    }

    const track = await musicResolverRef.current.resolve(trackIdToSearch);
`;

const newResolve = `
    let track = await musicResolverRef.current.resolve(trackIdToSearch);
    
    // OCR fallback: If the octal code couldn't be resolved via our mock catalog,
    // we use OCR on the frame to find the song title and search our catalog again.
    if (!track && frame) {
      try {
        const text = await extractTextFromImage(frame);
        const candidates = parseMusicCandidates(text);
        if (candidates.length > 0) {
          for (const candidate of candidates) {
            track = await musicResolverRef.current.resolve(candidate);
            if (track) break;
          }
        }
      } catch (e) {}
    }
`;

file = file.replace(oldResolve, newResolve);
fs.writeFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', file);
