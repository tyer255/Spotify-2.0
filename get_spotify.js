const fetch = require('node-fetch');
async function run() {
  const q = 'Safar';
  // Use a local Spotify search API or the one in the app!
  const res = await fetch('http://localhost:3000/api/search?q=safar');
  const data = await res.json();
  data.data.tracks.slice(0, 10).forEach(t => {
    const mins = Math.floor(t.duration / 60);
    const secs = t.duration % 60;
    console.log(`${t.title} - ${t.artist} : ${mins}:${secs.toString().padStart(2, '0')} (${t.duration}s) - ID: ${t.id}`);
  });
}
run();
