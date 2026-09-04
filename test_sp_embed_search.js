import fetch from 'node-fetch';

async function test() {
    const res = await fetch(`https://open.spotify.com/embed/track/34Fh4HXZmnuBdtgejWUZg2`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    const tokenMatch = html.match(/"accessToken":"([^"]+)"/);
    if (tokenMatch) {
        const token = tokenMatch[1];
        console.log("Got embed token:", token.substring(0, 15));
        
        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=Sajni&type=track&limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("Search status:", searchRes.status);
        if (searchRes.ok) {
            console.log("Search success:", (await searchRes.json()).tracks.items[0].id);
        } else {
            console.log("Search error:", await searchRes.text());
        }
    }
}
test().catch(console.error);
