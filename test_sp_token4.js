import fetch from 'node-fetch';
async function test() {
    const res1 = await fetch('https://open.spotify.com');
    const cookies = res1.headers.raw()['set-cookie'] || [];
    const cookieStr = cookies.map(c => c.split(';')[0]).join('; ');
    console.log("Cookies:", cookieStr);
    
    const res = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
        headers: {
            "accept": "application/json",
            "cookie": cookieStr,
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        }
    });
    const text = await res.text();
    console.log(text.substring(0, 100));
}
test().catch(console.error);
