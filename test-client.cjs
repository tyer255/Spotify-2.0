async function run() {
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
    console.log(await res.text());
}
run();
