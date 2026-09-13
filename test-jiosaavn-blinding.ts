(async () => {
  const q = encodeURIComponent(`Blinding Lights The Weeknd`.trim());
  const searchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${q}&p=1&n=15&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
  const data = await fetch(searchUrl).then(r => r.json());
  console.log(JSON.stringify(data.results.map((r: any) => r.title)));
})();
