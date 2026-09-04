with open('src/services/apiClient.ts', 'r') as f:
    content = f.read()

import re

# Remove the clonePlaylist function
pattern = r"async clonePlaylist\(url: string\) \{.*?\}\s*"
new_content = re.sub(pattern, "", content, flags=re.DOTALL)

with open('src/services/apiClient.ts', 'w') as f:
    f.write(new_content)
