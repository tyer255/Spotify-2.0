import { SpotifySearchService } from './server/services/spotifySearchService.ts';
(async () => {
  const results = await SpotifySearchService.search("Jhol", 1);
  console.log(results.songs[0].images);
})();
