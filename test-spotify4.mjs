import fetch from 'node-fetch';
import spotifyUrlInfo from 'spotify-url-info';
const spotify = spotifyUrlInfo(fetch);

async function run() {
  const url = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'; // Today's Top Hits
  try {
      const details = await spotify.getDetails(url);
      console.log("Details keys:", Object.keys(details));
      if (details.tracks && details.tracks.length > 0) {
          console.log("Track 1:", Object.keys(details.tracks[0]));
          console.log("Track 1 Album:", details.tracks[0].album);
      }
      // Print preview
      console.log("Preview keys:", Object.keys(details.preview));
  } catch(e) {
      console.log("Error:", e.message);
  }
}
run();
