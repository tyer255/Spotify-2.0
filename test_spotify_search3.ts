import { SpotifySearchService } from './server/services/spotifySearchService.ts';
(async () => {
  const results = await SpotifySearchService.search("Jhol", 1);
  if (results && results.songs && results.songs.length > 0) {
    const song = results.songs[0];
    console.log(song.title);
    console.log(song.images);
  } else {
    console.log("No songs found");
  }
})();
