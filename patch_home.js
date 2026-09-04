import fs from 'fs';

let code = fs.readFileSync('src/views/HomeView.tsx', 'utf8');

// 1. Add state
code = code.replace(
  "const [dynamicFeaturedImage, setDynamicFeaturedImage] = useState<string>('');",
  "const [dynamicFeaturedImage, setDynamicFeaturedImage] = useState<string>('');\n  const [dynamicRecommended, setDynamicRecommended] = useState<Track[]>([]);"
);

// 2. Add useEffect for dynamic recommendations
const effectCode = `
  useEffect(() => {
    let isMounted = true;
    
    // Fetch dynamic recommendations based on history to ensure fresh, unplayed songs
    const historyArtists = profile.history.map(t => t.artist);
    // get unique artists, take up to 4
    const uniqueArtists = [...new Set(historyArtists)].slice(0, 4);
    
    if (uniqueArtists.length > 0) {
      Promise.all(uniqueArtists.map(a => api.search(a))).then(responses => {
        if (!isMounted) return;
        const newTracks = [];
        const seenIds = new Set(profile.history.map(t => t.id)); 
        
        responses.forEach(res => {
          if (res.success && res.data && res.data.songs) {
            res.data.songs.forEach(t => {
              if (!seenIds.has(t.id) && newTracks.length < 15) {
                seenIds.add(t.id);
                newTracks.push(t);
              }
            });
          }
        });
        
        // Shuffle the results to make it feel fresh
        newTracks.sort(() => Math.random() - 0.5);
        
        if (newTracks.length > 0) {
          setDynamicRecommended(newTracks.slice(0, 10));
        }
      }).catch(e => console.warn('Error fetching dynamic recs:', e));
    }
    return () => { isMounted = false; };
  }, [profile.history]);
`;

code = code.replace(
  "// Fetch real profile image dynamically from backend",
  effectCode + "\n\n    // Fetch real profile image dynamically from backend"
);

// 3. Update recommendedTracks
code = code.replace(
  "const recommendedTracks = personalized.recommendedForToday;",
  "const recommendedTracks = dynamicRecommended.length > 0 ? dynamicRecommended : personalized.recommendedForToday;"
);

fs.writeFileSync('src/views/HomeView.tsx', code);
