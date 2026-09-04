import re

with open('src/views/SearchView.tsx', 'r') as f:
    content = f.read()

# 467: if (!trimmed || isSubmitted) {
content = re.sub(r"if \(!trimmed \|\| isSubmitted\) \{", "if (!trimmed) {", content)

# 550: remove isSubmitted from dependency array
content = re.sub(r"isSubmitted,\s*", "", content)

# 718: comment
content = re.sub(r"// Capture suggestions before they are cleared by isSubmitted state change", "// Capture suggestions", content)

# 792: if (trimmed && isSubmitted && !results && !loading) {
content = re.sub(r"if \(trimmed && isSubmitted && !results && !loading\) \{", "if (trimmed && !results && !loading) {", content)

# 975: {isSubmitted && searchQuery.trim() && (
content = re.sub(r"\{isSubmitted && searchQuery\.trim\(\) && \(", "{searchQuery.trim() && (", content)

# 1089: {!isSubmitted && searchQuery.trim() && (
# Wait, this is the "Suggestions Display While Typing". 
# The user wants "Results should update naturally as the user types".
# If I remove this entirely, we won't show the suggestions, we'll just show the actual results!
# Let's remove the whole Suggestions Display While Typing block.

start_sug = r"\{\/\* 5\. Suggestions Display While Typing \(When search is NOT submitted yet\) \*\/\}\n\s*\{\!isSubmitted && searchQuery\.trim\(\) && \(\n\s*<motion\.div.*?</motion\.div>\n\s*\)\}"
content = re.sub(start_sug, "", content, flags=re.DOTALL)

# Let me check if there's an exact match for the end of the block.
# Actually, replacing {!isSubmitted && searchQuery.trim() && ( with {false && ( is safer to just hide it!
content = re.sub(r"\{\!isSubmitted && searchQuery\.trim\(\) && \(", "{false && (", content)

# 1273: {isSubmitted && loading && (!results || results.songs.length === 0) && (
content = re.sub(r"\{isSubmitted && loading && \(\!results \|\| results\.songs\.length === 0\) && \(", "{searchQuery.trim() && loading && (!results || results.songs.length === 0) && (", content)

# 1288: {isSubmitted && searchError && !loading && (!results || results.songs.length === 0) && (
content = re.sub(r"\{isSubmitted && searchError && \!loading && \(\!results \|\| results\.songs\.length === 0\) && \(", "{searchQuery.trim() && searchError && !loading && (!results || results.songs.length === 0) && (", content)

# 1311: {isSubmitted && searchQuery.trim() && results && !searchError && (
content = re.sub(r"\{isSubmitted && searchQuery\.trim\(\) && results && \!searchError && \(", "{searchQuery.trim() && results && !searchError && (", content)

with open('src/views/SearchView.tsx', 'w') as f:
    f.write(content)

