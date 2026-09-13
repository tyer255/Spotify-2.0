import ytSearch from 'yt-search';

(async () => {
  const r = await ytSearch("Chehra AUR song");
  console.log(r.videos.map(v => ({ title: v.title, author: v.author.name, id: v.videoId })).slice(0, 5));
})();
