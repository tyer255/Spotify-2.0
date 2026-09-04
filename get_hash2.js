import fetch from 'node-fetch';

async function test() {
    const res = await fetch("https://open.spotify.com/");
    const html = await res.text();
    const scripts = html.match(/<script[^>]+src="([^"]+)"/g) || [];
    
    for (const s of scripts) {
        const src = s.match(/src="([^"]+)"/)[1];
        if (!src.startsWith('http')) continue;
        const jsRes = await fetch(src);
        const js = await jsRes.text();
        const matches = js.match(/.{0,50}searchDesktop.{0,100}sha256Hash.{0,80}/g);
        if (matches) {
            console.log(matches);
            return;
        }
    }
    console.log("No match.");
}
test().catch(console.error);
