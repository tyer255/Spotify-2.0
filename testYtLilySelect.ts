import { calculateStrictMatchScore } from './server/services/AudioStreamResolver';
import ytSearch from 'yt-search';

async function run() {
  const target = { title: "Lily", artist: "Alan Walker", duration: 195 };
  const q = 'Lily Alan Walker official audio';
  const searchResults = await ytSearch(q);
  
  const verifiedVideos: any[] = [];
  const unverifiedVideos: any[] = [];
  
  for (const vid of searchResults.videos.slice(0, 8)) {
    const dur = vid.seconds || 0;
    const cand = { title: vid.title, artist: vid.author?.name || '', duration: dur };
    const verification = calculateStrictMatchScore(cand, target);
    console.log(`[${dur}s] ${vid.title} | Verified: ${verification.verified}, Score: ${verification.score}, Reason: ${verification.reason}`);
    
    if (verification.verified && dur >= 30) {
      verifiedVideos.push({ vid, score: verification.score });
    } else if (dur >= 30) {
      unverifiedVideos.push({ vid, score: verification.score });
    }
  }
  
  let bestVideo = null;
  if (verifiedVideos.length > 0) {
    verifiedVideos.sort((a, b) => b.score - a.score);
    bestVideo = verifiedVideos[0].vid;
    console.log("BEST VIDEO (VERIFIED):", bestVideo.title);
  } else if (unverifiedVideos.length > 0) {
    bestVideo = unverifiedVideos[0].vid;
    console.log("BEST VIDEO (UNVERIFIED FALLBACK):", bestVideo.title);
  }
}
run();
