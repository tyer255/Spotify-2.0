import fetch from 'node-fetch';
async function run() {
  const oembedUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/track/7bxaFZ1O3cHkgLKMsdC3xR`;
  const res = await fetch(oembedUrl);
  console.log(res.status);
  const text = await res.text();
  console.log(text.substring(0, 200));
}
run();
