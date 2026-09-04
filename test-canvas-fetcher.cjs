async function run() {
    const fetch = (await import('node-fetch')).default;
    
    // 1. Get Token from Embed
    const trackId = "0VjIjW4GlUZAMYd2vXMi3b"; 
    const embedRes = await fetch(`https://open.spotify.com/embed/track/${trackId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await embedRes.text();
    const token = html.match(/"accessToken":"([^"]+)"/)[1];
    
    // 2. Fetch Canvas using spotify-canvas-fetcher
    const getCanvases = require('/tmp/spotify-canvas-fetcher/src/_canvasApi.js');
    try {
        const res = await getCanvases([{ track: { uri: "spotify:track:" + trackId } }], token);
        console.log("Canvas Response:", JSON.stringify(res, null, 2));
    } catch(e) {
        console.error("Error:", e);
    }
}
run();
