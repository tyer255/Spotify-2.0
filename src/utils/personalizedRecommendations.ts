import { Track, Artist, Album, UserProfile } from '../types';
import { StationData } from '../components/Common/StationCard';
import { resolveArtist } from './artistAliases';
import { getArtistPortrait } from './artistPortraits';

export interface ArtistCatalog {
  id: string;
  name: string;
  genres: string[];
  vibe: 'indie_acoustic' | 'bollywood_romance' | 'punjabi_desi' | 'global_pop' | 'hiphop_trap' | 'rock_anthem' | 'chill_lofi' | string;
  image: string;
  bio: string;
  followers: number;
  monthlyListeners: number;
  verified: boolean;
  tracks: Track[];
  relatedArtistNames: string[];
}

export interface PersonalizedFeedResult {
  topVibe: string;
  topVibeDescription: string;
  featuredArtist: ArtistCatalog | null;
  featuredArtistImage: string;
  recommendedForToday: Track[];
  fromFollowedArtists: Track[];
  startListening: Track[];
  becauseYouListenToTracks: Track[];
  becauseYouListenToArtistName: string;
  trendingInVibe: Track[];
  recommendedStations: StationData[];
  favouriteArtists: Artist[];
  recommendedAlbums: Album[];
  hasPersonalizedData: boolean;
}

