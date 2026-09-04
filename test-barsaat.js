fetch("http://localhost:3000/api/search?q=Barsaat")
  .then(r => r.json())
  .then(data => {
    console.log("Songs:", data.data.songs.map(s => `${s.id} | ${s.title} | ${s.artist}`));
  });
