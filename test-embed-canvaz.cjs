const canvaz = require('canvaz_api');
async function run() {
    const fetch = (await import('node-fetch')).default;
    
    // 1. Get Token from Embed
    const trackId = "0VjIjW4GlUZAMYd2vXMi3b"; 
    const embedRes = await fetch(`https://open.spotify.com/embed/track/${trackId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await embedRes.text();
    const token = html.match(/"accessToken":"([^"]+)"/)[1];
    console.log("Token:", token.substring(0, 10));
    
    // 2. Fetch Canvas using Canvaz API
    try {
        const url = await canvaz.get_canvas_for_track(trackId, token);
        console.log("Canvas URL:", url);
    } catch(e) {
        console.error("Error:", e);
    }
}
run();
