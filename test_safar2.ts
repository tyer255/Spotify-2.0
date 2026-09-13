import { AudioStreamResolver } from './server/services/AudioStreamResolver.js';
(async () => {
  const result = await AudioStreamResolver.resolveFullTrack('4BH3FzJwNvjDpL8J78NMYM', 'Safar (From "Jab Harry Met Sejal")', 'Pritam, Arijit Singh');
  console.log(JSON.stringify(result, null, 2));
})();
