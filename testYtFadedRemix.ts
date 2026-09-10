import { calculateStrictMatchScore } from './server/services/AudioStreamResolver';

async function run() {
  const target = { title: "Faded (Dash Berlin Remix)", artist: "Alan Walker", duration: 212 };
  const cand = { title: "Alan Walker - Faded", artist: "Alan Walker", duration: 213 };
  
  const verification = calculateStrictMatchScore(cand, target);
  console.log(`Verified: ${verification.verified}, Score: ${verification.score}, Reason: ${verification.reason}`);
}
run();
