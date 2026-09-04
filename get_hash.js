import fetch from 'node-fetch';

async function test() {
    const res = await fetch("https://open.spotify.com/");
    const html = await res.text();
    
    // Find script tags
    const scripts = html.match(/<script[^>]+src="([^"]+)"/g);
    for (const s of scripts) {
        const src = s.match(/src="([^"]+)"/)[1];
        if (src.includes('search') || src.includes('main') || src.includes('vendor')) {
            const jsRes = await fetch(src);
            const js = await jsRes.text();
            
            // Look for searchDesktop hash
            const match = js.match(/searchDesktop.*?sha256Hash["']:\s*["']([a-f0-9]{64})["']/i);
            if (match) {
                console.log("Found hash:", match[1]);
                return;
            }
        }
    }
    console.log("Not found easily.");
}
test().catch(console.error);
