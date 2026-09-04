import sys

with open("server.ts", "r") as f:
    content = f.read()

# Find the start of the scanner endpoint
start_idx = content.find("// 25. Gemini Spotify Code Scanner")
if start_idx != -1:
    # Find the end (which is the Vite integration comment)
    end_idx = content.find("// ================= VITE INTEGRATION =================", start_idx)
    if end_idx != -1:
        # Remove the block
        content = content[:start_idx] + content[end_idx:]

with open("server.ts", "w") as f:
    f.write(content)
