import re
with open('src/views/HomeView.tsx', 'r') as f:
    content = f.read()

# We need to wrap the whole "Because you listen to" section in a condition.
# Find: {/* 4. Because You Listen to [Artist] (Dynamic from real user affinity) */}
# And the <section> ... </section> after it.

pattern = r"(\{\/\* 4\. Because You Listen to \[Artist\].*?<\/section>)"
# Let's replace the <section> with a conditional render:
# {personalized.becauseYouListenToArtistName && personalized.becauseYouListenToTracks.length > 0 && (
#   <section ... > ... </section>
# )}

def replace_section(m):
    block = m.group(1)
    return "{personalized.becauseYouListenToArtistName && personalized.becauseYouListenToTracks.length > 0 && (\n" + block + "\n          )}"

content = re.sub(pattern, replace_section, content, flags=re.DOTALL)

with open('src/views/HomeView.tsx', 'w') as f:
    f.write(content)
