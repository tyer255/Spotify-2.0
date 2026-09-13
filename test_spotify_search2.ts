import { SpotifySearchService } from './server/services/spotifySearchService.ts';
(async () => {
  const spotifySearchService = new SpotifySearchService();
  const results = await spotifySearchService.search("Jhol", "track", 1);
  if (results && results.songs && results.songs.length > 0) {
    const song = results.songs[0];
    console.log(song.title);
    console.log(song.images);
  } else {
    console.log("No songs found");
  }
})();
