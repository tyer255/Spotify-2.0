with open('server.ts', 'r') as f:
    content = f.read()

import re

# Find // Clone Playlist API
start_idx = content.find("// Clone Playlist API")
if start_idx != -1:
    end_idx = content.find("app.get('/api/search'", start_idx)
    if end_idx != -1:
        new_content = content[:start_idx] + content[end_idx:]
        with open('server.ts', 'w') as f:
            f.write(new_content)
        print(f"Removed. Old size: {len(content)}, New size: {len(new_content)}")
    else:
        print("Could not find end")
else:
    print("Could not find start")
