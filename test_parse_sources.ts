import { SpotifySearchService } from './server/services/spotifySearchService.ts';
(async () => {
  const result = await SpotifySearchService.getTrack("4XTgFBxBHN6var1BzAgE1m");
  console.log("Images:");
  console.log(result?.images);
})();
