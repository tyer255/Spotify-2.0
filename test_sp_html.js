import fetch from 'node-fetch';
async function test() {
    const res = await fetch(`https://open.spotify.com/search/Sajni`, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
    });
    const html = await res.text();
    const ids = html.match(/"id":"([a-zA-Z0-9]{22})"/g) || [];
    console.log("IDs found:", ids.slice(0, 10));
    const urls = html.match(/track\/([a-zA-Z0-9]{22})/g) || [];
    console.log("URLs found:", urls.slice(0, 10));
}
test().catch(console.error);
