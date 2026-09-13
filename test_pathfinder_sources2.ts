import { SpotifySearchService } from './server/services/spotifySearchService.ts';
(async () => {
  const token = await new SpotifySearchService().getAccessToken();
  const res = await fetch(`https://api-partner.spotify.com/pathfinder/v1/query?operationName=getTrack&variables=%7B%22uri%22%3A%22spotify%3Atrack%3A4XTgFBxBHN6var1BzAgE1m%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22e101aead6d78faa11d75bec5e36385a07b2f1c4a0420932d374d89ee17c70dd6%22%7D%7D`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(JSON.stringify(data?.data?.trackUnion?.albumOfTrack?.coverArt, null, 2));
})();
