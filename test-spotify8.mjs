import fetch from 'node-fetch';
import spotifyUrlInfo from 'spotify-url-info';
const spotify = spotifyUrlInfo(fetch);

async function run() {
  const url = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'; 
  const details = await spotify.getDetails(url);
  console.log(JSON.stringify(details.tracks[0], null, 2));
}
run();
