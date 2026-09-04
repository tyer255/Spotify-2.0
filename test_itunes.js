import fetch from 'node-fetch';
async function test() {
    const res = await fetch(`https://itunes.apple.com/search?term=Sajni+Arijit+Singh&entity=song&limit=1`);
    const data = await res.json();
    console.log(data.results[0]);
}
test().catch(console.error);
