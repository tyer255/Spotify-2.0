import fetch from 'node-fetch';
import 'dotenv/config';

async function test() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        console.log("No credentials found in .env");
        return;
    }
    
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });
    
    if (res.ok) {
        const data = await res.json();
        console.log("Got token");
        
        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=Tauba&type=track`, {
            headers: { Authorization: `Bearer ${data.access_token}` },
        });
        console.log("Search status:", searchRes.status, searchRes.statusText);
        const searchData = await searchRes.text();
        console.log("Search response:", searchData);
    } else {
        console.log("Failed to get token:", res.status, await res.text());
    }
}
test().catch(console.error);
