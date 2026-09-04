import re

with open('src/views/SearchView.tsx', 'r') as f:
    content = f.read()

album_replacement = """                  <AlbumCard key={`${album.id}-${idx}`} album={album} onNavigate={(view) => {
                    addRecentItem({
                      id: album.id,
                      title: album.name,
                      subtitle: `Album • ${album.artist}`,
                      image: album.image || '',
                      type: 'album'
                    });
                    onNavigate(view);
                  }} />"""

content = re.sub(r"<AlbumCard key=\{\`\$\{album\.id\}\-\$\{idx\}\`\} album=\{album\} onNavigate=\{onNavigate\} \/>", album_replacement, content)

playlist_replacement = """                  <PlaylistCard key={`${playlist.id}-${idx}`} playlist={playlist} onNavigate={(view) => {
                    addRecentItem({
                      id: playlist.id,
                      title: playlist.name,
                      subtitle: 'Playlist',
                      image: playlist.image || '',
                      type: 'playlist'
                    });
                    onNavigate(view);
                  }} />"""

content = re.sub(r"<PlaylistCard key=\{\`\$\{playlist\.id\}\-\$\{idx\}\`\} playlist=\{playlist\} onNavigate=\{onNavigate\} \/>", playlist_replacement, content)

with open('src/views/SearchView.tsx', 'w') as f:
    f.write(content)

