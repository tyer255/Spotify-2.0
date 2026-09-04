import fetch from 'node-fetch';
async function run() {
  const url = "https://open.spotify.com/s/i1kUv78";
  const res = await fetch(url, { method: 'GET', redirect: 'follow' });
  const text = await res.text();
  console.log("Response text length:", text.length);
  // find if there is a meta refresh or something
  const matches = text.match(/<meta.*?>/g);
  console.log(matches ? matches.slice(0, 10) : "No meta tags");
}
run();
