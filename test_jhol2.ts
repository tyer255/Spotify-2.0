import { OpenMusicProvider } from './server/providers/OpenMusicProvider.ts';
(async () => {
  const provider = new OpenMusicProvider();
  const results = await provider.search("Jhol");
  console.log(JSON.stringify(results.songs.slice(0, 2), null, 2));
})();
