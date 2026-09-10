/**
 * Spotiz Thumbnail Extraction Service
 * Based on SpotifyScraper (https://github.com/AliAkhtari78/SpotifyScraper.git)
 * 
 * STRICT USAGE POLICY:
 * This module is ONLY used for extracting missing Spotiz cover/thumbnail images.
 * It is NOT used for audio downloading, stream extraction, metadata scraping, or playback.
 */

interface SpotifyThumbnailResult {
  thumbnailUrl: string;
  source: 'spotify-oembed' | 'spotify-embed' | 'spotify-cdn' | 'spotify-token-api';
  spotifyId?: string;
}

// In-memory cache for extracted Spotiz thumbnails
const thumbnailCache = new Map<string, string>();
const MAX_THUMBNAIL_CACHE = 5000;

function setThumbnailCache(key: string, val: string) {
  if (thumbnailCache.size >= MAX_THUMBNAIL_CACHE) {
    const firstKey = thumbnailCache.keys().next().value;
    if (firstKey) thumbnailCache.delete(firstKey);
  }
  thumbnailCache.set(key, val);
}

// Genuine high-resolution CDN images for artists, stations, podcasts & charts
const SPOTIFY_CDN_THUMBNAIL_MAP: Record<string, string> = {
  "noor": "https://i.scdn.co/image/ab6761610000e5ebe6000d557d1743d28cc7e71a",
  "madhurxo": "https://i.scdn.co/image/ab6761610000e5ebfc25b09e6a4ca0fae1ce7adb",
  "madhur sharma": "https://i.scdn.co/image/ab6761610000e5ebfc25b09e6a4ca0fae1ce7adb",
  "atif aslam": "https://cdn-images.dzcdn.net/images/artist/0ea90444148fff9c11d77f06a344724e/1000x1000-000000-80-0-0.jpg",
  "aatif aslam": "https://cdn-images.dzcdn.net/images/artist/0ea90444148fff9c11d77f06a344724e/1000x1000-000000-80-0-0.jpg",
  "the weeknd": "https://cdn-images.dzcdn.net/images/artist/581693b4724a7fcfa754455101e13a44/1000x1000-000000-80-0-0.jpg",
  "arijit singh": "https://cdn-images.dzcdn.net/images/artist/ac5350cff290edd5b69fa584b8b1bd4f/1000x1000-000000-80-0-0.jpg",
  "taylor swift": "https://cdn-images.dzcdn.net/images/artist/e528e270424103b527f8a27ac625563b/1000x1000-000000-80-0-0.jpg",
  "dua lipa": "https://cdn-images.dzcdn.net/images/artist/877872aaf75694f11d53c318700ab2b5/1000x1000-000000-80-0-0.jpg",
  "ed sheeran": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Ed_Sheeran-6886_%28cropped_2%29.jpg/960px-Ed_Sheeran-6886_%28cropped_2%29.jpg",
  "billie eilish": "https://cdn-images.dzcdn.net/images/artist/8eab1a9a644889aabaca1e193e05f984/1000x1000-000000-80-0-0.jpg",
  "imagine dragons": "https://cdn-images.dzcdn.net/images/artist/1ba025c23cae3dee14b51152990285fc/1000x1000-000000-80-0-0.jpg",
  "coldplay": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/ColdplayWembley120925_%28cropped%29.jpg/960px-ColdplayWembley120925_%28cropped%29.jpg",
  "diljit dosanjh": "https://cdn-images.dzcdn.net/images/artist/79b85e695e0ca6529e56bf3b628e92bd/1000x1000-000000-80-0-0.jpg",
  "yo yo honey singh": "https://cdn-images.dzcdn.net/images/artist/7859b461c10352f02a11368905f0903f/1000x1000-000000-80-0-0.jpg",
  "honey singh": "https://cdn-images.dzcdn.net/images/artist/7859b461c10352f02a11368905f0903f/1000x1000-000000-80-0-0.jpg",
  "karan aujla": "https://cdn-images.dzcdn.net/images/artist/a91a1d5ea91e85e4f0966569b50e8d6a/1000x1000-000000-80-0-0.jpg",
  "ap dhillon": "https://cdn-images.dzcdn.net/images/artist/52594ac9fa763dc163ed13d21cb130ec/1000x1000-000000-80-0-0.jpg",
  "sidhu moose wala": "https://cdn-images.dzcdn.net/images/artist/fb1def876c43cc16738bfd6ad3d1dcd9/1000x1000-000000-80-0-0.jpg",
  "sidhu moosewala": "https://cdn-images.dzcdn.net/images/artist/fb1def876c43cc16738bfd6ad3d1dcd9/1000x1000-000000-80-0-0.jpg",
  "shubh": "https://cdn-images.dzcdn.net/images/artist/66c1e15679704beb01c912eb6668de14/1000x1000-000000-80-0-0.jpg",
  "badshah": "https://upload.wikimedia.org/wikipedia/commons/c/cb/Badshah_snapped_promoting_their_song_%28cropped%29.jpg",
  "mc stan": "https://cdn-images.dzcdn.net/images/artist/5a6fc1cf6fa0f4edadeebfaace93f612/1000x1000-000000-80-0-0.jpg",
  "kr$na": "https://cdn-images.dzcdn.net/images/artist/d13d25ef6cfd77dfb898beff537b01d1/1000x1000-000000-80-0-0.jpg",
  "krsna": "https://cdn-images.dzcdn.net/images/artist/d13d25ef6cfd77dfb898beff537b01d1/1000x1000-000000-80-0-0.jpg",
  "divine": "https://cdn-images.dzcdn.net/images/artist/343c93eb51eb5abb8c1e43fe371be1d1/1000x1000-000000-80-0-0.jpg",
  "raftaar": "https://cdn-images.dzcdn.net/images/artist/29570d57452267a2a237c812e79fe8fe/1000x1000-000000-80-0-0.jpg",
  "king": "https://cdn-images.dzcdn.net/images/artist/9a09fb99f86ade7048ec3d8fce8e93ec/1000x1000-000000-80-0-0.jpg",
  "b praak": "https://cdn-images.dzcdn.net/images/artist/efe513aabaa0a94c4db307ac3431b833/1000x1000-000000-80-0-0.jpg",
  "kishore kumar": "https://cdn-images.dzcdn.net/images/artist/5972263348ad902e29a4749e748ff452/1000x1000-000000-80-0-0.jpg",
  "lata mangeshkar": "https://upload.wikimedia.org/wikipedia/commons/2/2f/LataMangeshkar10.jpg",
  "mohammed rafi": "https://cdn-images.dzcdn.net/images/artist/9e79b89a9b2073fae0cc2f6bce278abe/1000x1000-000000-80-0-0.jpg",
  "shreya ghoshal": "https://cdn-images.dzcdn.net/images/artist/3bb832d37d10ff2affcfa9afdc7c68a0/1000x1000-000000-80-0-0.jpg",
  "anuv jain": "https://cdn-images.dzcdn.net/images/artist/eb0c0e91c8ad621b41178e0d66c81057/1000x1000-000000-80-0-0.jpg",
  "pritam": "https://cdn-images.dzcdn.net/images/artist/d4914ccd414067cd5e2c108867079a85/1000x1000-000000-80-0-0.jpg"
};

