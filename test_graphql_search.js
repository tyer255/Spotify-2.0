import fetch from 'node-fetch';

async function test() {
    // 1. Get embed token
    const res = await fetch(`https://open.spotify.com/embed/track/25Nxyrng0Z3jC5Q0hAibpw`);
    const text = await res.text();
    const token = text.match(/"accessToken":"([^"]+)"/)[1];
    console.log("Token length:", token.length);
    
    // 2. Query Pathfinder searchDesktop
    const query = encodeURIComponent("Dekha Tenu Mohammad Faiz");
    const url = `https://api-partner.spotify.com/pathfinder/v1/query?operationName=searchDesktop&variables=%7B%22searchTerm%22%3A%22Dekha%20Tenu%20Mohammad%20Faiz%22%2C%22offset%22%3A0%2C%22limit%22%3A10%2C%22numberOfTopResults%22%3A5%2C%22includeAudiobooks%22%3Afalse%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22123%22%7D%7D`;
    
    // We don't know the exact sha256Hash for searchDesktop.
    // Let's try the generic search query:
    const searchRes = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "App-Platform": "WebPlayer"
        }
    });
    console.log("Status:", searchRes.status);
    console.log(await searchRes.text());
}
test().catch(console.error);
