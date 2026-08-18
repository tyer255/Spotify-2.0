import ytSearch from 'yt-search';
async function test() {
  const ytQuery = "Punjabi Kompa Tesher audio".trim();
  const searchResults = await ytSearch(ytQuery);
  console.log(searchResults.videos.map(v => v.title + " " + v.seconds).slice(0, 3));
}
test();
