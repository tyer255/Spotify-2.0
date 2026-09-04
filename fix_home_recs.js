import fs from 'fs';

let code = fs.readFileSync('src/views/HomeView.tsx', 'utf8');

code = code.replace(
  /newTracks\.sort\(\(\) => Math\.random\(\) - 0\.5\);/g,
  `newTracks.sort((a, b) => {
          const yearA = a.releaseYear || (a.releaseDate ? parseInt(a.releaseDate.split('-')[0]) : 2020);
          const yearB = b.releaseYear || (b.releaseDate ? parseInt(b.releaseDate.split('-')[0]) : 2020);
          if (yearB !== yearA) return yearB - yearA;
          
          const playsA = a.plays || a.play_count || 0;
          const playsB = b.plays || b.play_count || 0;
          return playsB - playsA;
        });`
);

code = code.replace(
  /if \(\!seenIds\.has\(t\.id\) && newTracks\.length < 15\) \{/g,
  `const titleL = t.title.toLowerCase();
              if (titleL.includes("punjabi kompa")) return;
              if (!seenIds.has(t.id) && newTracks.length < 50) {`
);

fs.writeFileSync('src/views/HomeView.tsx', code);
