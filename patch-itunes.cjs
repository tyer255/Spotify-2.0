const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

// Inside searchSingleTrack and normalizeItunesTrack or search
// Let's patch searchSingleTrack to filter out bad results.
const startIndex = code.indexOf('private async searchSingleTrack(query: string): Promise<Track | null> {');
const endIndex = code.indexOf('}\n\n', startIndex);

if (startIndex !== -1) {
  const newMethod = `private async searchSingleTrack(query: string): Promise<Track | null> {
    const q = (query || '').trim();
    const cacheKey = \`single-track-\${q.toLowerCase()}\`;
    const cached = getFromCache<Track>(cacheKey);
    if (cached) return cached;

    try {
      const url = \`https://itunes.apple.com/search?term=\${encodeURIComponent(q)}&entity=song&limit=10\`;
      const data = await safeFetchJson<any>(url, 3500);
      if (data && data.results && data.results.length > 0) {
        // Filter out bad hits
        const badWords = ['dj mix', 'cover', 'karaoke', 'instrumental', 'tribute', 'remix', 'trap invasion', 'lofi'];
        const validResults = data.results.filter(r => {
          const t = (r.trackName || '').toLowerCase();
          const a = (r.artistName || '').toLowerCase();
          if (badWords.some(w => t.includes(w) || a.includes(w))) return false;
          return true;
        });
        
        if (validResults.length > 0) {
          const track = this.normalizeItunesTrack(validResults[0]);
          setToCache(cacheKey, track, 1800);
          return track;
        } else {
          // Fallback to first if all filtered
          const track = this.normalizeItunesTrack(data.results[0]);
          setToCache(cacheKey, track, 1800);
          return track;
        }
      }
    } catch {}

    // Fallback to JioSaavn
    try {
      const url = \`https://saavn.dev/api/search/songs?query=\${encodeURIComponent(q)}&limit=10\`;
      const data = await safeFetchJson<any>(url, 3500);
      if (data && data.success && data.data && data.data.results && data.data.results.length > 0) {
        const badWords = ['dj mix', 'cover', 'karaoke', 'instrumental', 'tribute', 'remix', 'trap invasion'];
        const validResults = data.data.results.filter(r => {
          const t = (r.name || '').toLowerCase();
          if (badWords.some(w => t.includes(w))) return false;
          return true;
        });

        if (validResults.length > 0) {
          const track = this.normalizeSaavnTrack(validResults[0]);
          setToCache(cacheKey, track, 1800);
          return track;
        } else {
          const track = this.normalizeSaavnTrack(data.data.results[0]);
          setToCache(cacheKey, track, 1800);
          return track;
        }
      }
    } catch {}

    return null;
  }`;
  code = code.substring(0, startIndex) + newMethod + code.substring(endIndex + 1);
  fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
  console.log("Patched searchSingleTrack");
} else {
  console.log("Could not find searchSingleTrack");
}