// Spotiz ID mappings for fast oEmbed extraction
const KNOWN_SPOTIFY_IDS: Record<string, { id: string; type: 'artist' | 'playlist' | 'track' | 'album' }> = {
  'atif aslam': { id: '2oSONSC9zQ4UonDKnLqksx', type: 'artist' },
  'aatif aslam': { id: '2oSONSC9zQ4UonDKnLqksx', type: 'artist' },
  'the weeknd': { id: '1Xyo4u8uXC1ZmMpatF05PJ', type: 'artist' },
  'arijit singh': { id: '4YRxDV8wJFPHPTeXepOstw', type: 'artist' },
  'taylor swift': { id: '06HL4z0CvFAxyc27GXpf02', type: 'artist' },
  'coldplay': { id: '4gzpq5YvW9XDURncExCOWZ', type: 'artist' },
  'dua lipa': { id: '6M2wZ9GZgrQXHCFfjv46we', type: 'artist' },
  'ed sheeran': { id: '6eUKZXaKkcviH0Ku9w2n3V', type: 'artist' },
  'billie eilish': { id: '6qqNVTkY8uVI9o2194vxXO', type: 'artist' },
  'yo yo honey singh': { id: '7uIbLdzzRuQIng03oJuE77', type: 'artist' },
  'honey singh': { id: '7uIbLdzzRuQIng03oJuE77', type: 'artist' },
  'diljit dosanjh': { id: '2FKWNmZWDBVIcmqNE12Is9', type: 'artist' },
  'masoom sharma': { id: '2B1mG3j8Z11O3hZ1t7u4C7', type: 'artist' },
  'kishore kumar': { id: '3gBEquTfnSn895OBNdWa1e', type: 'artist' },
  'kk': { id: '4fEkbug6kZIOq9crejrPTq', type: 'artist' },
  'karan aujla': { id: '2oBG74gAocPMFv6Ij9xWcl', type: 'artist' },
  'ap dhillon': { id: '4PULA4EFzYTrxYvOVKhDIQ', type: 'artist' },
  'anuv jain': { id: '4gdMJYnopf2nF1npikm1oJ', type: 'artist' },
  'pritam': { id: '1wRPtKGflJrxy99vAitMm2', type: 'artist' },
  'shreya ghoshal': { id: '0oOet2C40UV8ZzYElACalU', type: 'artist' },
  'lata mangeshkar': { id: '61JrslREXq98wNF5MfmnqI', type: 'artist' },
  'mohammed rafi': { id: '0gxyHStU1zPshmNu0b08un', type: 'artist' },
};

