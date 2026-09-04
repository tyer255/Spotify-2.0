const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf8');

const badCode = `function calculateStrictMatchScore(candidate: { title: string; artist: string; duration: number }, target: { title: string; artist: string; duration: number }) {
  const cTitle = candidate.title.toLowerCase();
  const cArtist = candidate.artist.toLowerCase();
  const tTitle = target.title.toLowerCase();
  
  // Penalize negative keywords if they are not in the target title
  const negativeKeywords = ['cover', 'karaoke', 'instrumental', 'dj mix', 'remix', 'live', 'slowed', 'reverb', '8d', 'trap invasion'];
  for (const word of negativeKeywords) {
    if (cTitle.includes(word) && !tTitle.includes(word)) {
      return { verified: false, score: -100 };
    }
  }
  candidate: { title: string; artist: string; primaryArtist?: string; singers?: string; album?: string; duration?: number },
  target: { title: string; artist: string; duration?: number }
): { verified: boolean; score: number; reason?: string } {`;

const goodCode = `function calculateStrictMatchScore(
  candidate: { title: string; artist: string; primaryArtist?: string; singers?: string; album?: string; duration?: number },
  target: { title: string; artist: string; duration?: number }
): { verified: boolean; score: number; reason?: string } {
  const cTitle = (candidate.title || '').toLowerCase();
  const tTitle = (target.title || '').toLowerCase();
  
  // Penalize negative keywords if they are not in the target title
  const negativeKeywords = ['cover', 'karaoke', 'instrumental', 'dj mix', 'remix', 'live', 'slowed', 'reverb', '8d', 'trap invasion'];
  for (const word of negativeKeywords) {
    if (cTitle.includes(word) && !tTitle.includes(word)) {
      return { verified: false, score: -100, reason: 'Contains negative keyword: ' + word };
    }
  }`;

code = code.replace(badCode, goodCode);
fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
console.log("Fixed calculateStrictMatchScore");
