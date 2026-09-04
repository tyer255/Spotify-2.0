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
    console.log("Token:", data.access_token);
    if(data.access_token) {
        const query = {
            operationName: 'getTrackCanvas',
            variables: JSON.stringify({ uri: `spotify:track:5W2r4rPjM15Fv4yXl66L2I` }),
            extensions: JSON.stringify({
                persistedQuery: {
                    version: 1,
                    sha256Hash: '52c502b4fa96b4bf62eec4c54cb4321da3b94206587c4cf9c898c60bc9f9fdfd'
                }
            })
        };
        const url = new URL('https://api-partner.spotify.com/pathfinder/v1/query');
        Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, v));
        const canvasRes = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
            }
        });
        console.log("Canvas Res:", canvasRes.status);
        console.log(await canvasRes.text());
    }
}
test();
