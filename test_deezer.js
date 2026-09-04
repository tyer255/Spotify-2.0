import fetch from 'node-fetch';
async function test() {
    const res = await fetch(`https://api.deezer.com/search?q=Sajni+Arijit+Singh&limit=1`);
    const data = await res.json();
    console.log("Search:", data.data[0]);
    if (data.data[0]) {
        const tRes = await fetch(`https://api.deezer.com/track/${data.data[0].id}`);
        const tData = await tRes.json();
        console.log("Track:", tData.isrc);
    }
}
test().catch(console.error);
