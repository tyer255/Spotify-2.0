const spotify = require('spotify-url-info')(require('node-fetch'));
async function test() {
  const data = await spotify.getData('https://open.spotify.com/track/2Fxmhks0bxGSBdJ92v4426');
  console.log(Object.keys(data));
  console.log(data);
}
test();
