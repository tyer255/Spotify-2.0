import fetch from 'node-fetch';
import spotifyUrlInfo from 'spotify-url-info';
const spotify = spotifyUrlInfo(fetch);

async function run() {
  const url = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'; // Today's Top Hits
  const data = await spotify.getData(url);
  console.log("Playlist Image:", data.coverArt?.sources?.[0]?.url);
  if (data.trackList && data.trackList.length > 0) {
    console.log("Track 1:", JSON.stringify(data.trackList[0], null, 2));
  }
}
run();
