import { Track, Artist, Album, Playlist, LyricsData } from '../src/types';

// High-reliability authorized audio streams (public domain / royalty-free / open-source direct CDNs)
export const TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'Starboy Echoes',
    artist: 'The Weeknd',
    artistId: 'artist-the-weeknd',
    album: 'Starboy Deluxe',
    albumId: 'album-starboy',
    duration: 218,
    images: {
      small: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150&auto=format&fit=crop&q=80',
      medium: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&auto=format&fit=crop&q=80',
      large: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
    },
    provider: 'spotify-authorized-audio',
    playbackAvailability: true,
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=electronic-future-beats-117997.mp3',
    mimeType: 'audio/mpeg',
    explicit: false,
    releaseYear: 2024,
    genre: 'R&B / Pop',
    plays: 142839200,
    color: '#E11D48',
  },
  {
    id: 'track-2',
    title: 'Tum Hi Ho (Acoustic Reprise)',
    artist: 'Arijit Singh',
    artistId: 'artist-arijit-singh',
    album: 'Soulful Melodies',
    albumId: 'album-soulful-melodies',
    duration: 262,
    images: {
      small: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
      medium: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
      large: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    },
    provider: 'spotify-authorized-audio',
    playbackAvailability: true,
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=romantic-ambient-guitar-10331.mp3',
    mimeType: 'audio/mpeg',
    explicit: false,
    releaseYear: 2023,
    genre: 'Bollywood / Soul',
    plays: 98450120,
    color: '#D97706',
  },
  {
    id: 'track-3',
    title: 'Levitating Midnight',
    artist: 'Dua Lipa',
    artistId: 'artist-dua-lipa',
    album: 'Future Nostalgia Remixed',
    albumId: 'album-future-nostalgia',
    duration: 203,
    images: {
      small: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80',
      medium: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
      large: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    },
    provider: 'spotify-authorized-audio',
    playbackAvailability: true,
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=tuesday-glitch-122413.mp3',
    mimeType: 'audio/mpeg',
    explicit: false,
    releaseYear: 2024,
    genre: 'Disco Pop',
    plays: 215309400,
    color: '#9333EA',
  },
  {
    id: 'track-4',
    title: 'Midnight Rain (Moonlight Edition)',
    artist: 'Taylor Swift',
    artistId: 'artist-taylor-swift',
    album: 'Midnights Anthology',
    albumId: 'album-midnights',
    duration: 174,
    images: {
      small: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80',
      medium: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
      large: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    },
    provider: 'spotify-authorized-audio',
    playbackAvailability: true,
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-abstract-intention-12099.mp3',
    mimeType: 'audio/mpeg',
    explicit: false,
    releaseYear: 2023,
    genre: 'Synth Pop',
    plays: 310894000,
    color: '#2563EB',
  },
  {
    id: 'track-5',
    title: 'Ocean Eyes (Deep Sea Chill)',
    artist: 'Billie Eilish',
    artistId: 'artist-billie-eilish',
    album: 'When We All Fall Asleep',
    albumId: 'album-when-we-fall',
    duration: 200,
    images: {
      small: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=150&auto=format&fit=crop&q=80',
      medium: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80',
      large: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    },
    provider: 'spotify-authorized-audio',
    playbackAvailability: true,
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3?filename=relaxed-vlog-night-street-131746.mp3',
    mimeType: 'audio/mpeg',
    explicit: false,
    releaseYear: 2024,
    genre: 'Indie Pop / Alt',
    plays: 189400120,
    color: '#059669',
  },
  {
    id: 'track-6',
    title: 'Yellow (Cosmic Sunset)',
    artist: 'Coldplay',
    artistId: 'artist-coldplay',
    album: 'Parachutes Remastered',
    albumId: 'album-parachutes',
    duration: 269,
    images: {
      small: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=150&auto=format&fit=crop&q=80',
      medium: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&auto=format&fit=crop&q=80',
      large: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&auto=format&fit=crop&q=80',
    },
    provider: 'spotify-authorized-audio',
    playbackAvailability: true,
    streamUrl: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_03d987e9c3.mp3?filename=ambient-piano-amp-strings-10711.mp3',
    mimeType: 'audio/mpeg',
    explicit: false,
    releaseYear: 2023,
    genre: 'Alt Rock',
    plays: 245600320,
    color: '#CA8A04',
  },
  {
    id: 'track-7',
    title: 'Kesariya (Golden Glow)',
    artist: 'Arijit Singh',
    artistId: 'artist-arijit-singh',
    album: 'Soulful Melodies',
    albumId: 'album-soulful-melodies',
    duration: 268,
    images: {
      small: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&auto=format&fit=crop&q=80',
      medium: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80',
      large: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    },
    provider: 'spotify-authorized-audio',
    playbackAvailability: true,
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/11/06/audio_c3e6014e7a.mp3?filename=soft-rain-ambient-111154.mp3',
    mimeType: 'audio/mpeg',
    explicit: false,
    releaseYear: 2024,
    genre: 'Bollywood / Romance',
    plays: 112340500,
    color: '#EA580C',
  },
  {
    id: 'track-8',
    title: 'Blinding Lights (Club Pulse)',
    artist: 'The Weeknd',
    artistId: 'artist-the-weeknd',
    album: 'After Hours Recharged',
    albumId: 'album-after-hours',
    duration: 200,
    images: {
      small: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=80',
      medium: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80',
      large: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
    },
    provider: 'spotify-authorized-audio',
    playbackAvailability: true,
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c3527e30de.mp3?filename=cyberpunk-city-2077-12345.mp3',
    mimeType: 'audio/mpeg',
    explicit: false,
    releaseYear: 2024,
    genre: 'Synthwave / Dance',
    plays: 490203000,
    color: '#DC2626',
  },
  {
    id: 'track-9',
    title: 'Rainy Night In Tokyo',
    artist: 'Lo-Fi Chill Girl',
    artistId: 'artist-lofi-girl',
    album: 'Study Session vol. 4',
    albumId: 'album-study-session',
    duration: 165,
    images: {
      small: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80',
      medium: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80',
      large: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    },
    provider: 'spotify-authorized-audio',
    playbackAvailability: true,
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3?filename=lofi-study-112191.mp3',
    mimeType: 'audio/mpeg',
    explicit: false,
    releaseYear: 2024,
    genre: 'Lo-Fi Beats',
    plays: 78940120,
    color: '#4F46E5',
  },
  {
    id: 'track-10',
    title: 'Coffee & Books',
    artist: 'Lo-Fi Chill Girl',
    artistId: 'artist-lofi-girl',
    album: 'Study Session vol. 4',
    albumId: 'album-study-session',
    duration: 154,
    images: {
      small: 'https://images.unsplash.com/photo-1507842229451-79b1be8d62a1?w=150&auto=format&fit=crop&q=80',
      medium: 'https://images.unsplash.com/photo-1507842229451-79b1be8d62a1?w=300&auto=format&fit=crop&q=80',
      large: 'https://images.unsplash.com/photo-1507842229451-79b1be8d62a1?w=600&auto=format&fit=crop&q=80',
    },
    provider: 'spotify-authorized-audio',
    playbackAvailability: true,
    streamUrl: 'https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1e01.mp3?filename=lazy-day-stylish-futuristic-chill-112194.mp3',
    mimeType: 'audio/mpeg',
    explicit: false,
    releaseYear: 2024,
    genre: 'Lo-Fi Beats',
    plays: 54109800,
    color: '#84CC16',
  }
];

