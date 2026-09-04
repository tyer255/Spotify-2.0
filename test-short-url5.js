import fetch from 'node-fetch';
import spotifyUrlInfo from 'spotify-url-info';
const spotify = spotifyUrlInfo(fetch);
async function run() {
  const url = "https://open.spotify.com/s/i1kUv78";
  try {
    const data = await spotify.getData(url);
    console.log("Data type:", data.type);
    console.log("Data name:", data.name);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
