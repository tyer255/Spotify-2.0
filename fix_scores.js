import fs from 'fs';
let code = fs.readFileSync('src/utils/personalizedRecommendations.ts', 'utf8');

// Replace the scoredTracks block
const regex = /\/\/ Shuffle function.*?scoredTracks\.sort\(\(a, b\) => b\.score - a\.score\);/s;

const newBlock = `  const scoredTracks = allCatalogTracks.map((track) => {
    const artKey = normalizeArtistKey(track.artist || track.artistId);
    const artAffinity = artistAffinityScores[artKey] || (followedSet.has(artKey) ? 50 : 0);
    const isFollowed = followedSet.has(artKey);
    const timesPlayed = trackPlayCounts[track.id] || 0;
    const isHistory = historyIds.has(track.id);

    let score = artAffinity * 2.0;
    if (isFollowed) score += 80;

    const trackArtist = findArtistInCatalog(track.artist);
    if (trackArtist && trackArtist.vibe === topVibe) score += 45;

    // For general recommendations, we PENALIZE already played tracks so we get new discoveries
    let recScore = score;
    if (isHistory) recScore -= 200; // Heavily penalize exact tracks we just listened to
    if (timesPlayed > 0) recScore -= 100;
    
    // Add randomness for variety
    recScore += Math.random() * 50;
    
    // Start Listening (Jump back in) score - favors what we recently played
    let startScore = score + (timesPlayed * 20);
    if (isHistory) startScore += 100;
    startScore += Math.random() * 20;

    return { track, recScore, startScore };
  });

  // Sort for Recommended (Unique discoveries based on affinity)
  const sortedForRecs = [...scoredTracks].sort((a, b) => b.recScore - a.recScore);
  // Sort for Start Listening (Recent favorites mixed with high affinity)
  const sortedForStart = [...scoredTracks].sort((a, b) => b.startScore - a.startScore);

  // Shuffle helper
  const shuffle = (array: any[]) => {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex > 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };`;

code = code.replace(regex, newBlock);
fs.writeFileSync('src/utils/personalizedRecommendations.ts', code);
