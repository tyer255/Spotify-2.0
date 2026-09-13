const fs = require('fs');

const path = 'server/services/AudioStreamResolver.ts';
let code = fs.readFileSync(path, 'utf8');

// Insert the helper function at the top
const helper = `
function hasWord(text: string, word: string): boolean {
  if (!text || !word) return false;
  return new RegExp(\`\\\\b\${word}\\\\b\`, 'i').test(text);
}
`;

if (!code.includes('function hasWord')) {
  code = code.replace("export class AudioStreamResolver", helper + "\nexport class AudioStreamResolver");
}

// Fix JioSaavn matching
code = code.replace(
  "let titleMatch = resTitle.includes(cleanT) || cleanT.includes(resTitle) || cleanT.split(' ').some(w => w.length > 3 && resTitle.includes(w));",
  "let titleMatch = resTitle.includes(cleanT) || cleanT.includes(resTitle) || cleanT.split(' ').some(w => w.length > 3 && hasWord(resTitle, w));"
);

code = code.replace(
  "let artistMatch = !cleanA ? true : cleanA.split(' ').some(w => w.length > 2 && (resSubtitle.includes(w) || resSingers.includes(w) || (resTitle.includes(w) && resTitle.includes('feat'))));",
  "let artistMatch = !cleanA ? true : cleanA.split(' ').some(w => w.length > 1 && (hasWord(resSubtitle, w) || hasWord(resSingers, w) || (hasWord(resTitle, w) && resTitle.includes('feat'))));"
);

// Fix YouTube matching
code = code.replace(
  "if (cleanT.split(' ').every(w => vidTitle.includes(w))) score += 100;",
  "if (cleanT.split(' ').every(w => hasWord(vidTitle, w))) score += 100;"
);

code = code.replace(
  "else if (cleanT.split(' ').some(w => w.length > 3 && vidTitle.includes(w))) score += 50;",
  "else if (cleanT.split(' ').some(w => w.length > 3 && hasWord(vidTitle, w))) score += 50;"
);

code = code.replace(
  "if (cleanA && cleanA.split(' ').some(w => w.length > 2 && (vidAuthor.includes(w) || vidTitle.includes(w)))) score += 100;",
  "if (cleanA && cleanA.split(' ').some(w => w.length > 1 && (hasWord(vidAuthor, w) || hasWord(vidTitle, w)))) score += 100;"
);

fs.writeFileSync(path, code);
console.log('Fixed AudioStreamResolver.ts');
