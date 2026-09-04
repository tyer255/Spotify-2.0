import { SpotifyCanvasService } from './server/services/spotifyCanvasService.ts';

async function run() {
    console.log("Testing Angaaron...");
    const res = await SpotifyCanvasService.getCanvasForTrack({ title: "Angaaron (from pushpa 2)", artist: "" });
    console.log("Result:", res.status);
}
run().catch(console.error);
