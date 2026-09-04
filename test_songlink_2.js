import fetch from 'node-fetch';
async function test() {
    const res = await fetch(`https://song.link/t/1745696331`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await res.text();
    console.log(html.substring(0, 500));
    const match = html.match(/spotify.com\/track\/([a-zA-Z0-9]{22})/);
    console.log("Match:", match ? match[1] : null);
}
test().catch(console.error);
