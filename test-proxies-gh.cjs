async function run() {
    const fetch = (await import('node-fetch')).default;
    const { HttpsProxyAgent } = await import('https-proxy-agent');
    
    const proxies = [
        "103.170.185.226:80",
        "167.71.102.253:3128",
        "57.128.183.212:21",
        "198.37.121.63:6483",
        "109.199.119.16:80",
        "47.89.159.212:1080",
        "145.220.226.97:8080",
        "8.209.96.245:80",
        "201.238.248.134:443",
        "45.56.73.134:8080"
    ];
    
    for (const p of proxies) {
        console.log("Trying", p);
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 3000);
        try {
            const agent = new HttpsProxyAgent('http://' + p);
            const res = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
                agent,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: controller.signal
            });
            console.log("Success on", p, res.status);
            console.log(await res.text());
            break;
        } catch(e) {
            console.log("Failed", p, e.message);
        } finally {
            clearTimeout(tid);
        }
    }
}
run();
