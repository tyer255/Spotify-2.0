import fetch from 'node-fetch';
async function test() {
    // Generate an anonymous token from Spotify's public client API without any auth cookie!
    // Many open source projects use this trick.
    const res = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
    });
    const text = await res.text();
    console.log("Response:", text.substring(0, 100));
}
test().catch(console.error);
