import { OpenMusicProvider } from './server/providers/OpenMusicProvider.ts';
(async () => {
  const provider = new OpenMusicProvider();
  const results = await provider.search("Jhol");
  console.log("Search Results:");
  results.forEach(r => console.log(r.title, r.images));
})();
