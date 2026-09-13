import { AudioStreamResolver } from './server/services/AudioStreamResolver.js';
import ytSearch from 'yt-search';

(async () => {
  const cleanT = "daku";
  const cleanA = "oxin films baste sy";
  const query = `${cleanT} ${cleanA} audio`;
  console.log("Query:", query);
  const searchResults = await ytSearch(query);
  const videos = searchResults?.videos || [];
  console.log("YT results:", videos.slice(0, 5).map(v => ({ title: v.title, author: v.author?.name })));
})();
