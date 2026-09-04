import re

with open('src/views/SearchView.tsx', 'r') as f:
    content = f.read()

# Fix Album in SearchView
content = content.replace("image: album.image || ''", "image: album.images?.small || album.images?.medium || album.images?.large || ''")

# Fix Playlist in SearchView
content = content.replace("title: playlist.name,", "title: playlist.title,")
content = content.replace("image: playlist.image || ''", "image: playlist.coverImage || ''")

with open('src/views/SearchView.tsx', 'w') as f:
    f.write(content)

