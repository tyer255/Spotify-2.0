import { SpotifySearchService } from './server/services/spotifySearchService.ts';
(async () => {
  const token = await (new SpotifySearchService() as any).getAccessToken(); // No wait, getAccessToken doesn't work on new? Oh, I see it's tokenManager.
  // Wait, I can just use a fetch here.
})();
