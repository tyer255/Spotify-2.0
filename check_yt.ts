import ytSearch from 'yt-search';
(async () => {
  const r = await ytSearch('safar arijit singh');
  r.videos.slice(0, 5).forEach(v => console.log(v.title, v.timestamp, v.duration));
})();
