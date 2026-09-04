const fs = require('fs');
let code = fs.readFileSync('server/providers/OpenMusicProvider.ts', 'utf8');

// A helper for extracting real saavn artist ID
const saavnHelper = `
function extractSaavnArtistId(item: any, fallbackName: string): string {
  try {
    if (item?.more_info?.artistMap?.primary_artists && item.more_info.artistMap.primary_artists.length > 0) {
      return 'saavn-artist-' + item.more_info.artistMap.primary_artists[0].id;
    }
  } catch (e) {}
  return 'artist-' + encodeURIComponent(fallbackName);
}
`;
code = code.replace("import { safeFetchJson }", saavnHelper + "\nimport { safeFetchJson }");

// Replace line 387
code = code.replace("artistId: `artist-${encodeURIComponent(artist)}`", "artistId: extractSaavnArtistId(item, artist)");
// Replace line 649
code = code.replace("artistId: `artist-${encodeURIComponent(item.more_info?.music || item.subtitle || 'artist')}`", "artistId: extractSaavnArtistId(item, item.more_info?.music || item.subtitle || 'artist')");
// Replace line 942
code = code.replace("artistId: `artist-${encodeURIComponent(item.more_info?.music || item.subtitle || 'artist')}`", "artistId: extractSaavnArtistId(item, item.more_info?.music || item.subtitle || 'artist')");
// Replace line 962 (data.subtitle is for the album, but the album itself doesn't have artistMap.primary_artists usually? Wait, it has primary_artists property)
// Actually album api response has `primary_artists_id` or similar maybe. But it's in data. Let's write `extractSaavnArtistId(data, data.subtitle || 'unknown')`
code = code.replace("artistId: `artist-${encodeURIComponent(data.subtitle || 'unknown')}`", "artistId: extractSaavnArtistId(data, data.subtitle || 'unknown')");

fs.writeFileSync('server/providers/OpenMusicProvider.ts', code);
