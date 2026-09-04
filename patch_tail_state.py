import sys

with open("src/views/SearchView.tsx", "r") as f:
    content = f.read()

content = content.replace("setDebouncedQuery(query);", "")

with open("src/views/SearchView.tsx", "w") as f:
    f.write(content)
