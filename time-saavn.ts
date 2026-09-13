(async () => {
  const s = Date.now();
  const search = await fetch("https://www.jiosaavn.com/api.php?__call=search.getResults&q=shape+of+you&p=1&n=15&_format=json&_marker=0&api_version=4&ctx=web6dot0").then(r => r.json());
  const id = search.results[0].id;
  const detail = await fetch(`https://www.jiosaavn.com/api.php?__call=song.getDetails&pids=${id}&_format=json&_marker=0&api_version=4&ctx=web6dot0`).then(r => r.json());
  console.log("JioSaavn full took:", Date.now() - s, "ms");
})();
