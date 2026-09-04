import { SpotifyCanvasService } from './server/services/spotifyCanvasService.ts';

async function run() {
    try {
        const token = await (SpotifyCanvasService as any).getAccessToken("5HABzk8BiB4G08tBqnKeSU");
        const res = await fetch(`https://api.spotify.com/v1/tracks/5HABzk8BiB4G08tBqnKeSU`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        console.log("Track details for 5HABzk8BiB4G08tBqnKeSU:");
        console.log("Name:", data.name);
        console.log("Artists:", data.artists?.map((a: any) => a.name).join(", "));
        console.log("Album:", data.album?.name);
    } catch (e) { console.error(e); }
}
run();
