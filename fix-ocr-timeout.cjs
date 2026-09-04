const fs = require('fs');
let file = fs.readFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', 'utf8');

const oldOcr = `        const text = await extractTextFromImage(frame);`;
const newOcr = `        const text = await Promise.race([
          extractTextFromImage(frame),
          new Promise<string>((_, reject) => setTimeout(() => reject(new Error('OCR timeout')), 3000))
        ]);`;

file = file.replace(oldOcr, newOcr);
fs.writeFileSync('src/components/Scanner/SpotifyCodeScanner.tsx', file);
