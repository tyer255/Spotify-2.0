import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

async function test() {
    try {
        console.log("Fetching proxy list...");
        const proxyListRes = await fetch('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=3000&country=all&ssl=all&anonymity=all');
        const proxyListText = await proxyListRes.text();
        const proxies = proxyListText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
        
        console.log(`Found ${proxies.length} proxies. Testing...`);
        for (const proxy of proxies.slice(0, 15)) {
            const proxyUrl = `http://${proxy}`;
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
                    console.log("SUCCESS!", data.accessToken.substring(0, 50) + "...");
                    return;
                }
            } catch(e) {
                console.log("Failed:", e.message);
            }
        }
    } catch(e) { console.error(e); }
}
test();
