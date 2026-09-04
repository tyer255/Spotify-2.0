const { Protobuf } = require('./node_modules/spotify-canvas/lib/Protobuf');

async function test() {
  const res = await fetch('https://api.codetabs.com/v1/proxy?quest=https://open.spotify.com/get_access_token?reason=transport&productType=web_player');
  const text = await res.text();
  console.log("Token via proxy:", text);
}
test();
