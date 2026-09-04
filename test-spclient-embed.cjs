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
        
        // 2. Canvaz-cache Protobuf API
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
        const urlMatch = txt.match(/https?:\/\/[^\s\x00"]+\.mp4/);
        console.log("Canvas URL:", urlMatch ? urlMatch[0] : null);
    } catch (e) {
        console.error(e);
    }
}
run();
