const fs = require('fs');
let file = fs.readFileSync('src/lib/scanner/spotifyCodeDetector.ts', 'utf8');

// We want to add a check that the quantized array has sufficient variance.
// Find: const range = maxH - minH;
// Add a check for variance after quantized array creation.

const oldStr = `  const quantized = rawHeights.map(h => {
    const level = Math.round(((h - minH) / range) * 7);
    return Math.max(0, Math.min(7, level));
  });

  return {
    bars: quantized,
    octalSequence: quantized.join(''),
    confidence: bestCandidate.score
  };`;

const newStr = `  const quantized = rawHeights.map(h => {
    const level = Math.round(((h - minH) / range) * 7);
    return Math.max(0, Math.min(7, level));
  });

  const octalStr = quantized.join('');
  
  // Strict Validation: A valid Spotify code cannot be all the same number
  // or highly repetitive strings (e.g. 777777777) caused by glare.
  let uniqueDigits = new Set(quantized).size;
  if (uniqueDigits < 4) {
      return null; // Reject bad reads caused by lighting/glare
  }

  return {
    bars: quantized,
    octalSequence: octalStr,
    confidence: bestCandidate.score
  };`;

if (file.includes('const quantized = rawHeights.map')) {
    file = file.replace(oldStr, newStr);
    fs.writeFileSync('src/lib/scanner/spotifyCodeDetector.ts', file);
    console.log("Patched spotifyCodeDetector");
} else {
    console.log("Could not find string");
}
