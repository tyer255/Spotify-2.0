import re

with open('src/views/SearchView.tsx', 'r') as f:
    content = f.read()

# artist.images?.small || artist.images?.medium || artist.images?.large || artist.image || ''
# ->
# artist.image || ''
content = content.replace("artist.images?.small || artist.images?.medium || artist.images?.large || artist.image || ''", "artist.image || ''")

# same for album and playlist, if they exist
content = content.replace("album.images?.small || album.images?.medium || album.images?.large || album.image || ''", "album.image || ''")
content = content.replace("playlist.images?.small || playlist.images?.medium || playlist.images?.large || playlist.image || ''", "playlist.image || ''")

with open('src/views/SearchView.tsx', 'w') as f:
    f.write(content)

