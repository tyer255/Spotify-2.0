import { calculateStrictMatchScore } from './server/services/AudioStreamResolver';

const target = { title: "Lily", artist: "Alan Walker", duration: 195 }; // 3:15
const cand = { title: "Alan Walker - Lily ft. K-391 & Emelie Hollow (Official Lyric Video)", artist: "K-391", duration: 216 };

console.log(calculateStrictMatchScore(cand, target));
