function hasWord(text: string, word: string): boolean {
  if (!text || !word) return false;
  return new RegExp(`\\b${word}\\b`, 'i').test(text);
}
const cleanT = "chehre";
const cleanA = "aur";
const resTitle = "dil sachaa aur chehra jhutha";
const resSubtitle = "kishore kumar";
const resSingers = "kishore kumar";

let titleMatch = resTitle.includes(cleanT) || cleanT.includes(resTitle) || cleanT.split(' ').some(w => w.length > 3 && hasWord(resTitle, w));
let artistMatch = !cleanA ? true : cleanA.split(' ').some(w => w.length > 1 && (hasWord(resSubtitle, w) || hasWord(resSingers, w) || (hasWord(resTitle, w) && resTitle.includes('feat'))));

console.log({titleMatch, artistMatch});
