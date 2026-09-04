with open('server.ts', 'r') as f:
    content = f.read()

import re
# We need to remove:
# // Clone Playlist API
# app.post('/api/clone-playlist', async (req, res) => {
# ... everything until ...
# });
# The next block is // API Route: Spotify Link to Thumbnail

# Let's use regex with a non-greedy match.
pattern = r"// Clone Playlist API\s*app\.post\('/api/clone-playlist',.*?\);[\n\s]*(?=(// API Route:|app\.get\('/api/spotify))"
new_content = re.sub(pattern, "", content, flags=re.DOTALL)

if len(new_content) < len(content):
    with open('server.ts', 'w') as f:
        f.write(new_content)
    print(f"Removed. Old size: {len(content)}, New size: {len(new_content)}")
else:
    print("Failed to remove cleanly.")