import { resolveArtist, isArtistAliasMatch } from '../../src/utils/artistAliases';

/**
 * Extracts a Spotiz thumbnail using SpotifyScraper's public endpoints:
 * 1. Cache inspection
 * 2. Spotiz CDN catalog
 * 3. Spotiz oEmbed extraction (https://open.spotify.com/oembed?url=...)
 * 4. Spotiz Embed HTML parser (og:image & __NEXT_DATA__)
 */
export async function extractSpotifyThumbnail(
  id: string,
  query: string,
  type: 'artist' | 'track' | 'album' | 'playlist' = 'artist'
): Promise<string | null> {
  if (!query || query.trim() === '') return null;

  const normalized = query.toLowerCase().trim();
  const cacheKey = id;

  // 1. Check in-memory cache
  if (thumbnailCache.has(cacheKey)) {
    return thumbnailCache.get(cacheKey)!;
  }

  // 1.5 Check Artist Alias Database
  if (type === 'artist') {
    const aliasMatch = resolveArtist(query);
    if (aliasMatch && aliasMatch.entry.portraitUrl && !aliasMatch.entry.portraitUrl.includes('unsplash.com')) {
      setThumbnailCache(cacheKey, aliasMatch.entry.portraitUrl);
      return aliasMatch.entry.portraitUrl;
    }
  }

  // 2. Check Spotiz CDN known mapping
  if (SPOTIFY_CDN_THUMBNAIL_MAP[normalized]) {
    const url = SPOTIFY_CDN_THUMBNAIL_MAP[normalized];
    setThumbnailCache(cacheKey, url);
    return url;
  }

  // 3. Check Spotiz oEmbed extraction
  let oembedUrl = '';
  if (id.startsWith('spotify-track-')) {
    const actualId = id.replace('spotify-track-', '');
    oembedUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${actualId}`;
  } else {
    const known = KNOWN_SPOTIFY_IDS[normalized];
    if (known) {
      oembedUrl = `https://open.spotify.com/oembed?url=https://open.spotify.com/${known.type}/${known.id}`;
    }
  }

  if (oembedUrl) {
    try {
      const res = await fetch(oembedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.thumbnail_url && (data.thumbnail_url.includes('scdn.co') || data.thumbnail_url.includes('spotifycdn.com'))) {
          setThumbnailCache(cacheKey, data.thumbnail_url);
          return data.thumbnail_url;
        }
      }
    } catch {
      // Fallback
    }
  }

  // 4. Extract via Saavn Autocomplete for Artists
  if (type === 'artist') {
    try {
      const saavnRes = await fetch(
        `https://www.jiosaavn.com/api.php?__call=autocomplete.get&query=${encodeURIComponent(query)}&_format=json&_marker=0&ctx=web6dot0`,
        { signal: AbortSignal.timeout(1500) }
      );
      if (saavnRes.ok) {
        const data = await saavnRes.json();
        if (data && data.topquery && data.topquery.data && data.topquery.data.length > 0) {
          const item = data.topquery.data[0];
          if (item.type === 'artist' && item.title) {
            const fetchedName = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
            const reqName = query.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (isArtistAliasMatch(item.title, query) || item.title.toLowerCase().trim() === query.toLowerCase().trim()) {
              if (item.image && !item.image.includes('default')) {
                const imageUrl = item.image.replace('50x50', '500x500').replace('150x150', '500x500');
                setThumbnailCache(cacheKey, imageUrl);
                return imageUrl;
              }
            }
          }
        }
      }
    } catch {
      // Continue
    }
  }

  // 4.5 Fallback to iTunes API for tracks and albums
  if (type === 'track' || type === 'album') {
    try {
      const entity = type === 'track' ? 'song' : 'album';
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=${entity}&limit=1`, {
        signal: AbortSignal.timeout(1500)
      });
      if (itunesRes.ok) {
        const data = await itunesRes.json();
        if (data && data.results && data.results.length > 0) {
          let imageUrl = data.results[0].artworkUrl100;
          if (imageUrl) {
            imageUrl = imageUrl.replace('100x100bb', '600x600bb');
            setThumbnailCache(cacheKey, imageUrl);
            return imageUrl;
          }
        }
      }
    } catch {
      // Continue
    }
  }

  // 5. Fallback to Deezer API
  try {
    const deezerType = type === 'artist' ? 'artist' : (type === 'album' ? 'album' : 'track');
    const res = await fetch(`https://api.deezer.com/search/${deezerType}?q=${encodeURIComponent(query)}&limit=1`, {
      signal: AbortSignal.timeout(2000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.data && data.data.length > 0) {
        const item = data.data[0];
        
        // STRICT CHECK to prevent mapping a completely different artist
        if (type === 'artist' && item.name) {
          if (!isArtistAliasMatch(item.name, query) && item.name.toLowerCase().trim() !== query.toLowerCase().trim()) {
             // Avoid assigning a wrong artist picture
             return null;
          }
        }
        
        const imageUrl = item.picture_xl || item.cover_xl || item.album?.cover_xl;
        if (imageUrl) {
          setThumbnailCache(cacheKey, imageUrl);
          return imageUrl;
        }
      }
    }
  } catch {
    // Continue
  }

  return null;
}

