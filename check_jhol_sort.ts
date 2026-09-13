import ytSearch from 'yt-search';
(async () => {
  const searchResults = await ytSearch('Jhol Maanu, Annural Khalid');
  let videos = searchResults?.videos || [];
  const trackName = 'Jhol';
  const expectedDuration = 266;

  videos = videos.sort((a, b) => {
    const aTopic = (a.author?.name || '').toLowerCase().includes('- topic');
    const bTopic = (b.author?.name || '').toLowerCase().includes('- topic');
    
    let scoreA = aTopic ? 50 : 0;
    let scoreB = bTopic ? 50 : 0;
    
    const aAudio = (a.title || '').toLowerCase().includes('audio');
    const bAudio = (b.title || '').toLowerCase().includes('audio');
    if (aAudio) scoreA += 20;
    if (bAudio) scoreB += 20;

    const originalTitleLower = (trackName || '').toLowerCase();
    const unwantedKeywords = ['acoustic', 'slowed', 'reverb', '8d', 'remix', 'mashup', 'female', 'cover', 'instrumental', 'karaoke', 'speed up', 'sped up', 'lofi', 'live', 'edit'];
    
    const penalize = (title: string) => {
        const lowerTitle = (title || '').toLowerCase();
        let penalty = 0;
        for (const kw of unwantedKeywords) {
            if (lowerTitle.includes(kw) && !originalTitleLower.includes(kw)) {
                penalty += 200; // heavy penalty
            }
        }
        return penalty;
    };

    scoreA -= penalize(a.title);
    scoreB -= penalize(b.title);
    
    if (expectedDuration) {
       const diffA = Math.abs((a.seconds || a.duration?.seconds || 0) - expectedDuration);
       const diffB = Math.abs((b.seconds || b.duration?.seconds || 0) - expectedDuration);
       
       if (diffA <= 3) scoreA += 150;
       else if (diffA <= 10) scoreA += 100;
       else if (diffA <= 30) scoreA += 50;
       
       if (diffB <= 3) scoreB += 150;
       else if (diffB <= 10) scoreB += 100;
       else if (diffB <= 30) scoreB += 50;
    }
    
    return scoreB - scoreA;
  });

  videos.slice(0, 10).forEach(v => console.log(v.title, v.timestamp, v.duration.seconds));
})();
