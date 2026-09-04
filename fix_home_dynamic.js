import fs from 'fs';
let content = fs.readFileSync('src/views/HomeView.tsx', 'utf8');

const targetContent = `  useEffect(() => {
    let isMounted = true;
    
    if (!profile || !profile.recentHistory) return;
    const historyArtists = profile.recentHistory.map(t => t.track?.artist).filter(Boolean);
    const uniqueArtists = [...new Set(historyArtists)].slice(0, 4);
    
    if (uniqueArtists.length > 0) {
      Promise.all(uniqueArtists.map(a => api.search(a))).then(responses => {
        if (!isMounted) return;
        const newTracks: any[] = [];
        const seenIds = new Set(profile.recentHistory.map(t => t.track?.id).filter(Boolean)); 
        
        responses.forEach(res => {
          if (res.success && res.data && res.data.songs) {
            res.data.songs.forEach(t => {
              const titleL = t.title.toLowerCase();
              if (titleL.includes("punjabi kompa")) return;
              if (!seenIds.has(t.id) && newTracks.length < 50) {
                seenIds.add(t.id);
                newTracks.push(t);
              }
            });
          }
        });
        
        newTracks.sort((a, b) => {
          const yearA = a.releaseYear || (a.releaseDate ? parseInt(a.releaseDate.split('-')[0]) : 2020);
          const yearB = b.releaseYear || (b.releaseDate ? parseInt(b.releaseDate.split('-')[0]) : 2020);
          if (yearB !== yearA) return yearB - yearA;
          
          const playsA = a.plays || a.play_count || 0;
          const playsB = b.plays || b.play_count || 0;
          return playsB - playsA;
        });
        
        if (newTracks.length > 0) {
          setDynamicRecommended(newTracks.slice(0, 6));
        }
      }).catch(e => console.warn('Error fetching dynamic recs:', e));
    }
    return () => { isMounted = false; };
  }, [profile?.recentHistory]);`;

const replacementContent = `  useEffect(() => {
    let isMounted = true;
    
    if (!profile || !profile.recentHistory || profile.recentHistory.length === 0) return;
    
    const historyArtists = profile.recentHistory.map(t => t.track?.artist).filter(Boolean);
    const artistCounts = {};
    let maxCount = 0;
    let mostListenedArtist = historyArtists[0];
    
    historyArtists.forEach(a => {
      artistCounts[a] = (artistCounts[a] || 0) + 1;
      if (artistCounts[a] > maxCount) {
        maxCount = artistCounts[a];
        mostListenedArtist = a;
      }
    });
    
    if (mostListenedArtist) {
      api.search(mostListenedArtist).then(res => {
        if (!isMounted) return;
        const newTracks = [];
        const seenIds = new Set(profile.recentHistory.map(t => t.track?.id).filter(Boolean)); 
        
        if (res.success && res.data && res.data.songs) {
          res.data.songs.forEach(t => {
            const titleL = t.title.toLowerCase();
            if (titleL.includes("punjabi kompa")) return;
            // Only show tracks we haven't heard
            if (!seenIds.has(t.id) && newTracks.length < 50) {
              seenIds.add(t.id);
              newTracks.push(t);
            }
          });
        }
        
        newTracks.sort((a, b) => {
          const playsA = a.plays || a.play_count || 0;
          const playsB = b.plays || b.play_count || 0;
          return playsB - playsA;
        });
        
        if (newTracks.length > 0) {
          setDynamicRecommended(newTracks.slice(0, 6));
        }
      }).catch(e => console.warn('Error fetching dynamic recs:', e));
    }
    return () => { isMounted = false; };
  }, [profile?.recentHistory]);`;

if (content.includes(targetContent.split('\n')[0].trim())) {
  // Try to replace
  content = content.replace(targetContent, replacementContent);
  fs.writeFileSync('src/views/HomeView.tsx', content);
  console.log("Successfully replaced block.");
} else {
  console.log("Could not find exact block to replace.");
}

