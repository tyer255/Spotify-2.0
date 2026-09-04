with open('server.ts', 'r') as f:
    content = f.read()

import re

# Remove the import and setup
pattern = r"// @ts-ignore\s*import spotifyUrlInfo from 'spotify-url-info';\s*// @ts-ignore\s*const customSpotifyFetch.*?\};\s*const spotify = spotifyUrlInfo\(customSpotifyFetch\);"
new_content = re.sub(pattern, "", content, flags=re.DOTALL)

with open('server.ts', 'w') as f:
    f.write(new_content)
    print("Done")
