const fs = require('fs');
let code = fs.readFileSync('src/views/SearchView.tsx', 'utf8');

const oldLogic = `        const homeRes = await api.getHomeFeed();
        if (!isMounted) return;
        let realTracks: Track[] = [];
        if (homeRes.success && homeRes.data) {
          const feed = homeRes.data;
          realTracks = [
            ...(feed.quickPicks || []),
            ...(feed.trending || []),
            ...(feed.newReleases || []),
          ];
        }
        if (realTracks.length < 4) {
          const hindiRes = await api.search('Pal Pal');
          if (isMounted && hindiRes.success && hindiRes.data?.songs) {
            realTracks = [...realTracks, ...hindiRes.data.songs];
          }
        }
        const tags = ['#hindi lofi', '#hindi pop', '#heartbroken', '#punjabi pop', '#trending'];
        const queries = ['Pal Pal Dil Ke Paas', 'Husn Anuv Jain', 'Aarzu Madhurxo', 'Bhangra Hits', 'Kesariya'];
        const cards: RealDiscoverCard[] = [];
        for (let i = 0; i < 4; i++) {
          const track = realTracks[i] || null;
          cards.push({
            id: track?.id || \`discover-\${i}\`,
            tag: tags[i % tags.length],
            title: track?.title || 'Trending Song',
            artist: track?.artist || 'Popular Artist',
            image:
              track?.images?.large ||
              track?.images?.medium ||
              track?.images?.small ||
              undefined,
            track,
            query: queries[i % queries.length],
          });
        }`;

const newLogic = `        const discoverQueries = ['O Maahi', 'Husn Anuv Jain', 'Lover Diljit', 'Tauba Tauba Karan Aujla'];
        const tags = ['#bollywood pop', '#indie vibes', '#punjabi hit', '#trending'];
        const results = await Promise.all(discoverQueries.map(q => api.search(q)));
        
        if (!isMounted) return;

        const cards: RealDiscoverCard[] = [];
        for (let i = 0; i < 4; i++) {
          const res = results[i];
          const track = (res.success && res.data?.songs?.length) ? res.data.songs[0] : null;
          cards.push({
            id: track?.id || \`discover-\${i}\`,
            tag: tags[i],
            title: track?.title || discoverQueries[i],
            artist: track?.artist || 'Popular Artist',
            image: track?.images?.large || track?.images?.medium || track?.images?.small || undefined,
            track: track || undefined,
            query: discoverQueries[i],
          });
        }`;

if (code.includes('const homeRes = await api.getHomeFeed();')) {
  code = code.replace(oldLogic, newLogic);
  fs.writeFileSync('src/views/SearchView.tsx', code);
  console.log("Patch applied successfully.");
} else {
  console.log("Could not find the target code to replace.");
}
