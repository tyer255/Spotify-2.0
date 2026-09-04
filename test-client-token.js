async function run() {
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
    console.log("Token:", data.access_token);
    
    // Now test it against pathfinder
    const trackId = "0VjIjW4GlUZAMYd2vXMi3b";
    const query = {
      operationName: 'getTrackCanvas',
      variables: JSON.stringify({ uri: `spotify:track:${trackId}` }),
      extensions: JSON.stringify({
        persistedQuery: { version: 1, sha256Hash: '52c502b4fa96b4bf62eec4c54cb4321da3b94206587c4cf9c898c60bc9f9fdfd' }
      })
    };
    const url = new URL('https://api-partner.spotify.com/pathfinder/v1/query');
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, v));
    const pathRes = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
        'User-Agent': 'Mozilla/5.0'
      }
    });
    console.log("Pathfinder:", await pathRes.text());
}
run();
