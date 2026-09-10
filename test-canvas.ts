import { SpotifyCanvasService } from './server/services/spotifyCanvasService.js';

(async () => {
  const result = await SpotifyCanvasService.getCanvasForTrack({
    title: 'Sahiba',
    artist: 'Aditya Rikhari',
    trackId: '123'
  });
  console.log(result);
})();
