const http = require('http');
async function run() {
    try {
        const fetch = (await import('node-fetch')).default;
        
        // 1. Get Token
        const trackId = "0VjIjW4GlUZAMYd2vXMi3b";
        const embedRes = await fetch(`https://open.spotify.com/embed/track/${trackId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await embedRes.text();
        const match = html.match(/"accessToken":"([^"]+)"/);
        if (!match) throw new Error("No token found");
        const token = match[1];
        console.log("Got token:", token.substring(0, 20) + "...");
        
        // 2. Query Canvas
        const query = {
          operationName: 'getTrackCanvas',
          variables: JSON.stringify({ uri: `spotify:track:${trackId}` }),
          extensions: JSON.stringify({
            persistedQuery: { version: 1, sha256Hash: '52c502b4fa96b4bf62eec4c54cb4321da3b94206587c4cf9c898c60bc9f9fdfd' }
          })
        };
        const url = new URL('https://api-partner.spotify.com/pathfinder/v1/query');
        Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, v));
        const pathRes = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'Mozilla/5.0',
            'App-Platform': 'WebPlayer' // Try WebPlayer first
          }
        });
        console.log("Pathfinder WebPlayer status:", pathRes.status);
        console.log("Pathfinder WebPlayer text:", await pathRes.text());
        
    } catch (e) {
        console.error(e);
    }
}
run();
