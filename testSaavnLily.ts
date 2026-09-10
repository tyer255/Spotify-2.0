import { calculateStrictMatchScore } from './server/services/AudioStreamResolver';

async function run() {
  const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=Alan+Walker+Lily&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=20&p=1`;
  const res = await fetch(url).then(r => r.json());
  
  const target = { title: "Lily", artist: "Alan Walker", duration: 195 };
  
  if (res.results) {
      for (const item of res.results) {
          const title = item.title;
          const artist = item.more_info.primary_artists || item.more_info.artistMap?.primary_artists?.map((a:any)=>a.name).join(', ');
          const dur = parseInt(item.more_info?.duration || '0', 10);
          const cand = { title, artist, duration: dur, primaryArtist: artist, album: item.more_info?.album || item.album };
          const verification = calculateStrictMatchScore(cand, target);
          console.log(`[${dur}s] ${artist} - ${title} | Verified: ${verification.verified}, Reason: ${verification.reason}`);
      }
  }
}
run();
