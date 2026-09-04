import fetch from 'node-fetch';

async function test() {
    try {
        const response = await fetch("https://open.spotify.com/");
        const text = await response.text();
        const match = text.match(/"accessToken":"(.+?)"/);
        if (match) {
            console.log("SUCCESS!", match[1]);
        } else {
            console.log("No token found in HTML. HTML length:", text.length);
        }
    } catch(e) { console.error(e); }
}
test();
