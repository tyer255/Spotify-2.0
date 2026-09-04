const fetch = require('node-fetch');
async function run() {
  const res = await fetch('https://api.allorigins.win/raw?url=https%3A%2F%2Fopen.spotify.com%2Fget_access_token%3Freason%3Dtransport%26productType%3Dweb_player');
  const text = await res.text();
  console.log(text);
}
run();
