import fetch from 'node-fetch';

async function test() {
    const res = await fetch(`https://open.spotify.com/embed/track/34Fh4HXZmnuBdtgejWUZg2`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await res.text();
    const tokenMatch = html.match(/"accessToken":"([^"]+)"/);
    if (!tokenMatch) return console.log("No token");
    const token = tokenMatch[1];
    
    // Test pathfinder
    const url = `https://api-partner.spotify.com/pathfinder/v1/query?operationName=searchDesktop&variables={"searchTerm":"Sajni Arijit","offset":0,"limit":10,"numberOfTopResults":5,"includeAudiobooks":true}&extensions={"persistedQuery":{"version":1,"sha256Hash":"c33b76a0841b9d4e56926f2868da56bd26c06a38b1f49622d147ff0f0c0f86d6"}}`;
    
    const searchRes = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("Pathfinder status:", searchRes.status);
    if (searchRes.ok) {
        console.log("Success!");
    } else {
        console.log(await searchRes.text());
    }
}
test().catch(console.error);
