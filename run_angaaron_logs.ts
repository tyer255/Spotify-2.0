import { SpotifyCanvasService } from './server/services/spotifyCanvasService.ts';

async function run() {
    console.log("Fetching Angaaron...");
    const res = await SpotifyCanvasService.getCanvasForTrack({
        title: "Angaaron",
        artist: "Shreya Ghoshal"
    });
    console.log(JSON.stringify(res, null, 2));
}
run();