export function normalizeArtistKey(nameOrId: string): string {
  if (!nameOrId) return '';
  return nameOrId
    .toLowerCase()
    .replace(/^artist-/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generatePersonalizedFeed(
  profile: UserProfile | null,
  followedArtistsList: Artist[],
  likedTracksList: Track[],
  fallbackFeed?: any
): PersonalizedFeedResult {
  // Gather ALL real tracks and artists from all possible sources
  const allRealTracks = new Map<string, Track>();
  const addTrack = (t: Track | undefined) => {
    if (t && t.id && !allRealTracks.has(t.id)) allRealTracks.set(t.id, t);
  };

  likedTracksList.forEach(addTrack);
  if (profile?.recentHistory) {
    profile.recentHistory.forEach((h: any) => addTrack(h.track));
  }

  const allRealAlbums = new Map<string, Album>();
  const allRealArtists = new Map<string, Artist>();
  const addArtist = (a: Artist | undefined) => {
      if (a && a.id) {
          allRealArtists.set(normalizeArtistKey(a.id), a);
          if (a.name) allRealArtists.set(normalizeArtistKey(a.name), a);
      }
  };

  if (fallbackFeed) {
    if (Array.isArray(fallbackFeed.quickPicks)) fallbackFeed.quickPicks.forEach(addTrack);
    if (Array.isArray(fallbackFeed.trending)) fallbackFeed.trending.forEach(addTrack);
    if (Array.isArray(fallbackFeed.popularSongs)) fallbackFeed.popularSongs.forEach(addTrack);
    if (Array.isArray(fallbackFeed.madeForYou)) {
      fallbackFeed.madeForYou.forEach((m: any) => {
        if (Array.isArray(m.tracks)) m.tracks.forEach(addTrack);
      });
    }
    
    if (Array.isArray(fallbackFeed.newReleases)) {
      fallbackFeed.newReleases.forEach((a: Album) => allRealAlbums.set(a.id, a));
    }
    if (Array.isArray(fallbackFeed.recommendedAlbums)) {
      fallbackFeed.recommendedAlbums.forEach((a: Album) => allRealAlbums.set(a.id, a));
    }
    if (Array.isArray(fallbackFeed.popularArtists)) {
      fallbackFeed.popularArtists.forEach(addArtist);
    }
  }

  followedArtistsList.forEach(addArtist);

  const dynamicCatalog: Record<string, ArtistCatalog> = {};

  const getOrCreateCatalog = (artistName: string, artistId?: string): ArtistCatalog => {
    const key = normalizeArtistKey(artistId || artistName || 'unknown');
    if (!dynamicCatalog[key]) {
      let existingArtist = allRealArtists.get(key);
      if (!existingArtist && artistName) {
          existingArtist = allRealArtists.get(normalizeArtistKey(artistName));
      }
      const aliasMatch = resolveArtist(artistName || key);

      const verifiedName = existingArtist?.name || aliasMatch?.entry?.canonicalName || artistName || 'Unknown Artist';
      const verifiedId = existingArtist?.id || artistId || `artist-${normalizeArtistKey(verifiedName)}`;
      const verifiedImage = existingArtist?.image || aliasMatch?.entry?.portraitUrl || getArtistPortrait(verifiedName) || getArtistPortrait(artistName) || getArtistPortrait(verifiedId) || '';
      const verifiedGenres = existingArtist?.genres || aliasMatch?.entry?.genres || ['Pop'];
      const verifiedBio = existingArtist?.bio || aliasMatch?.entry?.bio || '';
      const verifiedFollowers = existingArtist?.followers || aliasMatch?.entry?.followers || 0;
      
      dynamicCatalog[key] = {
        id: verifiedId,
        name: verifiedName,
        genres: verifiedGenres,
        vibe: 'global_pop', // default
        image: verifiedImage, 
        bio: verifiedBio,
        followers: verifiedFollowers,
        monthlyListeners: existingArtist?.monthlyListeners || 0,
        verified: existingArtist?.verified ?? true,
        tracks: [],
        relatedArtistNames: []
      };
    }
    return dynamicCatalog[key];
  };

  // Assign tracks to dynamic catalog
  allRealTracks.forEach(track => {
     const cat = getOrCreateCatalog(track.artist, track.artistId);
     cat.tracks.push(track);
     
  });

  const findArtistInCatalog = (nameOrId: string): ArtistCatalog | null => {
    if (!nameOrId) return null;
    const normalized = normalizeArtistKey(nameOrId);
    if (dynamicCatalog[normalized]) {
      return dynamicCatalog[normalized];
    }
    const values = Object.values(dynamicCatalog);
    for (const catalog of values) {
      if (normalizeArtistKey(catalog.id) === normalized) return catalog;
    }
    for (const catalog of values) {
      if (normalizeArtistKey(catalog.name) === normalized) return catalog;
    }
    return null;
  };

  const artistAffinityScores: Record<string, number> = {};
  const trackPlayCounts: Record<string, number> = {};
  const userPlayedTrackIds = new Set<string>();

  // 1. Process explicit Followed Artists
  const followedSet = new Set<string>();
  if (profile?.followedArtistIds) {
    profile.followedArtistIds.forEach((id) => followedSet.add(normalizeArtistKey(id)));
  }
  followedArtistsList.forEach((artist) => {
    const key = normalizeArtistKey(artist.id || artist.name);
    followedSet.add(key);
    artistAffinityScores[key] = (artistAffinityScores[key] || 0) + 50;
  });

  // 2. Process Interaction Stats
  if (profile?.interactionStats) {
    const { artistPlays = {}, trackPlays = {}, replays = {}, skips = {} } = profile.interactionStats;
    Object.entries(artistPlays).forEach(([artName, count]) => {
      const key = normalizeArtistKey(artName);
      artistAffinityScores[key] = (artistAffinityScores[key] || 0) + count * 12;
    });
    Object.entries(trackPlays).forEach(([trackId, count]) => {
      trackPlayCounts[trackId] = (trackPlayCounts[trackId] || 0) + count;
      userPlayedTrackIds.add(trackId);
    });
    Object.entries(replays).forEach(([trackId, count]) => {
      trackPlayCounts[trackId] = (trackPlayCounts[trackId] || 0) + count * 2;
    });
    Object.entries(skips).forEach(([trackId, count]) => {
      trackPlayCounts[trackId] = Math.max(0, (trackPlayCounts[trackId] || 0) - count * 2);
    });
  }

  // 3. Process Recent History
  if (profile?.recentHistory && Array.isArray(profile.recentHistory)) {
    profile.recentHistory.forEach((h: any, index: number) => {
      if (!h.track) return;
      const key = normalizeArtistKey(h.track.artist || h.track.artistId);
      const recencyMultiplier = Math.max(1, 4 - index * 0.15);
      artistAffinityScores[key] = (artistAffinityScores[key] || 0) + 8 * recencyMultiplier;
      userPlayedTrackIds.add(h.track.id);
    });
  }

  // 4. Process Liked Tracks
  likedTracksList.forEach((t) => {
    const key = normalizeArtistKey(t.artist || t.artistId);
    artistAffinityScores[key] = (artistAffinityScores[key] || 0) + 25;
    userPlayedTrackIds.add(t.id);
  });

  // 5. Compound Affinity
  Object.keys(artistAffinityScores).forEach((key) => {
    if (followedSet.has(key) && (artistAffinityScores[key] > 50)) {
      artistAffinityScores[key] = Math.round(artistAffinityScores[key] * 1.8);
    }
  });

  const sortedArtistKeys = Object.keys(artistAffinityScores).sort(
    (a, b) => artistAffinityScores[b] - artistAffinityScores[a]
  );

  let topArtistKey = sortedArtistKeys[0];
  if (!topArtistKey && followedSet.size > 0) {
      topArtistKey = Array.from(followedSet)[0];
  }

  let featuredArtist = topArtistKey ? findArtistInCatalog(topArtistKey) : null;
  
  // No fallback to The Weeknd if there is no user affinity.

  const topVibe = featuredArtist?.vibe || 'global_pop';
  let topVibeDescription = 'Curated for your personal sound';
  if (topVibe === 'indie_acoustic') topVibeDescription = 'Acoustic indie, poetic ballads & soulful guitars';
  else if (topVibe === 'bollywood_romance') topVibeDescription = 'Bollywood romance, timeless playback & soulful melodies';
  else if (topVibe === 'punjabi_desi') topVibeDescription = 'Punjabi pop, upbeat beats & desi energy';

  const allCatalogArtists = Object.values(dynamicCatalog);
  const allCatalogTracks = Array.from(allRealTracks.values());

  const historyIds = new Set(profile?.recentHistory?.map((h: any) => h.track?.id) || []);

    const scoredTracks = allCatalogTracks.map((track) => {
    const artKey = normalizeArtistKey(track.artist || track.artistId);
    const artAffinity = artistAffinityScores[artKey] || (followedSet.has(artKey) ? 50 : 0);
    const isFollowed = followedSet.has(artKey);
    const timesPlayed = trackPlayCounts[track.id] || 0;
    const isHistory = historyIds.has(track.id);

    let score = artAffinity * 2.0;
    if (isFollowed) score += 80;

    const trackArtist = findArtistInCatalog(track.artist);
    if (trackArtist && trackArtist.vibe === topVibe) score += 45;

    // For general recommendations, we PENALIZE already played tracks so we get new discoveries
    let recScore = score;
    if (isHistory) recScore -= 200; // Heavily penalize exact tracks we just listened to
    if (timesPlayed > 0) recScore -= 100;
    
    // Add randomness for variety
    recScore += Math.random() * 50;
    
    // Start Listening (Jump back in) score - favors what we recently played
    let startScore = score + (timesPlayed * 20);
    if (isHistory) startScore += 100;
    startScore += Math.random() * 20;

    return { track, recScore, startScore };
  });

  // Sort for Recommended (Unique discoveries based on affinity)
  const sortedForRecs = [...scoredTracks].sort((a, b) => b.recScore - a.recScore);
  // Sort for Start Listening (Recent favorites mixed with high affinity)
  const sortedForStart = [...scoredTracks].sort((a, b) => b.startScore - a.startScore);

  // Shuffle helper
  const shuffle = (array: any[]) => {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex > 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  const recTodaySet = new Set<string>();
  const recommendedForToday: Track[] = [];
  for (const item of sortedForRecs) {
    if (!recTodaySet.has(item.track.id)) {
      recTodaySet.add(item.track.id);
      recommendedForToday.push(item.track);
      if (recommendedForToday.length >= 10) break;
    }
  }
  
  // Fill recommendedForToday from fallbackFeed if empty
  if (recommendedForToday.length < 10 && fallbackFeed && Array.isArray(fallbackFeed.trending)) {
      fallbackFeed.trending.forEach((t: Track) => {
          if (!recTodaySet.has(t.id)) {
              recTodaySet.add(t.id);
              recommendedForToday.push(t);
          }
      });
  }

  const fromFollowedArtists: Track[] = [];
  const followedTracksSeen = new Set<string>();
  followedSet.forEach((key) => {
    const art = findArtistInCatalog(key);
    if (art) {
      art.tracks.forEach((t) => {
        if (!followedTracksSeen.has(t.id)) {
          followedTracksSeen.add(t.id);
          fromFollowedArtists.push(t);
        }
      });
    }
  });
  fromFollowedArtists.sort((a, b) => (b.releaseYear || 2020) - (a.releaseYear || 2020));

  const startListeningSet = new Set<string>();
  const startListening: Track[] = [];
  // 1. First, pick from scoredTracks not in recTodaySet
  for (const item of scoredTracks) {
    if (!startListeningSet.has(item.track.id) && !recTodaySet.has(item.track.id)) {
      startListeningSet.add(item.track.id);
      startListening.push(item.track);
      if (startListening.length >= 6) break;
    }
  }
  // 2. If we need more to reach 6, pick from fallbackFeed.trending
  if (startListening.length < 6 && fallbackFeed && Array.isArray(fallbackFeed.trending)) {
    for (const t of fallbackFeed.trending) {
      if (!startListeningSet.has(t.id)) {
        startListeningSet.add(t.id);
        startListening.push(t);
        if (startListening.length >= 6) break;
      }
    }
  }
  // 3. If still needed, pick from fallbackFeed.quickPicks or popularSongs
  if (startListening.length < 6 && fallbackFeed && Array.isArray(fallbackFeed.quickPicks)) {
    for (const t of fallbackFeed.quickPicks) {
      if (!startListeningSet.has(t.id)) {
        startListeningSet.add(t.id);
        startListening.push(t);
        if (startListening.length >= 6) break;
      }
    }
  }
  // 4. If still needed, pick from allCatalogTracks
  if (startListening.length < 6) {
    for (const t of allCatalogTracks) {
      if (!startListeningSet.has(t.id)) {
        startListeningSet.add(t.id);
        startListening.push(t);
        if (startListening.length >= 6) break;
      }
    }
  }

  const becauseYouListenToArtistName = featuredArtist?.name || '';
  const becauseYouListenToTracks: Track[] = [];
  const becauseSeen = new Set<string>();

  if (featuredArtist) {
    featuredArtist.tracks.forEach((t) => {
      if (!becauseSeen.has(t.id)) {
        becauseSeen.add(t.id);
        becauseYouListenToTracks.push(t);
      }
    });
  }

  // If the artist has fewer than 8 tracks, fill with matching vibe and popular catalog tracks
  if (becauseYouListenToTracks.length < 8) {
    for (const t of allCatalogTracks) {
      const art = findArtistInCatalog(t.artist);
      if (!becauseSeen.has(t.id) && art?.vibe === topVibe) {
        becauseSeen.add(t.id);
        becauseYouListenToTracks.push(t);
        if (becauseYouListenToTracks.length >= 8) break;
      }
    }
  }
  if (becauseYouListenToTracks.length < 8 && fallbackFeed && Array.isArray(fallbackFeed.popularSongs)) {
    for (const t of fallbackFeed.popularSongs) {
      if (!becauseSeen.has(t.id)) {
        becauseSeen.add(t.id);
        becauseYouListenToTracks.push(t);
        if (becauseYouListenToTracks.length >= 8) break;
      }
    }
  }
  if (becauseYouListenToTracks.length < 8) {
    for (const t of allCatalogTracks) {
      if (!becauseSeen.has(t.id)) {
        becauseSeen.add(t.id);
        becauseYouListenToTracks.push(t);
        if (becauseYouListenToTracks.length >= 8) break;
      }
    }
  }

  let trendingInVibe: Track[] = [];
  const trendingSeen = new Set<string>();
  if (fallbackFeed && Array.isArray(fallbackFeed.trending) && fallbackFeed.trending.length > 0) {
    fallbackFeed.trending.forEach((t: Track) => {
      if (!trendingSeen.has(t.id)) {
        trendingSeen.add(t.id);
        trendingInVibe.push(t);
      }
    });
  }
  if (trendingInVibe.length < 8 && fallbackFeed && Array.isArray(fallbackFeed.popularSongs)) {
    fallbackFeed.popularSongs.forEach((t: Track) => {
      if (!trendingSeen.has(t.id)) {
        trendingSeen.add(t.id);
        trendingInVibe.push(t);
      }
    });
  }
  if (trendingInVibe.length < 8) {
    // Exclude recent history and likes to avoid feedback loops
    const likedIds = new Set(likedTracksList.map(t => t.id));
    const sortedCatalog = allCatalogTracks
      .filter(t => !historyIds.has(t.id) && !likedIds.has(t.id))
      .sort((a, b) => (b.plays || 0) - (a.plays || 0));

    for (const t of sortedCatalog) {
      if (!trendingSeen.has(t.id)) {
        trendingSeen.add(t.id);
        trendingInVibe.push(t);
        if (trendingInVibe.length >= 8) break;
      }
    }
  }


  // Authentic Spotiz Radio & Recommended Stations
  const defaultRecommendedStations: StationData[] = [
    {
      id: 'station-arijit-singh',
      title: 'Arijit Singh Radio',
      supportingText: 'With Atif Aslam, Pritam, Shreya Ghoshal and more',
      themeColor: '#10B981',
      artists: [
        { name: 'Arijit Singh', image: 'https://image-cdn-fa.spotifycdn.com/image/ab67616100005174adfb0b2df04b77e43b5f7375' },
        { name: 'Atif Aslam', image: 'https://cdn-images.dzcdn.net/images/artist/0ea90444148fff9c11d77f06a344724e/1000x1000-000000-80-0-0.jpg' },
        { name: 'Shreya Ghoshal', image: 'https://cdn-images.dzcdn.net/images/artist/3bb832d37d10ff2affcfa9afdc7c68a0/1000x1000-000000-80-0-0.jpg' },
      ],
    },
    {
      id: 'station-kishore-kumar',
      title: 'Kishore Kumar Radio',
      supportingText: 'With Lata Mangeshkar, Mohammed Rafi, R.D. Burman and more',
      themeColor: '#3B82F6',
      artists: [
        { name: 'Kishore Kumar', image: 'https://cdn-images.dzcdn.net/images/artist/5972263348ad902e29a4749e748ff452/1000x1000-000000-80-0-0.jpg' },
        { name: 'Lata Mangeshkar', image: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/LataMangeshkar10.jpg' },
        { name: 'Mohammed Rafi', image: 'https://cdn-images.dzcdn.net/images/artist/9e79b89a9b2073fae0cc2f6bce278abe/1000x1000-000000-80-0-0.jpg' },
      ],
    },
    {
      id: 'station-the-weeknd',
      title: 'The Weeknd Radio',
      supportingText: 'With Post Malone, Bruno Mars, Drake and more',
      themeColor: '#EF4444',
      artists: [
        { name: 'The Weeknd', image: 'https://image-cdn-fa.spotifycdn.com/image/ab67616100005174c1719ac9e6a75c1c25835018' },
        { name: 'Post Malone', image: 'https://cdn-images.dzcdn.net/images/artist/a5a8cca44e7eab2db7d44e039bed2574/1000x1000-000000-80-0-0.jpg' },
        { name: 'Bruno Mars', image: 'https://cdn-images.dzcdn.net/images/artist/c17b6a4a821e25e985b98df969438053/1000x1000-000000-80-0-0.jpg' },
      ],
    },
    {
      id: 'station-taylor-swift',
      title: 'Taylor Swift Radio',
      supportingText: 'With Olivia Rodrigo, Billie Eilish, Selena Gomez and more',
      themeColor: '#EC4899',
      artists: [
        { name: 'Taylor Swift', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67616100005174e2e8e7ff002a4afda1c7147e' },
        { name: 'Olivia Rodrigo', image: 'https://image-cdn-ak.spotifycdn.com/image/ab67616100005174b14eb4dcfd2f3858bed06e44' },
        { name: 'Billie Eilish', image: 'https://cdn-images.dzcdn.net/images/artist/e71b26859dd2aaae73eb492f254e0c40/1000x1000-000000-80-0-0.jpg' },
      ],
    },
    {
      id: 'station-diljit-dosanjh',
      title: 'Diljit Dosanjh Radio',
      supportingText: 'With Karan Aujla, AP Dhillon, Sidhu Moose Wala and more',
      themeColor: '#F59E0B',
      artists: [
        { name: 'Diljit Dosanjh', image: 'https://cdn-images.dzcdn.net/images/artist/79b85e695e0ca6529e56bf3b628e92bd/1000x1000-000000-80-0-0.jpg' },
        { name: 'Karan Aujla', image: 'https://cdn-images.dzcdn.net/images/artist/a91a1d5ea91e85e4f0966569b50e8d6a/1000x1000-000000-80-0-0.jpg' },
        { name: 'AP Dhillon', image: 'https://cdn-images.dzcdn.net/images/artist/b6f5cfd71e21b2d713c723f66c0e5a95/1000x1000-000000-80-0-0.jpg' },
      ],
    },
    {
      id: 'station-honey-singh',
      title: 'Yo Yo Honey Singh Radio',
      supportingText: 'With Badshah, Guru Randhawa, Raftaar and more',
      themeColor: '#8B5CF6',
      artists: [
        { name: 'Yo Yo Honey Singh', image: 'https://cdn-images.dzcdn.net/images/artist/7859b461c10352f02a11368905f0903f/1000x1000-000000-80-0-0.jpg' },
        { name: 'Badshah', image: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Badshah_snapped_promoting_their_song_%28cropped%29.jpg' },
        { name: 'Guru Randhawa', image: 'https://cdn-images.dzcdn.net/images/artist/812a64c48970420f1ce899557602be3b/1000x1000-000000-80-0-0.jpg' },
      ],
    },
  ];

  const dynamicStations: StationData[] = [...defaultRecommendedStations];

  const favouriteArtists: Artist[] = [];
  const favArtSeen = new Set<string>();

  followedArtistsList.forEach((a) => {
    if (a.id && !favArtSeen.has(a.id)) {
      favArtSeen.add(a.id);
      favouriteArtists.push(a);
    }
  });

  sortedArtistKeys.forEach((key) => {
    const cat = findArtistInCatalog(key);
    if (cat && cat.id && !favArtSeen.has(cat.id)) {
      favArtSeen.add(cat.id);
      favouriteArtists.push({
        id: cat.id,
        name: cat.name,
        image: cat.image,
        followers: cat.followers,
        monthlyListeners: cat.monthlyListeners,
        genres: cat.genres,
        bio: cat.bio,
        verified: cat.verified,
        topTracks: cat.tracks,
        albums: [],
        singles: cat.tracks,
      });
    }
  });

  allCatalogArtists.forEach((cat) => {
    if (favouriteArtists.length < 6 && cat.id && !favArtSeen.has(cat.id) && cat.image) {
      favArtSeen.add(cat.id);
      favouriteArtists.push({
        id: cat.id,
        name: cat.name,
        image: cat.image,
        followers: cat.followers,
        monthlyListeners: cat.monthlyListeners,
        genres: cat.genres,
        bio: cat.bio,
        verified: cat.verified,
        topTracks: cat.tracks,
        albums: [],
        singles: cat.tracks,
      });
    }
  });
  
  if (favouriteArtists.length < 6 && fallbackFeed && Array.isArray(fallbackFeed.popularArtists)) {
      fallbackFeed.popularArtists.forEach((a: Artist) => {
          if (favouriteArtists.length < 6 && a.id && !favArtSeen.has(a.id)) {
              favArtSeen.add(a.id);
              favouriteArtists.push(a);
          }
      })
  }

  let recommendedAlbums: Album[] = Array.from(allRealAlbums.values()).slice(0, 6);
  if (recommendedAlbums.length === 0 && fallbackFeed && Array.isArray(fallbackFeed.recommendedAlbums)) {
      recommendedAlbums = fallbackFeed.recommendedAlbums.slice(0, 6);
  }

  const hasPersonalizedData = followedSet.size > 0 || userPlayedTrackIds.size > 0;

  return {
    topVibe,
    topVibeDescription,
    featuredArtist,
    featuredArtistImage: featuredArtist?.image || '',
    recommendedForToday,
    fromFollowedArtists,
    startListening,
    becauseYouListenToTracks,
    becauseYouListenToArtistName,
    trendingInVibe,
    recommendedStations: dynamicStations,
    favouriteArtists,
    recommendedAlbums,
    hasPersonalizedData,
  };
}
