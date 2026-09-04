const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

// We will replace the entire getHomeFeed() function.
const startIndex = code.indexOf('async getHomeFeed(): Promise<HomeFeedData> {');
const endIndex = code.indexOf('}\n}', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newHomeFeed = `async getHomeFeed(): Promise<HomeFeedData> {
    // Generate a daily cache key so recommendations stay stable for today
    const todayStr = new Date().toISOString().split('T')[0];
    const cacheKey = \`home-feed-v6-\${todayStr}\`;
    const cached = getFromCache<HomeFeedData>(cacheKey);
    if (cached) return cached;

    console.log('[Diagnostics] Fetching authentic Spotiz Home Feed (Indian focus, stable daily)...');

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    try {
      // 1. Fetch Popular Indian Artists
      const topArtistNames = [
        'Arijit Singh',
        'Diljit Dosanjh',
        'Yo Yo Honey Singh',
        'Karan Aujla',
        'Shreya Ghoshal',
        'AP Dhillon',
        'Sidhu Moose Wala',
        'Badshah'
      ];

      const artistPromises = topArtistNames.map(async (name) => {
        const cleanNameKey = name.toLowerCase().trim();
        let pic = POPULAR_ARTIST_PORTRAITS[cleanNameKey] || '';

        if (!pic) {
          try {
            pic = (await extractSpotifyThumbnail(\`artist-\${encodeURIComponent(name.toLowerCase())}\`, name, 'artist')) || '';
          } catch {}
        }

        if (!pic) {
          try {
            const json = await safeFetchJson<any>(
              \`https://api.deezer.com/search/artist?q=\${encodeURIComponent(name)}&limit=1\`,
              3500
            );
            if (json && json.data && json.data.length > 0) {
              const a = json.data[0];
              const dzPic = a.picture_xl || a.picture_big || a.picture_medium || a.picture;
              if (dzPic && !dzPic.includes('d41d8cd98f00b204e9800998ecf8427e')) {
                pic = dzPic;
              }
            }
          } catch (e) {}
        }

        if (!pic) {
          pic = '';
        }

        return {
          id: \`artist-\${encodeURIComponent(name)}\`,
          name,
          image: pic,
          followers: Math.floor(Math.random() * 4000000 + 3000000),
          monthlyListeners: Math.floor(Math.random() * 25000000 + 8000000),
          genres: ['Desi', 'Bollywood', 'Punjabi'],
          bio: \`\${name} is one of the most streamed artists in India.\`,
          verified: true,
          topTracks: [],
          albums: [],
          singles: [],
        } as Artist;
      });

      // Daily rotating seed logic for Recommended for Today (stable per day)
      const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const recommendedPool = [
        ['Tum Kya Mile', 'Tere Hawaale', 'Apna Bana Le', 'O Maahi', 'Chaleya', 'Jhoome Jo Pathaan', 'Kesariya', 'Heeriye'],
        ['Softly Karan Aujla', 'Lover Diljit', 'Kinni Kinni', 'Winning Speech', 'Admirin You', 'Chauffeur', 'Peaches Diljit', 'Excuses AP Dhillon'],
        ['Maan Meri Jaan', 'Tu Aake Dekhle', 'Husn Anuv Jain', 'Baarishein', 'Alag Aasmaan', 'Choo Lo', 'Pehle Bhi Main', 'Akhiyaan Gulaab'],
        ['Arjan Vailly', 'Daku', 'We Rollin', '295 Sidhu', 'Levels Sidhu', 'Brown Munde', 'Summer High', 'No Love Shubh']
      ];
      
      const dailyRecs = recommendedPool[dayOfYear % recommendedPool.length];

      // Trending Indian Hits
      const trendingHits = [
        'Tauba Tauba Karan Aujla',
        'Husn Anuv Jain',
        'O Maahi',
        'Pehle Bhi Main',
        'Ve Haamya',
        'Kalki Theme'
      ];

      // Start Listening (Mix of popular Indian hits)
      const startListening = [
        'Lover Diljit Dosanjh',
        'Chaleya Jawan',
        'Apna Bana Le Bhediya',
        'Heeriye Arijit',
        'Tere Hawaale',
        'Maan Meri Jaan'
      ];

      const [artistsList, recsResults, trendingResults, startListeningResults, albumResults] = await Promise.all([
        Promise.all(artistPromises),
        Promise.all(dailyRecs.map(q => this.searchSingleTrack(q))),
        Promise.all(trendingHits.map(q => this.searchSingleTrack(q))),
        Promise.all(startListening.map(q => this.searchSingleTrack(q))),
        safeFetchJson<any>('https://itunes.apple.com/search?term=Bollywood+2024&entity=album&limit=10', 4000)
      ]);

      const quickPicks = recsResults.filter((t): t is Track => Boolean(t));
      const trending = trendingResults.filter((t): t is Track => Boolean(t));
      
      // More Like Artist: deduplicated distinct songs
      const seenIds = new Set<string>();
      const moreLikeArtistTracks: Track[] = [];
      for (const track of startListeningResults.filter((t): t is Track => Boolean(t))) {
        if (!seenIds.has(track.id)) {
          seenIds.add(track.id);
          moreLikeArtistTracks.push(track);
        }
      }

      const albums = [];
      if (albumResults && albumResults.results) {
        for (const r of albumResults.results) {
          if (r.collectionType === 'Album' || r.wrapperType === 'collection') {
            albums.push({
              id: \`album-\${r.collectionId}\`,
              title: r.collectionName,
              artist: r.artistName,
              coverImage: r.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
              year: new Date(r.releaseDate).getFullYear() || 2024,
            });
          }
        }
      }

      // Moods for Indian context
      const moods = [
        { id: 'bollywood', title: 'Bollywood Hits', color: '#E13300' },
        { id: 'punjabi', title: 'Punjabi Swag', color: '#1E3264' },
        { id: 'romance', title: 'Desi Romance', color: '#E8115B' },
        { id: 'indie', title: 'Indian Indie', color: '#148A08' },
      ];

      const feed: HomeFeedData = {
        greeting,
        quickPicks, // Recommended for Today
        recentlyPlayed: moreLikeArtistTracks, // Used for Start Listening / Recently Played
        madeForYou: trending, // Can be repurposed if needed
        trending,
        popularSongs: moreLikeArtistTracks, // More Like Artist
        popularArtists: artistsList,
        newReleases: [],
        recommendedAlbums: albums,
        moods,
      };

      setToCache(cacheKey, feed, 3600);
      return feed;
    } catch (err) {
      console.warn('[Diagnostics] Error creating real home feed:', err);
      return {
        greeting,
        quickPicks: [],
        recentlyPlayed: [],
        madeForYou: [],
        trending: [],
        popularSongs: [],
        popularArtists: [],
        newReleases: [],
        recommendedAlbums: [],
        moods: [],
      };
    }
  }`;

  code = code.substring(0, startIndex) + newHomeFeed + code.substring(endIndex + 2);
  fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
  console.log("Patched OpenMusicProvider.ts");
} else {
  console.log("Could not find getHomeFeed in OpenMusicProvider.ts");
}