export const ARTISTS: Artist[] = [
  {
    id: 'artist-arijit-singh',
    name: 'Arijit Singh',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    headerImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
    followers: 43890200,
    monthlyListeners: 38400000,
    genres: ['Bollywood', 'Romantic', 'Indian Pop', 'Sufi'],
    bio: 'Arijit Singh is a celebrated Indian playback singer and music composer. With hundreds of chart-topping love ballads, his soulful voice defines modern Indian cinema and global indie music.',
    verified: true,
    topTracks: [],
    albums: [],
    singles: [],
    relatedArtists: [
      { id: 'artist-coldplay', name: 'Coldplay', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&auto=format&fit=crop&q=80', genres: ['Alt Rock'] },
      { id: 'artist-taylor-swift', name: 'Taylor Swift', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80', genres: ['Pop'] }
    ]
  },
  {
    id: 'artist-the-weeknd',
    name: 'The Weeknd',
    image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&auto=format&fit=crop&q=80',
    headerImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=80',
    followers: 82400190,
    monthlyListeners: 104500000,
    genres: ['R&B', 'Synth-pop', 'Darkwave', 'Pop'],
    bio: 'Abel Tesfaye, known professionally as The Weeknd, is a Canadian singer-songwriter known for sonic innovation and cinematic world-building across record-breaking albums.',
    verified: true,
    topTracks: [],
    albums: [],
    singles: [],
    relatedArtists: [
      { id: 'artist-dua-lipa', name: 'Dua Lipa', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80', genres: ['Dance Pop'] },
      { id: 'artist-billie-eilish', name: 'Billie Eilish', image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&auto=format&fit=crop&q=80', genres: ['Alt Pop'] }
    ]
  },
  {
    id: 'artist-dua-lipa',
    name: 'Dua Lipa',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
    headerImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80',
    followers: 46100900,
    monthlyListeners: 73200000,
    genres: ['Dance Pop', 'Disco', 'Nu-Disco'],
    bio: 'Global pop superstar Dua Lipa brings unstoppable dance grooves and vibrant infectious energy to stadiums worldwide with multi-platinum albums.',
    verified: true,
    topTracks: [],
    albums: [],
    singles: [],
    relatedArtists: []
  },
  {
    id: 'artist-taylor-swift',
    name: 'Taylor Swift',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    headerImage: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&auto=format&fit=crop&q=80',
    followers: 99400200,
    monthlyListeners: 108900000,
    genres: ['Pop', 'Folk', 'Country Pop', 'Synth-pop'],
    bio: '14-time GRAMMY winner Taylor Swift is a genre-defining singer-songwriter with poetic lyricism, record-setting global tours, and timeless cultural resonance.',
    verified: true,
    topTracks: [],
    albums: [],
    singles: [],
    relatedArtists: []
  },
  {
    id: 'artist-billie-eilish',
    name: 'Billie Eilish',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    headerImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
    followers: 68900100,
    monthlyListeners: 84100000,
    genres: ['Alt Pop', 'Electropop', 'Dark Pop', 'Indie'],
    bio: 'Oscar & GRAMMY-winning icon Billie Eilish revolutionized contemporary alternative pop with whisper vocals, brooding basslines, and unmatched visual artistry.',
    verified: true,
    topTracks: [],
    albums: [],
    singles: [],
    relatedArtists: []
  },
  {
    id: 'artist-coldplay',
    name: 'Coldplay',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&auto=format&fit=crop&q=80',
    headerImage: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&auto=format&fit=crop&q=80',
    followers: 52100400,
    monthlyListeners: 68900000,
    genres: ['Alt Rock', 'Pop Rock', 'Britpop'],
    bio: 'Formed in London in 1997, Coldplay is one of the most successful and beloved stadium rock bands in history, renowned for anthemic melodies and uplifting visuals.',
    verified: true,
    topTracks: [],
    albums: [],
    singles: [],
    relatedArtists: []
  },
  {
    id: 'artist-lofi-girl',
    name: 'Lo-Fi Chill Girl',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80',
    headerImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    followers: 12400900,
    monthlyListeners: 16800000,
    genres: ['Lo-Fi Hip Hop', 'Chillhop', 'Ambient', 'Study Beats'],
    bio: 'Curated relaxing beats, cozy vinyl crackle, and serene chord progressions designed to help millions focus, study, code, and unwind peacefully.',
    verified: true,
    topTracks: [],
    albums: [],
    singles: [],
    relatedArtists: []
  }
];

export const ALBUMS: Album[] = [
  {
    id: 'album-starboy',
    name: 'Starboy Deluxe',
    artist: 'The Weeknd',
    artistId: 'artist-the-weeknd',
    year: 2024,
    images: {
      small: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150&auto=format&fit=crop&q=80',
      medium: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&auto=format&fit=crop&q=80',
      large: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
    },
    tracks: [],
    totalDuration: 218,
    label: 'XO / Republic Records',
    color: '#E11D48',
  },
  {
    id: 'album-soulful-melodies',
    name: 'Soulful Melodies',
    artist: 'Arijit Singh',
    artistId: 'artist-arijit-singh',
    year: 2023,
    images: {
      small: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
      medium: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
      large: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    },
    tracks: [],
    totalDuration: 530,
    label: 'Oriyon Music & T-Series',
    color: '#D97706',
  },
  {
    id: 'album-future-nostalgia',
    name: 'Future Nostalgia Remixed',
    artist: 'Dua Lipa',
    artistId: 'artist-dua-lipa',
    year: 2024,
    images: {
      small: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80',
      medium: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
      large: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    },
    tracks: [],
    totalDuration: 203,
    label: 'Warner Records',
    color: '#9333EA',
  },
  {
    id: 'album-study-session',
    name: 'Study Session vol. 4',
    artist: 'Lo-Fi Chill Girl',
    artistId: 'artist-lofi-girl',
    year: 2024,
    images: {
      small: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80',
      medium: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80',
      large: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    },
    tracks: [],
    totalDuration: 319,
    label: 'Lofi Records',
    color: '#4F46E5',
  }
];

export const PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-today-top-hits',
    title: "Today's Top Hits 2026",
    description: 'The absolute biggest songs on the planet right now. Cover: The Weeknd & Dua Lipa.',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
    userId: 'spotify-editorial',
    isPublic: true,
    tracks: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-08-16',
    likesCount: 32904100,
    color: '#10B981',
  },
  {
    id: 'playlist-chill-lofi',
    title: 'Deep Focus & Lo-Fi Coding',
    description: 'Calm instrumental lo-fi beats to keep your concentration sharp and anxiety low.',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80',
    userId: 'spotify-editorial',
    isPublic: true,
    tracks: [],
    createdAt: '2026-02-14',
    updatedAt: '2026-08-15',
    likesCount: 14890200,
    color: '#6366F1',
  },
  {
    id: 'playlist-arijit-romance',
    title: 'Best of Arijit Singh',
    description: 'Every heart-touching anthem by India’s favorite voice in one soulful playlist.',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    userId: 'spotify-editorial',
    isPublic: true,
    tracks: [],
    createdAt: '2026-03-10',
    updatedAt: '2026-08-12',
    likesCount: 8930400,
    color: '#F59E0B',
  }
];

// Synchronized timestamped lyrics (in seconds)
export const LYRICS_DATABASE: Record<string, LyricsData> = {
  'track-1': {
    trackId: 'track-1',
    title: 'Starboy Echoes',
    artist: 'The Weeknd',
    synced: true,
    lines: [
      { time: 2.0, startTimeMs: 2000, text: "I'm tryna put you in the worst mood, ah" },
      { time: 6.5, startTimeMs: 6500, text: "P1 cleaner than your church shoes, ah" },
      { time: 10.8, startTimeMs: 10800, text: "Milli point two just to hurt you, ah" },
      { time: 15.0, startTimeMs: 15000, text: "All red Lamb' just to tease you, ah" },
      { time: 19.5, startTimeMs: 19500, text: "None of these toys on a lease too, ah" },
      { time: 24.0, startTimeMs: 24000, text: "Made your whole year in a week too, yah" },
      { time: 28.5, startTimeMs: 28500, text: "Main bitch out your league too, ah" },
      { time: 33.0, startTimeMs: 33000, text: "Side bitch out of your league too, ah" },
      { time: 38.0, startTimeMs: 38000, text: "Look what you've done" },
      { time: 42.5, startTimeMs: 42500, text: "I'm a motherfuckin' starboy" },
      { time: 47.0, startTimeMs: 47000, text: "Look what you've done" },
      { time: 51.5, startTimeMs: 51500, text: "I'm a motherfuckin' starboy" },
      { time: 56.0, startTimeMs: 56000, text: "Every day a star is born" },
      { time: 60.5, startTimeMs: 60500, text: "Climb into the spotlight till the dawn" },
      { time: 65.0, startTimeMs: 65000, text: "Switching lanes under neon light" },
      { time: 70.0, startTimeMs: 70000, text: "We own the city tonight" }
    ]
  },
  'track-2': {
    trackId: 'track-2',
    title: 'Tum Hi Ho (Acoustic Reprise)',
    artist: 'Arijit Singh',
    synced: true,
    lines: [
      { time: 2.5, startTimeMs: 2500, text: "Hum tere bin ab reh nahi sakte" },
      { time: 7.0, startTimeMs: 7000, text: "Tere bina kya wajood mera" },
      { time: 12.0, startTimeMs: 12000, text: "Tujhse juda agar ho jaayenge" },
      { time: 17.5, startTimeMs: 17500, text: "Toh khud se hi ho jaayenge judaa" },
      { time: 23.0, startTimeMs: 23000, text: "Kyunki tum hi ho, ab tum hi ho" },
      { time: 29.0, startTimeMs: 29000, text: "Zindagi ab tum hi ho" },
      { time: 35.0, startTimeMs: 35000, text: "Chain bhi, mera dard bhi" },
      { time: 41.5, startTimeMs: 41500, text: "Meri aashiqui ab tum hi ho" },
      { time: 48.0, startTimeMs: 48000, text: "Tera mera rishta hai kaisa" },
      { time: 54.5, startTimeMs: 54500, text: "Ik pal door gawaara nahi" },
      { time: 60.0, startTimeMs: 60000, text: "Tere liye har roz hai jeete" },
      { time: 66.5, startTimeMs: 66500, text: "Tujhko diya mera waqt sabhi" }
    ]
  },
  'track-3': {
    trackId: 'track-3',
    title: 'Levitating Midnight',
    artist: 'Dua Lipa',
    synced: true,
    lines: [
      { time: 2.0, startTimeMs: 2000, text: "If you wanna run away with me, I know a galaxy" },
      { time: 6.5, startTimeMs: 6500, text: "And I can take you for a ride" },
      { time: 10.5, startTimeMs: 10500, text: "I had a premonition that we fell into a rhythm" },
      { time: 15.0, startTimeMs: 15000, text: "Where the music don't stop for life" },
      { time: 19.5, startTimeMs: 19500, text: "Glitter in the sky, glitter in our eyes" },
      { time: 24.0, startTimeMs: 24000, text: "Shining just the way we are" },
      { time: 28.5, startTimeMs: 28500, text: "I feel it in the air, love is everywhere" },
      { time: 33.0, startTimeMs: 33000, text: "Baby, come dance with me" },
      { time: 37.5, startTimeMs: 37500, text: "You want me, I want you, baby" },
      { time: 42.0, startTimeMs: 42000, text: "My sugarboo, I'm levitating" },
      { time: 46.5, startTimeMs: 46500, text: "The Milky Way, we're renegading" },
      { time: 51.0, startTimeMs: 51000, text: "Yeah, yeah, yeah, yeah, yeah" }
    ]
  },
  'track-4': {
    trackId: 'track-4',
    title: 'Midnight Rain (Moonlight Edition)',
    artist: 'Taylor Swift',
    synced: true,
    lines: [
      { time: 2.0, startTimeMs: 2000, text: "Rain, he wanted it comfortable, I wanted that pain" },
      { time: 7.0, startTimeMs: 7000, text: "He wanted a bride, I was making my own name" },
      { time: 12.5, startTimeMs: 12500, text: "Chasing that fame, he stayed the same" },
      { time: 17.0, startTimeMs: 17000, text: "All of me changed like midnight" },
      { time: 22.0, startTimeMs: 22000, text: "My town was a wasteland" },
      { time: 26.5, startTimeMs: 26500, text: "Full of cages, full of fences" },
      { time: 31.0, startTimeMs: 31000, text: "Pageant queens and big pretenses" },
      { time: 35.5, startTimeMs: 35500, text: "But some guy said my name and broke my defenses" },
      { time: 41.0, startTimeMs: 41000, text: "And he was sunshine, I was midnight rain" },
      { time: 47.5, startTimeMs: 47500, text: "He wanted it comfortable, I wanted that pain" }
    ]
  },
  'track-5': {
    trackId: 'track-5',
    title: 'Ocean Eyes (Deep Sea Chill)',
    artist: 'Billie Eilish',
    synced: true,
    lines: [
      { time: 3.0, startTimeMs: 3000, text: "I've been watchin' you for some time" },
      { time: 8.5, startTimeMs: 8500, text: "Can't stop starin' at those ocean eyes" },
      { time: 14.0, startTimeMs: 14000, text: "Burning cities and napalm skies" },
      { time: 19.5, startTimeMs: 19500, text: "Fifteen flares inside those ocean eyes" },
      { time: 25.0, startTimeMs: 25000, text: "Your ocean eyes..." },
      { time: 31.0, startTimeMs: 31000, text: "No fair, you really know how to make me cry" },
      { time: 38.0, startTimeMs: 38000, text: "When you gimme those ocean eyes" },
      { time: 44.5, startTimeMs: 44500, text: "I'm scared, I've never fallen from quite this high" },
      { time: 51.5, startTimeMs: 51500, text: "Falling into your ocean eyes" }
    ]
  },
  'track-7': {
    trackId: 'track-7',
    title: 'Kesariya (Golden Glow)',
    artist: 'Arijit Singh',
    synced: true,
    lines: [
      { time: 2.0, startTimeMs: 2000, text: "Mujhko itna bataaye koi" },
      { time: 7.0, startTimeMs: 7000, text: "Kaise tujhse dil na lagaaye koi" },
      { time: 12.5, startTimeMs: 12500, text: "Rabba ne tujhko banaane mein" },
      { time: 17.5, startTimeMs: 17500, text: "Kar di hai husn ki khaali tijoriyaan" },
      { time: 23.0, startTimeMs: 23000, text: "Kaajal ki sihaayi se likhi" },
      { time: 28.0, startTimeMs: 28000, text: "Hain tune jaane kitno ki love storiyaan" },
      { time: 33.5, startTimeMs: 33500, text: "Kesariya tera ishq hai piya" },
      { time: 39.0, startTimeMs: 39000, text: "Rang jaaun jo main haath lagaun" },
      { time: 45.0, startTimeMs: 45000, text: "Din beete saara teri fikr mein" },
      { time: 50.5, startTimeMs: 50500, text: "Rain saari teri khair manaun" }
    ]
  },
  'track-9': {
    trackId: 'track-9',
    title: 'Rainy Night In Tokyo',
    artist: 'Lo-Fi Chill Girl',
    synced: true,
    lines: [
      { time: 2.0, startTimeMs: 2000, text: "(Gentle rain tapping on the window sill)" },
      { time: 15.0, startTimeMs: 15000, text: "(Warm vinyl crackle and mellow electric piano)" },
      { time: 30.0, startTimeMs: 30000, text: "Breathe in... steady rhythm of the night..." },
      { time: 48.0, startTimeMs: 48000, text: "Neon glow reflecting on the wet streets of Shibuya..." },
      { time: 65.0, startTimeMs: 65000, text: "(Smooth bassline and relaxed downtempo beat)" },
      { time: 85.0, startTimeMs: 85000, text: "Finding calm inside the infinite city." }
    ]
  }
};

// Wire up relations
ALBUMS[0].tracks = [TRACKS[0], TRACKS[7]];
ALBUMS[1].tracks = [TRACKS[1], TRACKS[6]];
ALBUMS[2].tracks = [TRACKS[2]];
ALBUMS[3].tracks = [TRACKS[8], TRACKS[9]];

ARTISTS[0].topTracks = [TRACKS[1], TRACKS[6]];
ARTISTS[0].albums = [ALBUMS[1]];
ARTISTS[0].singles = [TRACKS[6]];

ARTISTS[1].topTracks = [TRACKS[0], TRACKS[7]];
ARTISTS[1].albums = [ALBUMS[0]];

ARTISTS[2].topTracks = [TRACKS[2]];
ARTISTS[2].albums = [ALBUMS[2]];

ARTISTS[3].topTracks = [TRACKS[3]];
ARTISTS[4].topTracks = [TRACKS[4]];
ARTISTS[5].topTracks = [TRACKS[5]];

ARTISTS[6].topTracks = [TRACKS[8], TRACKS[9]];
ARTISTS[6].albums = [ALBUMS[3]];

PLAYLISTS[0].tracks = [TRACKS[0], TRACKS[2], TRACKS[3], TRACKS[7], TRACKS[4]];
PLAYLISTS[1].tracks = [TRACKS[8], TRACKS[9], TRACKS[4], TRACKS[5]];
PLAYLISTS[2].tracks = [TRACKS[1], TRACKS[6]];
