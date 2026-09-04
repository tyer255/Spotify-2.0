import { resolveMissingSpotifyThumbnails } from './server/services/spotifyThumbnailExtractor';

async function run() {
  const tracks = Array.from({ length: 50 }, (_, i) => ({
    id: `track-${i}`,
    title: `Song ${i}`,
    image: '',
    images: { large: '' }
  }));
  console.log("Starting...");
  const start = Date.now();
  const res = await resolveMissingSpotifyThumbnails(tracks, 'track');
  console.log("Finished in", Date.now() - start, "ms");
  let ok = 0;
  for (let r of res) {
    if (r.image) ok++;
  }
  console.log(`Resolved: ${ok}/${res.length}`);
}
run();
