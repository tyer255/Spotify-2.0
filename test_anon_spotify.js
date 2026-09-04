import fetch from 'node-fetch';

async function test() {
    // Get anon token
    const res = await fetch("https://open.spotify.com/get_access_token?reason=transport&productType=web_player", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
    });
    // Ah wait, get_access_token blocked for me earlier with 403 (Varnish).
    console.log(res.status);
}
test().catch(console.error);
