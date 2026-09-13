const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf-8');

// Replace youtube block
const oldYt = `      const searchResults = await ytSearch(query);
      const videos = searchResults?.videos || [];

      for (const vid of videos.slice(0, 3)) {
        const vidTitleLower = (vid.title || '').toLowerCase();
        const vidAuthorLower = (vid.author?.name || '').toLowerCase();

        // STRICT MATCHING
        const hasTitle = cleanT.split(' ').every(w => vidTitleLower.includes(w) || w.length < 3);
        const hasArtist = cleanA === '' ? true : cleanA.split(' ').some(w => w.length > 2 && (vidAuthorLower.includes(w) || vidTitleLower.includes(w)));
        
        if (hasTitle && hasArtist) {`;

const newYt = `      const searchResults = await ytSearch(query);
      let videos = searchResults?.videos || [];
      
      // Sort videos to heavily prefer "Topic" channels (official audio without intros)
      videos = videos.sort((a, b) => {
        const aTopic = (a.author?.name || '').toLowerCase().includes('- topic');
        const bTopic = (b.author?.name || '').toLowerCase().includes('- topic');
        if (aTopic && !bTopic) return -1;
        if (!aTopic && bTopic) return 1;
        
        // Also prefer videos that explicitly state "Audio" in title
        const aAudio = (a.title || '').toLowerCase().includes('audio');
        const bAudio = (b.title || '').toLowerCase().includes('audio');
        if (aAudio && !bAudio) return -1;
        if (!aAudio && bAudio) return 1;
        
        return 0;
      });

      for (const vid of videos.slice(0, 5)) {
        const vidTitleLower = (vid.title || '').toLowerCase();
        const vidAuthorLower = (vid.author?.name || '').toLowerCase();

        // STRICT MATCHING
        const hasTitle = cleanT.split(' ').every(w => vidTitleLower.includes(w) || w.length < 3);
        const hasArtist = cleanA === '' ? true : cleanA.split(' ').some(w => w.length > 2 && (vidAuthorLower.includes(w) || vidTitleLower.includes(w)));
        
        if (hasTitle && hasArtist) {`;

code = code.replace(oldYt, newYt);
fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
