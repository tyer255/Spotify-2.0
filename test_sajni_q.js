import ytSearch from 'yt-search';
async function test() {
    const q = `Sajni Arijit Singh "open.spotify.com/track"`;
    const r = await ytSearch(q);
    console.log(r.videos.slice(0,3).map(v => v.videoId + " " + v.title));
}
test().catch(console.error);
