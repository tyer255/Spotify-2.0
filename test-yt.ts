(async () => {
  const ytSearch = (await import('yt-search')).default;
  const searchResults = await ytSearch("Chehre AUR song");
  if (searchResults.videos) {
    searchResults.videos.slice(0, 5).forEach((v: any) => {
      console.log(v.title, "|", v.author.name);
    });
  }
})();
