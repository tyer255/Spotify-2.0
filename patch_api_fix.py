import re
with open('src/services/apiClient.ts', 'r') as f:
    content = f.read()

pattern = r"\s*\)\s*\}\);\s*\}\s*async search"
content = re.sub(pattern, "\n\n  async search", content)

with open('src/services/apiClient.ts', 'w') as f:
    f.write(content)
