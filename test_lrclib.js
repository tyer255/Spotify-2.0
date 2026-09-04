import fetch from 'node-fetch';
async function test() {
    const res = await fetch(`https://lrclib.net/api/search?q=Sajni+Arijit+Singh`);
    const data = await res.json();
    console.log(data.slice(0, 2));
}
test().catch(console.error);
