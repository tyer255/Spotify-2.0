const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

// Replace normalizeSaavnTrack calls with inline logic
code = code.replace(
  /this\.normalizeSaavnTrack\(([^)]+)\)/g,
  `(function(item) {
    const enc = item.more_info?.encrypted_media_url;
    const stream = item.vlink || (enc ? decryptSaavnMediaUrl(enc) : null);
    const dur = parseInt(item.more_info?.duration || '0', 10) || 210;
    const rawArt = item.image || '';
    const largeArt = rawArt ? rawArt.replace('150x150', '500x500') : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
    const releaseDate = item.release_date || (item.year ? \`\${item.year}-01-01\` : '');
    const playCount = parseInt(item.play_count || '5000000', 10);
    const title = item.title ? item.title.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : 'Unknown Title';
    const artist = extractSaavnArtist(item);
    return {
      id: \`saavn-\${item.id}\`,
      title,
      artist,
      artistId: extractSaavnArtistId(item, artist),
      album: item.more_info?.album ? item.more_info.album.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&') : (item.title || 'Single'),
      albumId: \`album-\${item.more_info?.album_id || item.id}\`,
      duration: dur,
      images: { small: largeArt, medium: largeArt, large: largeArt },
      provider: 'open-authorized-music',
      playbackAvailability: true,
      streamUrl: stream || '',
      mimeType: 'audio/mp4',
      explicit: item.explicit_content === '1',
      releaseYear: item.year ? parseInt(item.year, 10) : 2024,
      releaseDate: releaseDate,
      release_date: releaseDate,
      createdAt: releaseDate,
      created_at: releaseDate,
      genre: item.language ? item.language.charAt(0).toUpperCase() + item.language.slice(1) : 'Music',
      plays: playCount,
      play_count: playCount,
      views: playCount,
      color: '#1DB954'
    };
  })($1)`
);

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
console.log('Fixed normalizeSaavnTrack missing definition');
