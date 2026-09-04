import re

with open('src/utils/personalizedRecommendations.ts', 'r') as f:
    code = f.read()

# 1. Remove The Weeknd fallback
code = code.replace(
"""  // Fallback to most popular artist from feed if no personalization yet
  if (!featuredArtist && fallbackFeed && Array.isArray(fallbackFeed.popularArtists) && fallbackFeed.popularArtists.length > 0) {
      const topApiArtist = fallbackFeed.popularArtists[0];
      featuredArtist = getOrCreateCatalog(topApiArtist.name, topApiArtist.id);
  }""",
"  // No fallback to The Weeknd. We only show true user affinity."
)

# 2. Fix Because You Listen To (remove generic vibe filler)
bad_because_block = """  if (becauseYouListenToTracks.length < 8) {
    for (const t of allCatalogTracks) {
      const art = findArtistInCatalog(t.artist);
      if (!becauseSeen.has(t.id) && art?.vibe === topVibe) {
        becauseSeen.add(t.id);
        becauseYouListenToTracks.push(t);
        if (becauseYouListenToTracks.length >= 8) break;
      }
    }
  }

  if (becauseYouListenToTracks.length < 8 && fallbackFeed && Array.isArray(fallbackFeed.popularSongs)) {
    for (const t of fallbackFeed.popularSongs) {
      if (!becauseSeen.has(t.id)) {
        becauseSeen.add(t.id);
        becauseYouListenToTracks.push(t);
        if (becauseYouListenToTracks.length >= 8) break;
      }
    }
  }

  if (becauseYouListenToTracks.length < 8) {
    for (const t of allCatalogTracks) {
      if (!becauseSeen.has(t.id)) {
        becauseSeen.add(t.id);
        becauseYouListenToTracks.push(t);
        if (becauseYouListenToTracks.length >= 8) break;
      }
    }
  }"""

code = code.replace(bad_because_block, "  // We only show tracks from the actual featured artist to maintain true personalization.")

# 3. Change Scoring to push unique tracks to recommendedForToday
# Find scoredTracks sorting
scored_tracks_block = """  const scoredTracks = allCatalogTracks.map((track) => {
    const artKey = normalizeArtistKey(track.artist || track.artistId);
    const artAffinity = artistAffinityScores[artKey] || (followedSet.has(artKey) ? 50 : 0);
    const isFollowed = followedSet.has(artKey);
    const timesPlayed = trackPlayCounts[track.id] || 0;

    let score = artAffinity * 2.0;
    if (isFollowed) score += 80;

    const trackArtist = findArtistInCatalog(track.artist);
    if (trackArtist && trackArtist.vibe === topVibe) score += 45;

    score += (timesPlayed * 15); 
    if (likedTracksList.some(l => l.id === track.id)) score += 100;
    
    // Add random noise so it feels dynamic
    score += Math.random() * 20;

    return { track, score };
  });

  scoredTracks.sort((a, b) => b.score - a.score);"""

new_scored_tracks = """  // Shuffle helper
  const shuffle = (array: any[]) => {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex > 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  const scoredTracks = allCatalogTracks.map((track) => {
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
  const sortedForStart = [...scoredTracks].sort((a, b) => b.startScore - a.startScore);"""

code = code.replace(scored_tracks_block, new_scored_tracks)

# Replace Recommended block
old_rec_block = """  const recTodaySet = new Set<string>();
  const recommendedForToday: Track[] = [];
  for (const item of scoredTracks) {
    if (!recTodaySet.has(item.track.id)) {
      recTodaySet.add(item.track.id);
      recommendedForToday.push(item.track);
      if (recommendedForToday.length >= 8) break;
    }
  }
  
  // Fill recommendedForToday from fallbackFeed if empty
  if (recommendedForToday.length < 8 && fallbackFeed && Array.isArray(fallbackFeed.quickPicks)) {
      fallbackFeed.quickPicks.forEach((t: Track) => {
          if (!recTodaySet.has(t.id)) {
              recTodaySet.add(t.id);
              recommendedForToday.push(t);
          }
      });
  }"""

