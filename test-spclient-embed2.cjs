async function run() {
    try {
        const fetch = (await import('node-fetch')).default;
        
        const trackId = "0VjIjW4GlUZAMYd2vXMi3b"; // Blinding Lights
        const embedRes = await fetch(`https://open.spotify.com/embed/track/${trackId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = await embedRes.text();
        const match = html.match(/"accessToken":"([^"]+)"/);
        const token = match[1];
        
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
        const buf = await pathRes.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const txt = new TextDecoder().decode(bytes);
        console.log("Hex:", Buffer.from(bytes).toString('hex'));
        console.log("String:", txt.replace(/[^ -~]/g, '.'));
    } catch (e) {
        console.error(e);
    }
}
run();
