import { SpotifyCanvasService } from './server/services/spotifyCanvasService.ts';

async function run() {
    console.log("Testing Angaaron Canvas Resolution...");
    const res = await SpotifyCanvasService.getCanvasForTrack({ 
        title: "Angaaron (From \"Pushpa 2 the Rule\")", 
        artist: "Shreya Ghoshal, Raqueeb Alam",
        trackId: "" 
    });
    console.log(JSON.stringify(res, null, 2));
}
run().catch(console.error);
