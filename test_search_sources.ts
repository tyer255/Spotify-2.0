import { SpotifySearchService } from './server/services/spotifySearchService.ts';
(async () => {
  const result = await SpotifySearchService.search("Jhol");
  if (result.songs.length > 0) {
    const images = result.songs[0].images;
    console.log("Images for top song:", images);
  }
})();
