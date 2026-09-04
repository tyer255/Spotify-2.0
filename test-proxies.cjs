const FreeProxy = require('free-proxy');
const fetch = require('node-fetch').default || require('node-fetch');
const { HttpsProxyAgent } = require('https-proxy-agent');

async function test() {
    try {
        const proxyList = new FreeProxy();
        const proxies = await proxyList.get();
        console.log(`Found ${proxies.length} proxies`);
        for (const proxy of proxies.slice(0, 15)) {
            const proxyUrl = `http://${proxy.ip}:${proxy.port}`;
            console.log("Trying proxy:", proxyUrl);
            try {
                const agent = new HttpsProxyAgent(proxyUrl);
                const res = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
                    agent,
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 4000
                });
                const text = await res.text();
                const data = JSON.parse(text);
                if (data.accessToken) {
                    console.log("SUCCESS!", data.accessToken.substring(0, 50));
                    return;
                }
            } catch(e) {
                console.log("Failed");
            }
        }
    } catch(e) {
        console.error(e);
    }
}
test();
