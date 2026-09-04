import ytSearch from 'yt-search';
import fetch from 'node-fetch';

async function test() {
    const q = `"Dekha Tenu" Mohammad Faiz spotify`;
    const r = await ytSearch(q);
    const videos = r.videos.slice(0, 5);
    for (const v of videos) {
        console.log("Title:", v.title);
        const vId = v.videoId;
        const res = await fetch(`https://www.youtube.com/watch?v=${vId}`);
        const html = await res.text();
        const spot = html.match(/open\.spotify\.com(?:%2F|\\\/|\/)track(?:%2F|\\\/|\/)([a-zA-Z0-9]{22})/);
        if (spot) {
            console.log("Found Spotify:", spot[1]);
            return;
        }
    }
    console.log("Not found in YT");
}
test().catch(console.error);
