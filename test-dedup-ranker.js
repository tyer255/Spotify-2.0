const results = {
  songs: [
    { title: "Barsaat", artist: "Banjaare, Roni" },
    { title: "Barsaat", artist: "Banjaare & Roni" },
    { title: "Bairan", artist: "Banjaare" }
  ]
};

let rawSongs = results.songs || [];
rawSongs = rawSongs.filter((track, index, self) => {
  const normTitle = track.title.toLowerCase().replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/[^a-z0-9]/g, '');
  const normArtist = track.artist.split(/[,&\/\|]/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return index === self.findIndex((t) => {
    const tNormTitle = t.title.toLowerCase().replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/[^a-z0-9]/g, '');
    const tNormArtist = t.artist.split(/[,&\/\|]/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    return normTitle === tNormTitle && normArtist === tNormArtist;
  });
});

console.log(rawSongs);
