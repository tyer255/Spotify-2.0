import re

with open('src/views/SearchView.tsx', 'r') as f:
    content = f.read()

# Add PlusCircle to imports if not there
if 'PlusCircle' not in content:
    content = content.replace("import { Search, Play, Pause, X", "import { Search, Play, Pause, X, PlusCircle")

# Replace <Plus ... /> with <PlusCircle ... /> in the Recents button
content = re.sub(
    r"<Plus className=\"w-6 h-6 stroke-1\" \/>",
    '<PlusCircle className="w-5 h-5 stroke-[1.5]" />',
    content
)

# And for the Check, the screenshot shows it's around the same size as PlusCircle.
# We had:
# <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
#   <Check className="w-3 h-3 text-black stroke-[3]" />
# </div>
# Which is 20px x 20px. That's fine.

with open('src/views/SearchView.tsx', 'w') as f:
    f.write(content)

