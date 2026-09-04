import fetch from "node-fetch";
async function test() {
    const clientId = "d8a5ed958d274c2e8ee717e6a4b0971d"; // Spotify generic client id
    const clientSecret = "a5e8f2e20b3240219db1d604e386ccf5"; // generic
    const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64")
        },
        body: "grant_type=client_credentials"
    });
    const data = await res.json();
    console.log("Token:", data.access_token ? "ok" : "fail");
    
    if(data.access_token) {
        // Prepare proto payload
        // EntityCanvazRequest { entities: [{ entityUri: 'spotify:track:5W2r4rPjM15Fv4yXl66L2I' }] }
        // Simple manual proto encode since it's just one field:
        // message EntityCanvazRequest { repeated Entity entities = 1; }
        // message Entity { string entityUri = 1; }
        // string = "spotify:track:5W2r4rPjM15Fv4yXl66L2I" (36 chars) -> hex 24
        // Entity = 0a 24 (string bytes)
        // Request = 0a 26 (Entity bytes)
        const hex = "0a260a2473706f746966793a747261636b3a355732723472506a4d313546763479586c36364c3249";
        const body = Buffer.from(hex, "hex");
        
        const canvasRes = await fetch("https://gew1-spclient.spotify.com/canvaz-cache/v0/canvases", {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
                'Content-Type': 'application/x-protobuf'
            },
            body: body
        });
        console.log("Canvas Res:", canvasRes.status);
        if(canvasRes.ok) {
            const buf = await canvasRes.buffer();
            console.log("Response bytes:", buf.toString('hex'));
            console.log("Response ascii:", buf.toString('ascii'));
        }
    }
}
test();
