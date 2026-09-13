import { SpotifySearchService } from './server/services/spotifySearchService.ts';
(async () => {
  const token = await (new SpotifySearchService() as any).getAccessToken(); // Wait, let's use search and intercept parseTrack.
})();
