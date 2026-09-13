import { musicService } from './server/services/musicService.ts';
(async () => {
  const result = await musicService.search("Jhol");
  console.log("Search:");
  console.log(result.songs[0]?.images);
})();
