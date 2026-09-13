const cleanA = "aur";
const resSingers = "khayyam, lata mangeshkar, kishore kumar";
const resSubtitle = "khayyam, lata mangeshkar, kishore kumar - hum aur tum - hit duets";

const singersList = resSingers.split(',').map(s => s.trim());
// JioSaavn subtitles are usually "Artist1, Artist2 - AlbumName"
const subtitleParts = resSubtitle.split('-').map(s=>s.trim());
const subtitleArtists = subtitleParts[0].split(',').map(s=>s.trim());

let artistMatch = !cleanA ? true : singersList.includes(cleanA) || subtitleArtists.includes(cleanA);
console.log({artistMatch});
