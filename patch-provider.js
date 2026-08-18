import fs from 'fs';
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

const replacement = `    // If no full match could be strictly verified, DO NOT return the 30-second preview.
    // The user explicitly requested to fetch full music or fail, but never play 30 seconds.
    return {
      success: false,
      error: "Extraction failed: Full length audio could not be resolved."
    };`;

code = code.replace(/\/\/ If no full match could be strictly verified[\s\S]*?isFullLength: false,\n\s*\}\n\s*: null,\n\s*\};\n\s*\}/, replacement);

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
console.log("Patched Provider");
