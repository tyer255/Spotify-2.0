import fs from 'fs';

let code = fs.readFileSync('src/utils/searchRanker.ts', 'utf8');

const replacement = `
  // Apply STRICT deduplication:
  // If a track has the exact same title & overlapping artist, drop the duplicate completely.
  const uniqueTracks = [];
  
  for (const item of scoredTracks) {
    const isDuplicate = uniqueTracks.some((existingItem) => {
      const existingTitle = cleanSearchTitle(existingItem.track.title);
      const newTitle = cleanSearchTitle(item.track.title);
      
      if (existingTitle === newTitle) {
        const artist1 = existingItem.track.artist.toLowerCase();
        const artist2 = item.track.artist.toLowerCase();
        if (artist1.includes(artist2) || artist2.includes(artist1)) {
          return true;
        }
      }
      return false;
    });

    if (!isDuplicate) {
      uniqueTracks.push(item);
    }
  }

  const diversified = [];
  const resolvedQ = resolveArtist(parsed.normalized);

  for (const item of uniqueTracks) {
    let isOriginalTrack = item.track.isOriginal || false;
`;

// Replace from `  // Apply intelligent diversity deduplication:` to `  for (const item of scoredTracks) {` (inclusive)
code = code.replace(
  /\/\/ Apply intelligent diversity deduplication:[\s\S]*?for \(const item of scoredTracks\) \{[\s\S]*?\/\/ Apply mild diversity penalty for 2nd\+ identical version by same artist/,
  replacement + "\n    // Removed diversity penalty as we are dropping duplicates completely"
);

// Oh wait, `cleanKey` and `count` were used. Let's do a precise replace.
