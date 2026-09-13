import ytSearch from 'yt-search';
(async () => {
  const r = await ytSearch('Safar song');
  r.videos.forEach(v => {
    if (v.timestamp === '3:36' || v.timestamp === '1:11') {
      console.log("MATCH:", v.title, v.timestamp, v.author.name);
    }
  });
})();
