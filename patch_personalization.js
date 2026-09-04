import fs from 'fs';

const path = 'src/utils/personalizedRecommendations.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove The Weeknd Fallback
code = code.replace(
`  // Fallback to most popular artist from feed if no personalization yet
  if (!featuredArtist && fallbackFeed && Array.isArray(fallbackFeed.popularArtists) && fallbackFeed.popularArtists.length > 0) {
      const topApiArtist = fallbackFeed.popularArtists[0];
      featuredArtist = getOrCreateCatalog(topApiArtist.name, topApiArtist.id);
  }`,
`  // No fallback to The Weeknd if there is no user affinity.`
);

// 2. Score tracks properly to EXCLUDE history for Recommendations, but INCLUDE them for Start Listening.
// We have: const scoredTracks = allCatalogTracks.map(...)
// We should modify the scoring to heavily penalize history for "recommendedForToday"
// Actually, let's just make two arrays of scored tracks.
code = code.replace(
`  const scoredTracks = allCatalogTracks.map((track) => {`,
`  // Shuffle function
  const shuffle = (array) => {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex > 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  const scoredTracks = allCatalogTracks.map((track) => {`
);

fs.writeFileSync(path, code);
