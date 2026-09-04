with open('src/components/Common/ClonePlaylistModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('max-h-[90vh]', 'max-h-[70vh]')
# Also reduce max-height of the track list in step 2 so it scrolls properly instead of expanding the modal too much
content = content.replace('max-h-[36vh] sm:max-h-[40vh]', 'max-h-[30vh] sm:max-h-[40vh]')

with open('src/components/Common/ClonePlaylistModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
