const fetch = require('node-fetch'); // or just use global fetch in Node 18+
async function test() {
  const url = 'https://scannables.spotify.com/api/v1/decode/07653245453123456743210?format=json';
  try {
      const res = await fetch(url);
      console.log(res.status, await res.text());
  } catch (e) { console.error(e); }
}
test();
