const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf8');

// We want to update calculateStrictMatchScore to heavily penalize "cover", "dj mix", "karaoke" if they are not in the original title
const patchTarget = `function calculateStrictMatchScore(`;
const index = code.indexOf(patchTarget);

if (index !== -1) {
  // Let's replace the whole function by injecting logic at the top of calculateStrictMatchScore
  const replacement = `function calculateStrictMatchScore(candidate: { title: string; artist: string; duration: number }, target: { title: string; artist: string; duration: number }) {
  const cTitle = candidate.title.toLowerCase();
  const cArtist = candidate.artist.toLowerCase();
  const tTitle = target.title.toLowerCase();
  
  // Penalize negative keywords if they are not in the target title
  const negativeKeywords = ['cover', 'karaoke', 'instrumental', 'dj mix', 'remix', 'live', 'slowed', 'reverb', '8d', 'trap invasion'];
  for (const word of negativeKeywords) {
    if (cTitle.includes(word) && !tTitle.includes(word)) {
      return { verified: false, score: -100 };
    }
  }`;
  code = code.replace(patchTarget, replacement);
  fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
  console.log("Patched calculateStrictMatchScore");
} else {
  console.log("Could not find calculateStrictMatchScore");
}
