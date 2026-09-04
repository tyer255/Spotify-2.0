const play = require('play-dl');
async function test() {
    const res = await play.search("Arz Kiya Hai Anuv Jain short", { limit: 1 });
    if(res.length > 0) {
        console.log("Found:", res[0].title);
        const info = await play.video_info(res[0].url);
        const format = info.format.find(f => f.hasVideo && !f.hasAudio && f.container === 'mp4');
        console.log("Video URL:", format ? format.url : "None");
    }
}
test();
