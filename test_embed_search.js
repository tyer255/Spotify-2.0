import fetch from 'node-fetch';

async function test() {
    // 1. Get token from embed (use a known track ID)
    const trackId = '25Nxyrng0Z3jC5Q0hAibpw'; // Tauba Tauba
    const res = await fetch(`https://open.spotify.com/embed/track/${trackId}`);
    const text = await res.text();
    const tokenMatch = text.match(/"accessToken":"([^"]+)"/);
    if (!tokenMatch) {
        console.log("Failed to get token from embed");
        return;
    }
    const token = tokenMatch[1];
    console.log("Got token from embed!", token.substring(0, 15) + "...");
    
    // 2. Use it to search for another song (Dekha Tenu)
    const query = encodeURIComponent(`track: Dekha Tenu artist: Mohammad Faiz`);
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    
    console.log("Search status:", searchRes.status);
    if (searchRes.ok) {
        const data = await searchRes.json();
        const foundId = data.tracks.items[0]?.id;
        console.log("Found ID:", foundId);
    } else {
        console.log(await searchRes.text());
    }
}
test().catch(console.error);
