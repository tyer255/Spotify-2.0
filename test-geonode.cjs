const http = require('http');
const https = require('https');
const url = require('url');

async function test() {
    try {
        const fetch = (await import('node-fetch')).default;
        console.log("Fetching proxies...");
        const proxyListRes = await fetch('https://proxylist.geonode.com/api/proxy-list?limit=5&page=1&sort_by=lastChecked&sort_type=desc&protocols=http%2Chttps');
        const json = await proxyListRes.json();
        const proxies = json.data || [];
        console.log("Got proxies:", proxies.length);
        
        for (const proxy of proxies) {
            console.log("Trying proxy", proxy.ip, proxy.port, proxy.protocols);
            // ... (this takes a while, proxy servers are slow)
        }
    } catch(e) {
        console.error(e);
    }
}
test();
