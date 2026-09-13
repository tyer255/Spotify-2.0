import { AudioStreamResolver } from './server/services/AudioStreamResolver.js';

(async () => {
  const res = await AudioStreamResolver.resolveFullTrack("123", "Chehra", "AUR");
  console.log(JSON.stringify(res, null, 2));
})();
