import fetch from 'node-fetch';

async function test() {
    const q = encodeURIComponent(`"Dekha Tenu" spotify track`);
    const res = await fetch(`https://lite.qwant.com/?q=${q}&t=web`, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await res.text();
    const matches = html.match(/href="([^"]+spotify[^"]+)"/g);
    console.log(matches);
}
test().catch(console.error);
