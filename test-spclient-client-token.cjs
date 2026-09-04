const http = require('http');
async function run() {
    try {
        const fetch = (await import('node-fetch')).default;
        const clientId = 'c028a3f8fa79493eb0417becefe2a275';
        const clientSecret = '331c448bbcf44991820dd5e376a9a08e'; 
        const b64 = Buffer.from(clientId + ':' + clientSecret).toString('base64');
        const res = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + b64,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });
        const data = await res.json();
        const token = data.access_token;
        console.log("Token:", token.substring(0, 20) + "...");

        const trackId = "0VjIjW4GlUZAMYd2vXMi3b";
        const str = `spotify:track:${trackId}`;
        const enc = new TextEncoder();
        const strBytes = enc.encode(str);
        let entity = new Uint8Array([0x0A, strBytes.length, ...strBytes]);
        let request = new Uint8Array([0x0A, entity.length, ...entity]);
        
        const pathRes = await fetch("https://spclient.wg.spotify.com/canvaz-cache/v0/canvases", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/x-protobuf'
            },
            body: request
        });
        console.log("Status:", pathRes.status);
        const buf = await pathRes.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const txt = new TextDecoder().decode(bytes);
        const match = txt.match(/https?:\/\/[^\s\x00"]+\.mp4/);
        console.log("Canvas URL:", match ? match[0] : null);
    } catch (e) {
        console.error(e);
    }
}
run();
