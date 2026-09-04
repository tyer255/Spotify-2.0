import re

with open('src/views/SearchView.tsx', 'r') as f:
    content = f.read()

# 1. Move the auto-execute effect
auto_search_effect = """  // Auto-execute full search when user types (debounced)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults(null);
      return;
    }
    const timer = setTimeout(() => {
      executeFullSearch(trimmed);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, executeFullSearch]);
"""
content = content.replace(auto_search_effect, "")

# Insert it after `const executeFullSearch = useCallback(...)`
# It's better to find `  );` for useCallback and place it after.
# executeFullSearch ends at line 787. Let's just place it before `  // If component mounts with an existing query`

content = content.replace("  // If component mounts with an existing query", auto_search_effect + "\n  // If component mounts with an existing query")

# 2. Fix the `onNavigate` id errors (approx line 1022)
content = content.replace("onNavigate({ type: 'artist', id: item.id });", "onNavigate({ type: 'artist', artistId: item.id });")
content = content.replace("onNavigate({ type: 'album', id: item.id });", "onNavigate({ type: 'album', albumId: item.id });")
content = content.replace("onNavigate({ type: 'playlist', id: item.id });", "onNavigate({ type: 'playlist', playlistId: item.id });")

with open('src/views/SearchView.tsx', 'w') as f:
    f.write(content)

