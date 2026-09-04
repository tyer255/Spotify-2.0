with open('src/components/Common/ClonePlaylistModal.tsx', 'r') as f:
    content = f.read()

content = content.replace('await createPlaylist(playlistTitle, playlistDescription, importedTracks, playlistImage)', 'await createPlaylist(playlistTitle, playlistDescription, playlistImage, importedTracks)')

content = content.replace("showToast(`Saved \"${playlistTitle}\" with ${importedTracks.length} songs`, 'success');", "showToast(`Saved \"${playlistTitle}\" with ${importedTracks.length} songs`);")
content = content.replace("showToast('Failed to save playlist', 'error');", "showToast('Failed to save playlist');")
content = content.replace("showToast('An error occurred while saving', 'error');", "showToast('An error occurred while saving');")

with open('src/components/Common/ClonePlaylistModal.tsx', 'w') as f:
    f.write(content)
