import { SpotifySearchService } from './server/services/spotifySearchService.ts';
(async () => {
  const t = await SpotifySearchService.getTrack("4XTgFBxBHN6var1BzAgE1m");
  console.log(t?.images);
})();
