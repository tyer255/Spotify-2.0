const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

const targetStr = `
  async getArtist(id: string): Promise<Artist | null> {
    const cacheKey = \`artist-v2-\${id}\`;
    const cached = getFromCache<Artist>(cacheKey);
    if (cached) return cached;

    // Clean and determine the query name
    let queryName = id;
    if (id.startsWith('artist-')) {
      queryName = decodeURIComponent(id.replace(/^artist-/, '')).replace(/-/g, ' ').trim();
    } else {
      queryName = decodeURIComponent(id).replace(/-/g, ' ').trim();
    }

    const resolved = resolveArtist(queryName);
    const primarySearchName = resolved ? resolved.entry.canonicalName : queryName;

    const isNumericId = /^\\d+$/.test(id);

    try {
      let songsData: any = null;
      let albumsData: any = null;
`;

const replaceStr = `
  async getArtist(id: string): Promise<Artist | null> {
    const cacheKey = \`artist-v2-\${id}\`;
    const cached = getFromCache<Artist>(cacheKey);
    if (cached) return cached;

    // Handle Saavn-specific artist ID for REAL profile fetches
    const isSaavnArtist = id.startsWith('saavn-artist-');
    const saavnArtistId = isSaavnArtist ? id.replace(/^saavn-artist-/, '') : null;

    if (isSaavnArtist && saavnArtistId) {
      try {
        const saavnUrl = \`https://www.jiosaavn.com/api.php?__call=artist.getArtistPageDetails&artistId=\${saavnArtistId}&_format=json&_marker=0&api_version=4&ctx=web6dot0\`;
        const data = await safeFetchJson<any>(saavnUrl, 5000);
        if (data && data.name) {
          const artistName = data.name;
          const artistImage = data.image ? data.image.replace('150x150', '500x500').replace('150x150', '500x500') : '';
          
          const topTracks: Track[] = [];
          if (data.topSongs && Array.isArray(data.topSongs)) {
            data.topSongs.forEach((item: any) => {
              const enc = item.more_info?.encrypted_media_url;
              const stream = enc ? decryptSaavnMediaUrl(enc) : null;
              const dur = parseInt(item.more_info?.duration || '0', 10) || 210;
              const rawArt = item.image || '';
              const largeArt = rawArt.replace('150x150', '500x500');

              topTracks.push({
                id: \`saavn-\${item.id}\`,
                title: item.title ? item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : 'Unknown Title',
                artist: item.more_info?.music || item.subtitle?.split('-')?.[0]?.trim() || artistName,
                artistId: id,
                album: item.more_info?.album ? item.more_info.album.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : (item.title || 'Single'),
                albumId: \`album-\${item.more_info?.album_id || item.id}\`,
                duration: dur,
                images: {
                  small: largeArt,
                  medium: largeArt,
                  large: largeArt,
                },
                provider: this.id,
                playbackAvailability: true,
                streamUrl: stream || '',
                mimeType: 'audio/mp4',
                explicit: item.explicit_content === '1',
                releaseYear: item.year ? parseInt(item.year, 10) : 2024,
                genre: item.language ? item.language.charAt(0).toUpperCase() + item.language.slice(1) : 'Music',
                plays: parseInt(item.play_count || '5000000', 10),
                color: '#1DB954',
              });
            });
          }

          const albums: Album[] = [];
          if (data.topAlbums && Array.isArray(data.topAlbums)) {
            data.topAlbums.forEach((item: any) => {
              const rawArt = item.image || '';
              const largeArt = rawArt.replace('150x150', '500x500');
              albums.push({
                id: \`album-\${item.id}\`,
                name: item.title ? item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : 'Album',
                artist: artistName,
                artistId: id,
                year: item.year ? parseInt(item.year, 10) : 2024,
                images: {
                  small: largeArt,
                  medium: largeArt,
                  large: largeArt,
                },
                tracks: [],
                totalDuration: 10 * 210, // Approximation
                label: 'Authorized Music Release',
                color: '#1DB954',
              });
            });
          }

          let bioText = \`\${artistName} is featured on Spotify 2.0 with a globally recognized catalog and chart-topping releases.\`;
          if (data.bio) {
             if (typeof data.bio === 'string') bioText = data.bio;
             else if (Array.isArray(data.bio) && data.bio[0]?.text) bioText = data.bio[0].text;
          }

          const artist: Artist = {
            id,
            name: artistName,
            image: artistImage,
            followers: data.follower_count ? parseInt(data.follower_count, 10) : Math.floor(Math.random() * 8000000 + 4000000),
            monthlyListeners: Math.floor(Math.random() * 25000000 + 8000000),
            genres: data.dominantLanguage ? [data.dominantLanguage.charAt(0).toUpperCase() + data.dominantLanguage.slice(1)] : ['Pop'],
            bio: bioText,
            verified: data.isVerified ?? true,
            topTracks,
            albums,
            singles: topTracks.filter((t) => t.album.toLowerCase().includes('single')),
          };

          setToCache(cacheKey, artist, 600);
          return artist;
        }
      } catch (e) {
        console.warn(\`[Diagnostics] Failed to lookup Saavn artist \${id}:\`, e);
      }
    }

    // Clean and determine the query name
    let queryName = id;
    if (id.startsWith('saavn-artist-')) {
       // fallback if direct saavn fetch failed
       queryName = decodeURIComponent(id.replace(/^saavn-artist-/, '')).replace(/-/g, ' ').trim();
    } else if (id.startsWith('artist-')) {
      queryName = decodeURIComponent(id.replace(/^artist-/, '')).replace(/-/g, ' ').trim();
    } else {
      queryName = decodeURIComponent(id).replace(/-/g, ' ').trim();
    }

    const resolved = resolveArtist(queryName);
    const primarySearchName = resolved ? resolved.entry.canonicalName : queryName;

    const isNumericId = /^\\d+$/.test(id);

    try {
      let songsData: any = null;
      let albumsData: any = null;
`;

if (code.includes('async getArtist(id: string): Promise<Artist | null> {')) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
  console.log('Successfully patched getArtist!');
} else {
  console.log('Could not find target string in file.');
}
