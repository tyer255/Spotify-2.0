import { MusicService } from './server/services/musicService.ts';
(async () => {
  const result = await MusicService.search("Jhol");
  console.log(result.albums.map(a => `${a.id} - ${a.name}`));
})();
