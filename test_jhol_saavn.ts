import { OpenMusicProvider } from './server/providers/OpenMusicProvider.ts';
(async () => {
  const p = new OpenMusicProvider();
  const track = await p.getTrack('saavn-1sWP_sUIC'); // Wait, earlier I found saavn-5WP_sUIC. Let me just search again.
  const res = await p.search('Jhol Maanu');
  console.log("Images for Saavn:", res.songs[0].images);
})();
