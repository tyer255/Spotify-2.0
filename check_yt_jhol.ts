import ytSearch from 'yt-search';
(async () => {
  const r = await ytSearch('Jhol Maanu, Annural Khalid');
  r.videos.slice(0, 10).forEach(v => console.log(v.title, v.timestamp, v.duration, v.author.name));
})();
