import fetch from 'node-fetch';
import spotifyUrlInfo from 'spotify-url-info';
const spotify = spotifyUrlInfo(fetch);

async function run() {
  const url = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'; 
  const data = await spotify.getData(url);
  console.log("Full data:", JSON.stringify(data).substring(0, 1500));
}
run();
