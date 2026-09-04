import fetch from 'node-fetch';
async function run() {
  const url = "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M";
  const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
  console.log("Resolved URL:", res.url);
}
run();
