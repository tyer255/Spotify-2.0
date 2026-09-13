const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf-8');

const searchRegex = /const searchResults = await ytSearch\(query\);[\s\S]*?for \(const vid of videos.slice\(0, 5\)\) \{/;

const replacement = `const searchResults = await ytSearch(query);
      let videos = searchResults?.videos || [];
      
      // Sort videos to heavily prefer "Topic" channels (official audio without intros)
      // and also prefer videos that match the expected duration.
      videos = videos.sort((a, b) => {
        const aTopic = (a.author?.name || '').toLowerCase().includes('- topic');
        const bTopic = (b.author?.name || '').toLowerCase().includes('- topic');
        
        let scoreA = aTopic ? 50 : 0;
        let scoreB = bTopic ? 50 : 0;
        
        const aAudio = (a.title || '').toLowerCase().includes('audio');
        const bAudio = (b.title || '').toLowerCase().includes('audio');
        if (aAudio) scoreA += 20;
        if (bAudio) scoreB += 20;
        
        if (expectedDuration) {
           const diffA = Math.abs((a.seconds || a.duration?.seconds || 0) - expectedDuration);
           const diffB = Math.abs((b.seconds || b.duration?.seconds || 0) - expectedDuration);
           
           if (diffA < 10) scoreA += 100;
           else if (diffA < 30) scoreA += 50;
           
           if (diffB < 10) scoreB += 100;
           else if (diffB < 30) scoreB += 50;
        }
        
        return scoreB - scoreA;
      });

      for (const vid of videos.slice(0, 8)) {`;

code = code.replace(searchRegex, replacement);
fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
