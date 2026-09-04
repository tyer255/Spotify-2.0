import fetch from 'node-fetch';
async function run() {
  const url = "https://open.spotify.com/s/i1kUv78";
  const res = await fetch(url, { method: 'GET', redirect: 'follow' });
  console.log("Resolved URL:", res.url);
}
run();
