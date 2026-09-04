import fetch from 'node-fetch';
import spotifyUrlInfo from 'spotify-url-info';
const spotify = spotifyUrlInfo(fetch);

async function run() {
  const url = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'; // Today's Top Hits
  try {
      const tracks = await spotify.getTracks(url);
      if (tracks && tracks.length > 0) {
          console.log("Track 1 keys:", Object.keys(tracks[0]));
          console.log("Track 1:", tracks[0]);
      }
  } catch(e) {
      console.log(e);
  }
}
run();
