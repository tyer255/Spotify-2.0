import { calculateStrictMatchScore } from './server/services/AudioStreamResolver';
import ytSearch from 'yt-search';

async function run() {
  const target = { title: "Faded", artist: "Alan Walker", duration: 212 };
  const q = 'Faded Alan Walker official audio';
  const searchResults = await ytSearch(q);
  
  for (const vid of searchResults.videos.slice(0, 5)) {
    const dur = vid.seconds || 0;
    const cand = { title: vid.title, artist: vid.author?.name || '', duration: dur };
    const verification = calculateStrictMatchScore(cand, target);
    console.log(`[${dur}s] ${vid.title} | Verified: ${verification.verified}, Score: ${verification.score}, Reason: ${verification.reason}`);
  }
}
run();
