import fetch from 'node-fetch';
async function test() {
    const res = await fetch(`https://open.spotify.com/track/5L636Zp2hy7orVQIykaHoG`);
    const html = await res.text();
    console.log(html.length);
}
test().catch(console.error);
