import ytSearch from 'yt-search';
async function main() {
  const searchResults = await ytSearch("tere bina highborn");
  const videos = searchResults?.videos || [];
  for (const v of videos.slice(0, 10)) {
     console.log(`[YouTube] ${v.title} | Channel: ${v.author.name} | Dur: ${v.seconds} sec | ${v.duration}`);
  }
}
main().catch(console.error);
