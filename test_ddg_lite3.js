import fetch from 'node-fetch';

async function test() {
    const q = `site:open.spotify.com/track "Dekha Tenu"`;
    
    const params = new URLSearchParams();
    params.append("q", q);
    
    // DDG Lite doesn't block bots as aggressively if we mimic a real simple browser
    const res = await fetch("https://lite.duckduckgo.com/lite/", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Origin": "https://lite.duckduckgo.com",
            "Referer": "https://lite.duckduckgo.com/"
        },
        body: params.toString()
    });
    
    const html = await res.text();
    const match = html.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]{22})/);
    if (match) {
        console.log("Found:", match[1]);
    } else {
        console.log("Not found.");
        // Try searching by name in HTML
        console.log("Includes open.spotify?", html.includes("open.spotify"));
    }
}
test().catch(console.error);
