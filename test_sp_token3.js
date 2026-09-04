import fetch from 'node-fetch';
async function test() {
    const res = await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player', {
        headers: {
            "accept": "application/json",
            "accept-language": "en-US,en;q=0.9",
            "sec-ch-ua": "\"Google Chrome\";v=\"123\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"123\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        }
    });
    const text = await res.text();
    console.log(text.substring(0, 100));
}
test().catch(console.error);
