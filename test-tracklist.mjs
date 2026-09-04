import fetch from 'node-fetch';
import spotifyUrlInfo from 'spotify-url-info';
const spotify = spotifyUrlInfo(fetch);

async function run() {
  const url = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M'; 
  const data = await spotify.getData(url);
  console.log(`Total tracks: ${data.trackList.length}`);
  let artworkCount = 0;
  for (let i = 0; i < data.trackList.length; i++) {
    const t = data.trackList[i];
    const img = t.image || t.thumbnail || t.albumArt || t.album?.images?.[0]?.url || t.coverArt?.sources?.[0]?.url;
    if (img) artworkCount++;
    if (i === 11 || i === 12 || i === 13) {
      console.log(`Track ${i + 1} artwork keys:`, Object.keys(t).join(", "));
      if (t.coverArt) console.log(`Track ${i + 1} coverArt:`, t.coverArt);
    }
  }
  console.log(`Tracks with artwork: ${artworkCount}`);
}
run();
