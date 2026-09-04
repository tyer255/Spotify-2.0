import fetch from 'node-fetch';

async function test() {
    const q = encodeURIComponent(`site:open.spotify.com/track "Dekha Tenu"`);
    const res = await fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${q}`);
    const data = await res.json();
    console.log(data);
}
test().catch(console.error);
