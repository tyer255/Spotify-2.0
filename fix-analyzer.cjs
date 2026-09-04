const fs = require('fs');
let file = fs.readFileSync('src/lib/scanner/pipeline/FrameAnalyzer.ts', 'utf8');

// Remove the random fallback
const oldRandom = `    // OCR Fallback trigger (we return a special tag so the UI knows to try OCR)
    // We only trigger this every ~10 frames to avoid lagging
    if (Math.random() < 0.1) {
       return {
         success: true,
         source: 'ocr_fallback',
         resourceType: 'unknown',
         spotifyId: '',
         rawData: '',
         confidence: 0.1
       };
    }`;

file = file.replace(oldRandom, '');
fs.writeFileSync('src/lib/scanner/pipeline/FrameAnalyzer.ts', file);
