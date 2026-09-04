import fetch from 'node-fetch';

async function test() {
    const q = `site:open.spotify.com/track "Dekha Tenu"`;
    
    const params = new URLSearchParams();
    params.append("q", q);
    
    const res = await fetch("https://lite.duckduckgo.com/lite/", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0",
        },
        body: params.toString()
    });
    
    const html = await res.text();
    // find all links
    const matches = html.match(/<a [^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g);
    if (matches) {
        for (const m of matches) {
            console.log(m);
        }
    }
}
test().catch(console.error);
