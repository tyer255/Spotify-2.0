import fs from 'fs';

let code = fs.readFileSync('/app/applet/src/utils/searchRanker.ts', 'utf8');

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
    const diversityPenalty = 0; // Removed diversity penalty as we are dropping duplicates completely
    let isOriginalTrack = false;
    if (resolvedQ && resolvedQ.extractedSongTitle) {
      const trackArtistMatch = isArtistAliasMatch(item.track.artist, resolvedQ.entry.canonicalName);
      const trackTitleLower = item.track.title.toLowerCase();
      const extractedLower = resolvedQ.extractedSongTitle.toLowerCase();

      if (
        trackArtistMatch &&
        trackTitleLower.includes(extractedLower) &&`;

code = code.replace(
  /  \/\/ Apply intelligent diversity deduplication:[\s\S]*?        trackTitleLower\.includes\(extractedLower\) &&/g,
  replacement
);

fs.writeFileSync('/app/applet/src/utils/searchRanker.ts', code);
