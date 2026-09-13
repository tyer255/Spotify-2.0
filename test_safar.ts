import { AudioStreamResolver } from './server/services/AudioStreamResolver.js';
(async () => {
  const result = await AudioStreamResolver.resolveFullTrack('0q4442eIt44kTWEhkoTlh8', 'Safar', 'Bayaan, Sherazam', 217);
  console.log(JSON.stringify(result, null, 2));
})();
