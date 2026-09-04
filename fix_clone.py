with open('src/components/Common/ClonePlaylistModal.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "'No tracks found in this playlist. Please ensure the playlist is public.'",
    "'No tracks found. The playlist might be empty, private, or too new (Spotify takes a few minutes to publish new playlists).'"
)

with open('src/components/Common/ClonePlaylistModal.tsx', 'w') as f:
    f.write(content)
