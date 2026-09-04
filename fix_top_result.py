import re

with open('src/views/SearchView.tsx', 'r') as f:
    content = f.read()

top_result_replacement = """                <div
                  onClick={() => {
                    if (results.topResult?.type === 'track') {
                      const t = results.topResult.data as Track;
                      recordInteraction('search_selection', t.id, t.artist, searchQuery, t);
                      playTrack(t, [t]);
                      addRecentItem({
                        id: t.id,
                        title: t.title,
                        subtitle: `Song • ${t.artist}`,
                        image: t.images?.small || t.images?.medium || t.images?.large || '',
                        type: 'track'
                      });
                    } else if (results.topResult?.type === 'artist') {
                      const a = results.topResult.data as any;
                      addRecentItem({
                        id: a.id,
                        title: a.name,
                        subtitle: 'Artist',
                        image: a.image || a.images?.small || '',
                        type: 'artist'
                      });
                      onNavigate({ type: 'artist', artistId: a.id });
                    } else if (results.topResult?.type === 'album') {
                      const al = results.topResult.data as any;
                      addRecentItem({
                        id: al.id,
                        title: al.name,
                        subtitle: `Album • ${al.artist}`,
                        image: al.image || al.images?.small || '',
                        type: 'album'
                      });
                      onNavigate({ type: 'album', albumId: al.id });
                    } else if (results.topResult?.type === 'playlist') {
                      const pl = results.topResult.data as any;
                      addRecentItem({
                        id: pl.id,
                        title: pl.name,
                        subtitle: 'Playlist',
                        image: pl.image || pl.images?.small || '',
                        type: 'playlist'
                      });
                      onNavigate({ type: 'playlist', playlistId: pl.id });
                    }
                  }}"""

content = re.sub(
    r"<div\s+onClick=\{\(\) => \{\s+if \(results\.topResult\?\.type === 'track'\) \{.*?\s+onNavigate\(\{ type: 'playlist', playlistId: \(results\.topResult\.data as any\)\.id \}\);\s+\}\s+\}\}",
    top_result_replacement,
    content,
    flags=re.DOTALL
)

with open('src/views/SearchView.tsx', 'w') as f:
    f.write(content)

