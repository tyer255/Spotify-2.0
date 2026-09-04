import fetch from 'node-fetch';
import spotifyUrlInfo from 'spotify-url-info';
const spotify = spotifyUrlInfo(fetch);
async function run() {
  let url = "https://open.spotify.com/s/i1kUv78";
  
  const res = await fetch(url, { method: 'GET', redirect: 'follow' });
  const text = await res.text();
  const match = text.match(/<meta property="og:url" content="([^"]+)"\s*\/>/i) || text.match(/<meta property="og:url" content="([^"]+)"/i);
  if (match) {
    url = match[1];
    console.log("Extracted URL:", url);
  }
  
  try {
    const data = await spotify.getData(url);
    console.log("Data type:", data.type);
    console.log("Data name:", data.name);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
