import { AudioStreamResolver } from './server/services/AudioStreamResolver.js';

(async () => {
  const result = await AudioStreamResolver.resolveFullTrack('test', 'Daku', 'Oxin Films, Baste Sy');
  console.log(JSON.stringify(result, null, 2));
})();
