const track = { title: "Barsaat", artist: "Banjaare & Roni" };
const t = { title: "Barsaat", artist: "Banjaare, Roni" };

const match = t.title.toLowerCase() === track.title.toLowerCase() && (t.artist.toLowerCase().includes(track.artist.toLowerCase()) || track.artist.toLowerCase().includes(t.artist.toLowerCase()));

console.log(match);
