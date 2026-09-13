import { OpenMusicProvider } from './server/providers/OpenMusicProvider.ts';
(async () => {
  const p = new OpenMusicProvider();
  const track = await p.getTrack('saavn-sDqkyo85'); // Or some saavn track
  console.log(track);
})();
