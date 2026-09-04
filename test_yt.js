import ytSearch from 'yt-search';

async function test() {
    const q = `"Dekha Tenu" Mohammad Faiz spotify`;
    const r = await ytSearch(q);
    const videos = r.videos.slice(0, 5);
    for (const v of videos) {
        console.log("Title:", v.title);
        // ytSearch doesn't always return the full description in the search results
        // We might need to fetch the video page to get the description
        const vId = v.videoId;
        const res = await fetch(`https://www.youtube.com/watch?v=${vId}`);
        const html = await res.text();
        const spot = html.match(/open\.spotify\.com(?:%2F|\/)track(?:%2F|\/)([a-zA-Z0-9]{22})/);
        if (spot) {
            console.log("Found Spotify:", spot[1]);
        }
    }
}
test().catch(console.error);
