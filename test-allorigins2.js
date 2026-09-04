import fetch from 'node-fetch';

async function test() {
    try {
        const url = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://open.spotify.com/get_access_token?reason=transport&productType=web_player');
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });
        const text = await res.text();
        console.log("Response:", text.substring(0, 100));
    } catch(e) { console.error(e); }
}
test();
