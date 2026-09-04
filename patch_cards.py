import re

with open('src/views/SearchView.tsx', 'r') as f:
    content = f.read()

# Wrap onNavigate for artists
def replacer_artist(match):
    return """<ArtistCard key={artist.id} artist={artist} onNavigate={(view) => {
                    addRecentItem({
                      id: artist.id,
                      title: artist.name,
                      subtitle: 'Artist',
                      image: artist.images?.small || artist.images?.medium || artist.images?.large || artist.image || '',
                      type: 'artist'
                    });
                    onNavigate(view);
                  }} />"""

content = re.sub(
    r"<ArtistCard key=\{artist\.id\} artist=\{artist\} onNavigate=\{onNavigate\} />",
    replacer_artist,
    content
)

# Wrap onNavigate for albums
def replacer_album(match):
    return """<AlbumCard key={album.id} album={album} onNavigate={(view) => {
                    addRecentItem({
                      id: album.id,
                      title: album.name,
                      subtitle: `Album • ${album.artist || 'Unknown'}`,
                      image: album.images?.small || album.images?.medium || album.images?.large || album.image || '',
                      type: 'album'
                    });
                    onNavigate(view);
                  }} />"""

content = re.sub(
    r"<AlbumCard key=\{album\.id\} album=\{album\} onNavigate=\{onNavigate\} />",
    replacer_album,
    content
)

# Wrap onNavigate for playlists
def replacer_playlist(match):
    return """<PlaylistCard key={playlist.id} playlist={playlist} onNavigate={(view) => {
                    addRecentItem({
                      id: playlist.id,
                      title: playlist.name,
                      subtitle: 'Playlist',
                      image: playlist.images?.small || playlist.images?.medium || playlist.images?.large || playlist.image || '',
                      type: 'playlist'
                    });
                    onNavigate(view);
                  }} />"""

content = re.sub(
    r"<PlaylistCard key=\{playlist\.id\} playlist=\{playlist\} onNavigate=\{onNavigate\} />",
    replacer_playlist,
    content
)

with open('src/views/SearchView.tsx', 'w') as f:
    f.write(content)

