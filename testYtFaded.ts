import ytSearch from 'yt-search';
async function run() {
  const r = await ytSearch('Faded Alan Walker official audio');
  r.videos.slice(0, 5).forEach(v => {
    console.log(`[${v.seconds}s] ${v.author.name} - ${v.title}`);
  });
}
run();
