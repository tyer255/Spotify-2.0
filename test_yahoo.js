import fetch from 'node-fetch';

async function test() {
    const q = encodeURIComponent(`site:open.spotify.com/track "Dekha Tenu"`);
    const res = await fetch(`https://search.yahoo.com/search?p=${q}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await res.text();
    const match = html.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]{22})/);
    if (match) {
        console.log("Yahoo Found:", match[1]);
    } else {
        console.log("Not found in Yahoo");
    }
}
test().catch(console.error);
