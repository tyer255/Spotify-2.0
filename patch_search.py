import sys

with open("src/views/SearchView.tsx", "r") as f:
    content = f.read()

target = """          if (onSearchChange) onSearchChange(query);
          showToast('QR Code Scanned Successfully!');"""

replacement = """          if (onSearchChange) onSearchChange(query);
          executeFullSearch(query);
          showToast('Scanner Found: ' + query);"""

new_content = content.replace(target, replacement)

with open("src/views/SearchView.tsx", "w") as f:
    f.write(new_content)
