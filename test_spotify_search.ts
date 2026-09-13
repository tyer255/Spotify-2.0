import { spotifySearchService } from './server/services/spotifySearchService.ts';
(async () => {
  const results = await spotifySearchService.search("Jhol");
  if (results && results.songs && results.songs.length > 0) {
    const song = results.songs[0];
    console.log(song.title);
    console.log(song.images);
  }
})();
