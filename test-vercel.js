async function run() {
    const fetch = (await import('node-fetch')).default;
    const res = await fetch("https://open.spotify.com/get_access_token?reason=transport&productType=web_player", {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    console.log(res.status);
}
run();
