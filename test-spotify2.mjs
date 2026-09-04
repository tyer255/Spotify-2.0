import fetch from 'node-fetch';
import spotifyUrlInfo from 'spotify-url-info';
const spotify = spotifyUrlInfo(fetch);

async function run() {
  const url = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'; // Today's Top Hits
  const data = await spotify.getData(url);
  console.log("Keys:", Object.keys(data));
  console.log("type:", data.type);
  if (data.type === 'playlist' && data.tracks) {
      console.log("Has tracks?", !!data.tracks);
  }
}
run();
