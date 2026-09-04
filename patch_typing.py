import re

with open('src/views/SearchView.tsx', 'r') as f:
    content = f.read()

# 1. Remove isSubmitted state completely
content = re.sub(r"const \[isSubmitted, setIsSubmitted\] = useState<boolean>.*?\);\n", "", content, flags=re.DOTALL)

# Remove setIsSubmitted calls
content = re.sub(r"setIsSubmitted\(.*?\);", "", content)

# 2. Add an effect to auto-search
auto_search_effect = """
  // Auto-execute full search when user types (debounced)
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

# Place it before suggestions effect
content = content.replace("// Fetch real matching song suggestions while typing", auto_search_effect + "\n  // Fetch real matching song suggestions while typing")

# 3. Remove "add to recents" from executeFullSearch
top_result_pattern = r"if \(ranked\.topResult\) \{.*?\}\n\s*\}\n\s*setSearchError\(null\);"
content = re.sub(top_result_pattern, "setSearchError(null);", content, flags=re.DOTALL)

# Wait, the earlier pattern for topResult logic had this form:
#             if (ranked.topResult) {
#               let title = '';
#               ...
#               if (title && image) {
#                 addRecentItem({...});
#               }
#             }
#             setSearchError(null);
# We need to find this and remove it accurately.

with open('src/views/SearchView.tsx', 'w') as f:
    f.write(content)

