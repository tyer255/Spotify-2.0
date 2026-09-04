import fetch from 'node-fetch';
async function test() {
    // try to get DDG Lite search
    const res = await fetch(`https://lite.duckduckgo.com/lite/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        body: 'q=Sajni+Arijit+Singh+site:open.spotify.com/track'
    });
    const html = await res.text();
    const urls = html.match(/open\.spotify\.com(?:%2F|\/)track(?:%2F|\/)([a-zA-Z0-9]{22})/g);
    console.log("URLs:", urls);
}
test().catch(console.error);