/**
 * Batch resolve missing thumbnails for an array of items (artists, stations, tracks, albums)
 */
export async function resolveMissingSpotifyThumbnails<T extends { id?: string; name?: string; title?: string; image?: string; images?: any }>(
  items: T[],
  type: 'artist' | 'track' | 'album' | 'playlist' = 'artist'
): Promise<T[]> {
  const result: T[] = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const resolvedBatch = await Promise.all(
      batch.map(async (item) => {
        const name = item.name || item.title || '';
        const currentImage = item.image || item.images?.large || item.images?.medium;
        
        // If thumbnail is missing, empty, or using a broken placeholder/avatar
        const isMissing = !currentImage || currentImage.includes('d41d8cd98f00b204e9800998ecf8427e') || currentImage.includes('placeholder') || currentImage.includes('unsplash.com');
        
        if (isMissing && name && item.id) {
          const extracted = await extractSpotifyThumbnail(item.id, name, type);
          if (extracted) {
            if (item.image !== undefined) {
              item.image = extracted;
            }
            if (item.images) {
              item.images.large = extracted;
              item.images.medium = extracted;
              item.images.small = extracted;
            }
          }
        }
        return item;
      })
    );
    result.push(...resolvedBatch);

    // Add a small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < items.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return result;
}

export { SPOTIFY_CDN_THUMBNAIL_MAP };
