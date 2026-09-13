const fs = require('fs');
const filepath = 'server/services/AudioStreamResolver.ts';
let code = fs.readFileSync(filepath, 'utf8');

code = code.replace(/let artistMatch = !cleanA \? true : cleanA\.split\(' '\)\.some\(w => w\.length > 2 && \(resSubtitle\.includes\(w\) || resSingers\.includes\(w\) || resTitle\.includes\(w\)\)\);/, 
'let artistMatch = !cleanA ? true : cleanA.split(\' \').some(w => w.length > 2 && (resSubtitle.includes(w) || resSingers.includes(w) || (resTitle.includes(w) && resTitle.includes(\'feat\'))));');

fs.writeFileSync(filepath, code);
