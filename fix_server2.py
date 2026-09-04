import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace the URL validation check to allow tracks, albums, and playlists
old_url_check = """    if (!url.includes('/playlist/')) {
      return res.status(400).json({ success: false, error: 'The provided link does not point to a valid Spotify playlist' });
    }"""

# Actually, let's just remove the strict check, since spotify.getData() will handle it.
# We'll just replace it with empty.
content = content.replace(old_url_check, "")

# Now fix the data trackList check
old_data_check = """    const data = await spotify.getData(url);

    if (!data || !data.trackList) {
      return res.status(404).json({ success: false, error: 'Playlist not found or is private' });
    }"""

new_data_check = """    const data = await spotify.getData(url);

    if (!data) {
      return res.status(404).json({ success: false, error: 'Link not found or is private' });
    }
    
    if (!data.trackList && data.type === 'track') {
      data.trackList = [data];
      data.name = data.title || data.name || 'Single Track';
    }

    if (!data.trackList || data.trackList.length === 0) {
      return res.status(404).json({ success: false, error: 'No tracks found for this link' });
    }"""

content = content.replace(old_data_check, new_data_check)

with open('server.ts', 'w') as f:
    f.write(content)
