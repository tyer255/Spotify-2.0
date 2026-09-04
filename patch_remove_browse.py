import re

with open('src/views/SearchView.tsx', 'r') as f:
    content = f.read()

# We need to remove:
# <section className="pt-2 pb-2">... Discover Something New ... </section>
# <section> ... Browse All ... </section>
# These are inside:
#       {/* 4. Default State (When search is empty and NOT submitted) */}
#       {!isSubmitted && !searchQuery.trim() && (
#         <div className="space-y-6">
# ...

content = re.sub(
    r"\{\/\* Browse Categories \(Spotiz style UI\) \*\/\}.*?\{\/\* Recent Searches \(If any\) \*\/\}",
    "{/* Recent Searches (If any) */}",
    content,
    flags=re.DOTALL
)

with open('src/views/SearchView.tsx', 'w') as f:
    f.write(content)

