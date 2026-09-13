import { AudioStreamResolver } from './server/services/AudioStreamResolver.js';
(async () => {
  const result = await AudioStreamResolver.resolveFullTrack('test', 'Dark Horse', 'Katy Perry');
  console.log(JSON.stringify(result, null, 2));
})();
