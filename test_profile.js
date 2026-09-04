import { SpotifyCanvasService } from './server/services/spotifyCanvasService.ts';

async function run() {
    const start = Date.now();
    const res = await SpotifyCanvasService.getCanvasForTrack({ title: "Angaaron", artist: "" });
    console.log("Time:", Date.now() - start, "ms");
    console.log("Result:", res.status);
}
run().catch(console.error);
