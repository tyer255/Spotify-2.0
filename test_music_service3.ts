import { MusicService } from './server/services/musicService.ts';
(async () => {
  const result = await MusicService.search("Jhol");
  console.log("Search:");
  console.log(result.songs[0]?.images);
})();
