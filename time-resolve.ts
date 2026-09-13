import { AudioStreamResolver } from './server/services/AudioStreamResolver.js';

(async () => {
  const start = Date.now();
  const res = await AudioStreamResolver.resolveFullTrack("123", "Shape of You", "Ed Sheeran");
  console.log("Time taken:", Date.now() - start, "ms");
  console.log(JSON.stringify(res, null, 2));
})();
