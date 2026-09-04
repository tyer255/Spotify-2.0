import ytSearch from 'yt-search';
import fetch from 'node-fetch';

async function test() {
    const r = await ytSearch("Sajni Arijit Singh");
    console.log("Top videos:");
    for (const v of r.videos.slice(0, 5)) {
        console.log(v.videoId, v.title);
        const res = await fetch(`https://www.youtube.com/watch?v=${v.videoId}`);
        const html = await res.text();
        const spot = html.match(/open\.spotify\.com(?:%2F|\\\/|\/)track(?:%2F|\\\/|\/)([a-zA-Z0-9]{22})/);
        if (spot) {
            console.log("-> FOUND SPOTIFY ID:", spot[1]);
        }
    }
}
test().catch(console.error);
