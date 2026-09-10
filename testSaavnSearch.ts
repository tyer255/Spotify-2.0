async function run() {
  const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=Lily+Alan+Walker&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=10&p=1`;
  const res = await fetch(url).then(r => r.json());
  if (res.results) {
      console.log(JSON.stringify(res.results.map((s:any) => ({title: s.title, artist: s.more_info.primary_artists})), null, 2));
  } else {
      console.log("No results:", res);
  }
}
run();
