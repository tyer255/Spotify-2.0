import re

with open('src/views/SearchView.tsx', 'r') as f:
    content = f.read()

# I want to find the block:
#      {/* 4. When Search Query is Empty: Category Cards + Uncut Real Discover + Complete Languages */}
#      {!searchQuery.trim() && (
#        <div className="space-y-10 pt-2">
# ...
# And replace everything inside it up to {/* Recent Searches (If any) */}

# Actually, I can just replace everything between:
# <div className="space-y-10 pt-2">
#          {/* 2-Column Spotiz Category Cards with Liquid Glass Effect (Music [Red], Podcasts [Green], Live Events [Purple], Home of I-Pop [Dark Blue]) */}
# AND
#          {/* Recent Searches (If any) */}

start_marker = r"\{\/\* 2-Column Spotiz Category Cards with Liquid Glass Effect \(Music \[Red\], Podcasts \[Green\], Live Events \[Purple\], Home of I-Pop \[Dark Blue\]\) \*\/\}"
end_marker = r"\{\/\* Recent Searches \(If any\) \*\/\}"

pattern = start_marker + r".*?" + end_marker

new_content = re.sub(pattern, "{/* Recent Searches (If any) */}", content, flags=re.DOTALL)

with open('src/views/SearchView.tsx', 'w') as f:
    f.write(new_content)

