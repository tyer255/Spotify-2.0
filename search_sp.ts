import { SpotifyMusicProvider } from './server/providers/SpotifyMusicProvider.ts';
import { SpotifyCanvasService } from './server/services/spotifyCanvasService.ts';

async function run() {
    try {
        const id = '5HABzk8BiB4G08tBqnKeSU';
        // Use yt-search as fallback to check what this id maps to
        const ytSearch = (await import('yt-search')).default;
        const res = await ytSearch('5HABzk8BiB4G08tBqnKeSU');
        console.log("YT Search results for 5HABzk8BiB4G08tBqnKeSU:");
        console.log(res.videos.slice(0, 3).map(v => v.title));
    } catch(e) {}
}
run();
