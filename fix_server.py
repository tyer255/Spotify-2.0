with open('server.ts', 'r') as f:
    content = f.read()

import re

old_logic = """    if (!url.includes('/playlist/')) {
      return res.status(400).json({ success: false, error: 'The provided link does not point to a valid Spotify playlist' });
    }

    const data = await spotify.getData(url);

    if (!data || !data.trackList) {
      return res.status(404).json({ success: false, error: 'Playlist not found or is private' });
    }"""

new_logic = """    const data = await spotify.getData(url);

    if (!data) {
      return res.status(404).json({ success: false, error: 'Link not found or is private' });
    }
    
    // Support Albums, Playlists, and single Tracks
    if (!data.trackList && data.type === 'track') {
      data.trackList = [data];
      data.name = data.title || data.name || 'Single Track';
    }

    if (!data.trackList || data.trackList.length === 0) {
      return res.status(404).json({ success: false, error: 'No tracks found for this link' });
    }"""

content = content.replace(old_logic, new_logic)

with open('server.ts', 'w') as f:
    f.write(content)
