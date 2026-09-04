import fs from 'fs';

let code = fs.readFileSync('src/views/HomeView.tsx', 'utf8');

// I need to extract the second useEffect out.
// Wait, I will just remove the nested useEffect and place it before the first one.

code = code.replace(
  /  useEffect\(\(\) => \{\n    let isMounted = true;\n    \n    \/\/ Fetch dynamic recommendations based on history[\s\S]*?\}, \[profile\.history\]\);\n\n\n    \/\/ Fetch real profile image dynamically from backend/,
  "    // Fetch real profile image dynamically from backend"
);

const newEffect = `
  useEffect(() => {
    let isMounted = true;
    
    const historyArtists = profile.history.map(t => t.artist);
    const uniqueArtists = [...new Set(historyArtists)].slice(0, 4);
    
    if (uniqueArtists.length > 0) {
      Promise.all(uniqueArtists.map(a => api.search(a))).then(responses => {
        if (!isMounted) return;
        const newTracks: any[] = [];
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
  "  const [dynamicRecommended, setDynamicRecommended] = useState<Track[]>([]);\n",
  "  const [dynamicRecommended, setDynamicRecommended] = useState<Track[]>([]);\n" + newEffect + "\n"
);

fs.writeFileSync('src/views/HomeView.tsx', code);
