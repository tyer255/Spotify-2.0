async function run() {
    const fetch = (await import('node-fetch')).default;
    const { HttpsProxyAgent } = await import('https-proxy-agent');
    
    // Fetch fresh proxies
    console.log("Fetching proxies...");
    const res = await fetch('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=5000&country=all&ssl=all&anonymity=all');
    const text = await res.text();
    const proxies = text.split('\n').map(p => p.trim()).filter(p => p.length > 5).slice(0, 50);
    
    console.log(`Testing ${proxies.length} proxies...`);
    
    const promises = proxies.map(p => {
        return new Promise(async (resolve) => {
            const controller = new AbortController();
            const tid = setTimeout(() => { controller.abort(); resolve(null); }, 3000);
            try {
                const agent = new HttpsProxyAgent('http://' + p);
                const tokenRes = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
                    agent,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                    signal: controller.signal
                });
                if (tokenRes.ok) {
                    const data = await tokenRes.json();
                    resolve(data.accessToken);
                } else {
                    resolve(null);
                }
            } catch(e) {
                resolve(null);
            } finally {
                clearTimeout(tid);
            }
        });
    });
    
    const firstToken = await Promise.race(promises.filter(p => p !== null));
    console.log("Got token?", !!firstToken, firstToken ? firstToken.substring(0,20) : "");
}
run();
