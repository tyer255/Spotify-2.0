async function run() {
    const fetch = (await import('node-fetch')).default;
    const { HttpsProxyAgent } = await import('https-proxy-agent');
    const proxyUrl = 'http://104.218.199.231:16062';
    const agent = new HttpsProxyAgent(proxyUrl);
    
    console.log("Fetching via proxy...");
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    try {
        const res = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
            agent,
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: controller.signal
        });
        console.log(res.status);
        console.log(await res.text());
    } catch(e) {
        console.error(e.message);
    }
}
run();
