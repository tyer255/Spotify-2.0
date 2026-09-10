import { search } from './server/providers/OpenMusicProvider'; // we can't easily import this, let's just make a fetch call

async function run() {
  const url = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&query=Alan+Walker+Lily&_format=json&_marker=0&ctx=web6dot0`;
  const res = await fetch(url).then(r => r.json());
  console.log(JSON.stringify(res.songs.data.slice(0, 3).map(s => ({id: s.id, title: s.title, artist: s.more_info.primary_artists})), null, 2));
}
run();
