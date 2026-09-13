import { OpenMusicProvider } from './server/providers/OpenMusicProvider.ts';
(async () => {
  const p = new OpenMusicProvider();
  const feed = await p.getHomeFeed();
  console.log("QuickPicks first item images:", feed.quickPicks[0]?.images);
})();
