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
            "Origin": "https://lite.duckduckgo.com",
            "Referer": "https://lite.duckduckgo.com/"
        },
        body: params.toString()
    });
    
    const html = await res.text();
    console.log(html);
}
test().catch(console.error);
