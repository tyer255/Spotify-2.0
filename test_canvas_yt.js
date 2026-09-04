import { SpotifyCanvasService } from './server/services/spotifyCanvasService.ts';

async function test() {
    const res = await SpotifyCanvasService.getCanvasForTrack({
        title: "Dekha Tenu",
        artist: "Mohammad Faiz"
    });
    console.log(res);
}
test().catch(console.error);
