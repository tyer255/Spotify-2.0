const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

async function run() {
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  console.log("Got client credentials token");
  
  // Try canvaz endpoint
  // Using hardcoded protobuf bytes for track 6Hab0kEiGl1i4xQe2kYyQx -> spotify:track:6Hab0kEiGl1i4xQe2kYyQx
  // Protobuf: 0a240a2273706f746966793a747261636b3a36486162306b4569476c316934785165326b59795178
  const reqBytes = Buffer.from('0a240a2273706f746966793a747261636b3a36486162306b4569476c316934785165326b59795178', 'hex');
  const res = await fetch('https://spclient.wg.spotify.com/canvaz-cache/v0/canvases', {
    method: 'POST',
    headers: {
      'accept': 'application/protobuf',
      'content-type': 'application/x-www-form-urlencoded',
      'authorization': 'Bearer ' + token
    },
    body: reqBytes
  });
  console.log(res.status, res.statusText);
  if (!res.ok) console.log(await res.text());
}
run();
