import sys

with open("src/views/SearchView.tsx", "r") as f:
    content = f.read()

content = content.replace("// showToast is not directly accessible here unless we have it, let's just trigger search", "showToast('QR Code Scanned Successfully!');")

with open("src/views/SearchView.tsx", "w") as f:
    f.write(content)
