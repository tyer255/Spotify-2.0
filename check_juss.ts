import ytSearch from 'yt-search';
(async () => {
  const r = await ytSearch('Safar Juss');
  console.log(r.videos[0].title, r.videos[0].timestamp);
})();
