import fetch from 'node-fetch';

async function test() {
    const res = await fetch(`https://open.spotify.com/embed/playlist/37i9dQZF1DX0XUfTFmNBRM`);
    const html = await res.text();
    const tracks = html.match(/"title":"([^"]+)","subtitle":"([^"]+)"[^}]+"uri":"spotify:track:([a-zA-Z0-9]{22})/g);
    if (tracks) {
        for (const t of tracks.slice(0, 5)) {
            console.log(t);
        }
    }
}
test().catch(console.error);
