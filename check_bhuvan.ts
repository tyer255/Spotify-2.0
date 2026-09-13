import ytSearch from 'yt-search';
(async () => {
  const r = await ytSearch('Safar Bhuvan Bam');
  console.log(r.videos[0].title, r.videos[0].timestamp);
  const r2 = await ytSearch('Safar music 3:36');
  console.log(r2.videos[0].title, r2.videos[0].timestamp);
})();
