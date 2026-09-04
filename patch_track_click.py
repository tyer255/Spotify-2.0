import re

with open('src/views/SearchView.tsx', 'r') as f:
    content = f.read()

# Replace playTrack(track, [track]); in the map functions
def replacer(match):
    return match.group(0) + """
                          addRecentItem({
                            id: track.id,
                            title: track.title,
                            subtitle: `Song • ${track.artist}`,
                            image: track.images?.small || track.images?.medium || track.images?.large || '',
                            type: 'track'
                          });
"""

content = re.sub(
    r"playTrack\(track, \[track\]\);",
    replacer,
    content
)

with open('src/views/SearchView.tsx', 'w') as f:
    f.write(content)

