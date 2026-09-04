import { SpotifyCanvasService } from './server/services/spotifyCanvasService.ts';

async function run() {
    console.log("TEST 1: Angaaron");
    let res = await SpotifyCanvasService.getCanvasForTrack({ title: "Angaaron", artist: "Shreya Ghoshal" });
    console.log("Angaaron Status:", res.status);
    
    console.log("\nTEST 2: Deva Deva");
    res = await SpotifyCanvasService.getCanvasForTrack({ title: "Deva Deva", artist: "Arijit Singh" });
    console.log("Deva Deva Status:", res.status, "Title:", res.title);
    
    console.log("\nTEST 3: Angaaron Again");
    res = await SpotifyCanvasService.getCanvasForTrack({ title: "Angaaron", artist: "Shreya Ghoshal" });
    console.log("Angaaron Status:", res.status);
}
run();
