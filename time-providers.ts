import { AudioStreamResolver } from './server/services/AudioStreamResolver.js';

(async () => {
  const ytSearch = (await import('yt-search')).default;
  const start = Date.now();
  
  const p1 = (async () => {
     const s = Date.now();
     const res = await fetch("https://www.jiosaavn.com/api.php?__call=search.getResults&q=shape+of+you&p=1&n=15&_format=json&_marker=0&api_version=4&ctx=web6dot0").then(r => r.json());
     console.log("JioSaavn search took:", Date.now() - s, "ms");
  })();

  const p2 = (async () => {
     const s = Date.now();
     await ytSearch("shape of you ed sheeran audio");
     console.log("YouTube search took:", Date.now() - s, "ms");
  })();

  await Promise.all([p1, p2]);
})();
