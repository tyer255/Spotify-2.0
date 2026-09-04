async function run() {
    try {
        const fetch = (await import('node-fetch')).default;
        
        const trackId = "0VjIjW4GlUZAMYd2vXMi3b"; // Blinding Lights
        console.log("Fetching embed page for track", trackId);
        const embedRes = await fetch(`https://open.spotify.com/embed/track/${trackId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await embedRes.text();
        const match = html.match(/"accessToken":"([^"]+)"/);
        const token = match[1];
        console.log("Token:", token.substring(0, 10));
        
        const str = `spotify:track:${trackId}`;
        const enc = new TextEncoder();
        const strBytes = enc.encode(str);
        let entity = new Uint8Array([0x0A, strBytes.length, ...strBytes]);
        let request = new Uint8Array([0x0A, entity.length, ...entity]);
        
        const pathRes = await fetch("https://spclient.wg.spotify.com/canvaz-cache/v0/canvases", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/x-protobuf'
            },
            body: request
        });
        console.log("Status:", pathRes.status);
        const buf = await pathRes.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const txt = new TextDecoder().decode(bytes);
        
        // Regex to extract URL
        const urls = txt.match(/https?:\/\/[^\s\x00"]+/g);
        console.log("Found URLs:", urls);
        
        // Try another regex if not found
        if (!urls) {
             const allStrs = txt.match(/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]+/g);
             console.log("All strings:", allStrs.filter(s => s.length > 10));
        }
    } catch (e) {
        console.error(e);
    }
}
run();
