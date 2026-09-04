import fetch from 'node-fetch';
async function test() {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=Sajni+Arijit+Singh+site:open.spotify.com/track`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const html = await res.text();
    console.log(html.substring(0, 1000));
    const urls = html.match(/open\.spotify\.com(?:%2F|\/)track(?:%2F|\/)([a-zA-Z0-9]{22})/g);
    console.log("URLs:", urls);
}
test().catch(console.error);
