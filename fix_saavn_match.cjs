const fs = require('fs');
const path = 'server/services/AudioStreamResolver.ts';
let code = fs.readFileSync(path, 'utf8');

const oldCheck = `            let titleMatch = resTitle.includes(cleanT) || cleanT.includes(resTitle) || cleanT.split(' ').some(w => w.length > 3 && hasWord(resTitle, w));
            let artistMatch = !cleanA ? true : cleanA.split(' ').some(w => w.length > 1 && (hasWord(resSubtitle, w) || hasWord(resSingers, w) || (hasWord(resTitle, w) && resTitle.includes('feat'))));
            
            if (!titleMatch && !artistMatch) continue;`;

const newCheck = `            let titleMatch = resTitle.includes(cleanT) || cleanT.includes(resTitle) || cleanT.split(' ').some(w => w.length > 3 && hasWord(resTitle, w));
            
            // STRICT ARTIST MATCHING to prevent "AUR" matching Hindi word "aur"
            let artistMatch = true;
            if (cleanA) {
               const singersList = resSingers.split(',').map((s: string) => s.trim().toLowerCase());
               const subtitleParts = resSubtitle.split('-').map((s: string) => s.trim());
               const subtitleArtists = subtitleParts[0].split(',').map((s: string) => s.trim().toLowerCase());
               
               const requestedArtistWords = cleanA.split(' ');
               
               // Either the full requested artist is in the singers list exactly,
               // OR it is in the subtitle artists exactly
               const exactMatch = singersList.includes(cleanA) || subtitleArtists.includes(cleanA);
               
               // Or at least one word from the requested artist matches exactly in the singers list
               const partialMatch = requestedArtistWords.some(w => w.length > 2 && (singersList.includes(w) || subtitleArtists.includes(w)));
               
               artistMatch = exactMatch || partialMatch || resTitle.includes('feat ' + cleanA);
            }
            
            if (!titleMatch || !artistMatch) continue; // MUST MATCH BOTH TITLE AND ARTIST STRICTLY`;

if (code.includes(oldCheck)) {
  code = code.replace(oldCheck, newCheck);
  fs.writeFileSync(path, code);
  console.log('Fixed Saavn strict matching');
} else {
  console.log('Could not find old check');
}
