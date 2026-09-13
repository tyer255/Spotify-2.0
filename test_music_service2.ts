import { MusicService } from './server/services/musicService.ts';
(async () => {
  const s = new MusicService();
  const result = await s.search("Jhol");
  console.log("Search:", result.songs[0]?.images);
})();
