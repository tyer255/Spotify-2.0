import re
with open('src/views/HomeView.tsx', 'r') as f:
    code = f.read()

# Just remove the comment entirely
code = re.sub(r'\{\/\* 4\. Because You Listen to.*?affinity\) \*\/\}', '', code, flags=re.DOTALL)

with open('src/views/HomeView.tsx', 'w') as f:
    f.write(code)
