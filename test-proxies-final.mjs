import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

async function test() {
    try {
        console.log("Fetching proxy list...");
        const proxyListRes = await fetch('https://proxylist.geonode.com/api/proxy-list?limit=15&page=1&sort_by=lastChecked&sort_type=desc&protocols=http%2Chttps');
        const json = await proxyListRes.json();
        const proxies = json.data || [];
        
        console.log(`Found ${proxies.length} proxies.`);
        for (const proxy of proxies) {
            try {
                const proxyUrl = `http://${proxy.ip}:${proxy.port}`;
                console.log("Trying:", proxyUrl);
                const agent = new HttpsProxyAgent(proxyUrl);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                
                const res = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
                    agent,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (res.ok) {
                    const text = await res.text();
                    if (!text.trim().startsWith('<')) {
                        const data = JSON.parse(text);
                        if (data.accessToken) {
                            console.log(`SUCCESS! Token length: ${data.accessToken.length}`);
                            return;
                        }
                    } else {
                        console.log("Failed: WAF block");
                    }
                } else {
                    console.log(`Failed: HTTP ${res.status}`);
                }
            } catch(e) {
                console.log("Failed:", e.message);
            }
        }
    } catch(e) {
        console.error(e);
    }
}
test();
