import { spotifyCanvasService } from './server/services/spotifyCanvasService.ts';
(async () => {
  const result = await spotifyCanvasService.getCanvasForTrack({
    id: "spotify-track-6jPbb2q9a9bYv2G48m7mB6", // Jhol track ID? Let me search and get the real track ID first.
  });
  console.log(result);
})();
