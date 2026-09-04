async function run() {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch("https://open.spotify.com/get_access_token?reason=transport&productType=web_player", {
        headers: { 
            'User-Agent': 'Mozilla/5.0',
            'Cookie': 'sp_dc=invalid_dummy_cookie_test'
        }
    });
    console.log(res.status);
    const text = await res.text();
    console.log(text.substring(0, 50));
}
run();
