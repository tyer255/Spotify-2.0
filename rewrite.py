import re

with open('src/components/Common/ClonePlaylistModal.tsx', 'r') as f:
    content = f.read()

# We need to replace the step 1 JSX with the user's JSX
