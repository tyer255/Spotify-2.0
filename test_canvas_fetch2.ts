import { MusicService } from './server/services/musicService.ts';
import { SpotifyCanvasService } from './server/services/spotifyCanvasService.ts';

(async () => {
  const result = await MusicService.search("Jhol Maanu Annural");
  if (result.songs.length > 0) {
    const track = result.songs[0];
    console.log(track.id, track.title);
    const canvas = await SpotifyCanvasService.getCanvasForTrack(track);
    console.log(canvas);
  }
})();