new_rec_block = """  const recTodaySet = new Set<string>();
  const recommendedForToday: Track[] = [];
  for (const item of sortedForRecs) {
    if (!recTodaySet.has(item.track.id)) {
      recTodaySet.add(item.track.id);
      recommendedForToday.push(item.track);
      if (recommendedForToday.length >= 10) break;
    }
  }
  
  // Fill recommendedForToday from fallbackFeed if empty
  if (recommendedForToday.length < 10 && fallbackFeed && Array.isArray(fallbackFeed.trending)) {
      fallbackFeed.trending.forEach((t: Track) => {
          if (!recTodaySet.has(t.id)) {
              recTodaySet.add(t.id);
              recommendedForToday.push(t);
          }
      });
  }"""
code = code.replace(old_rec_block, new_rec_block)

# Replace Start Listening block
old_start_block = """  const startListeningSet = new Set<string>();
  const startListening: Track[] = [];

  // 1. First, pick from scoredTracks not in recTodaySet
  for (const item of scoredTracks) {
    if (!startListeningSet.has(item.track.id) && !recTodaySet.has(item.track.id)) {
      startListeningSet.add(item.track.id);
      startListening.push(item.track);
      if (startListening.length >= 6) break;
    }
  }

  // 2. If we need more to reach 6, pick from fallbackFeed.trending
  if (startListening.length < 6 && fallbackFeed && Array.isArray(fallbackFeed.trending)) {
    for (const t of fallbackFeed.trending) {
      if (!startListeningSet.has(t.id)) {
        startListeningSet.add(t.id);
        startListening.push(t);
        if (startListening.length >= 6) break;
      }
    }
  }

  // 3. If still needed, pick from fallbackFeed.quickPicks or popularSongs
  if (startListening.length < 6 && fallbackFeed && Array.isArray(fallbackFeed.quickPicks)) {
    for (const t of fallbackFeed.quickPicks) {
      if (!startListeningSet.has(t.id)) {
        startListeningSet.add(t.id);
        startListening.push(t);
        if (startListening.length >= 6) break;
      }
    }
  }

  // 4. If still needed, pick from allCatalogTracks
  if (startListening.length < 6) {
    for (const t of allCatalogTracks) {
      if (!startListeningSet.has(t.id)) {
        startListeningSet.add(t.id);
        startListening.push(t);
        if (startListening.length >= 6) break;
      }
    }
  }"""

new_start_block = """  const startListeningSet = new Set<string>();
  const startListening: Track[] = [];

  // 1. Pick from sortedForStart (which favors recent plays)
  for (const item of sortedForStart) {
    if (!startListeningSet.has(item.track.id) && !recTodaySet.has(item.track.id)) {
      startListeningSet.add(item.track.id);
      startListening.push(item.track);
      if (startListening.length >= 6) break;
    }
  }

  // 2. Fallbacks
  if (startListening.length < 6 && fallbackFeed && Array.isArray(fallbackFeed.quickPicks)) {
    const mixedPicks = shuffle([...fallbackFeed.quickPicks]);
    for (const t of mixedPicks) {
      if (!startListeningSet.has(t.id) && !recTodaySet.has(t.id)) {
        startListeningSet.add(t.id);
        startListening.push(t);
        if (startListening.length >= 6) break;
      }
    }
  }"""
code = code.replace(old_start_block, new_start_block)

# 4. becauseYouListenToArtistName = featuredArtist?.name || '';
code = code.replace("const becauseYouListenToArtistName = featuredArtist?.name || 'Great Artists';", "const becauseYouListenToArtistName = featuredArtist?.name || '';")

with open('src/utils/personalizedRecommendations.ts', 'w') as f:
    f.write(code)

print("Updated personalizedRecommendations.ts")
