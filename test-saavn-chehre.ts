(async () => {
  const q = encodeURIComponent(`Chehre AUR`.trim());
  const searchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${q}&p=1&n=15&_format=json&_marker=0&api_version=4&ctx=web6dot0`;
  const data = await fetch(searchUrl).then(r => r.json());
  if (data.results) {
    data.results.forEach((r: any) => {
      console.log(r.title, "|", r.subtitle, "|", r.more_info?.singers);
    });
  }
})();
