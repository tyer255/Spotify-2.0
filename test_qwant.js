import fetch from 'node-fetch';

async function test() {
    const q = encodeURIComponent(`open.spotify.com/track "Dekha Tenu"`);
    const res = await fetch(`https://lite.qwant.com/?q=${q}&t=web`, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await res.text();
    const match = html.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]{22})/);
    if (match) {
        console.log("Qwant Found:", match[1]);
    } else {
        console.log("Not found in Qwant.");
        console.log("Length:", html.length);
        console.log("Excerpt:", html.substring(0, 300));
    }
}
test().catch(console.error);
