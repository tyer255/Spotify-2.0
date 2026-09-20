import { AudioStreamResolver } from './server/services/AudioStreamResolver.ts';
import { safeFetchJson } from './server/utils/network.ts';

async function main() {
  const fetch = (await import('node-fetch')).default;
  const q = encodeURIComponent(`tere bina highborn`);
  const searchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${q}&p=1&n=15&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
  const searchData = await fetch(searchUrl).then(r => r.json());
  const results = searchData?.results || [];
  for (const entry of results) {
     const detailUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${entry.id}&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
     const detailData = await fetch(detailUrl).then(r => r.json());
     const dur = detailData?.songs?.[0]?.more_info?.duration;
     console.log(`[JioSaavn] ${entry.title} | Dur: ${dur} sec | ${Math.floor(Number(dur)/60)}:${Number(dur)%60}`);
  }
}
main().catch(console.error);
