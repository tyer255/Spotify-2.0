import fetch from 'node-fetch';

async function test() {
    const q = encodeURIComponent(`site:open.spotify.com/track "Dekha Tenu"`);
    const res = await fetch(`https://search.aol.com/aol/search?q=${q}`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    });
    const html = await res.text();
    const match = html.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]{22})/);
    if (match) {
        console.log("AOL Found:", match[1]);
    } else {
        console.log("Not found in AOL. Status:", res.status);
    }
}
test().catch(console.error);
