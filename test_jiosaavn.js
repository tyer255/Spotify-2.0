import fetch from 'node-fetch';
async function test() {
    const res = await fetch('https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=Sajni+Arijit');
    const data = await res.json();
    console.log(data.data.results.map(r => r.name + " " + r.id));
}
test().catch(console.error);
