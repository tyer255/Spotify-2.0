import re

with open('server/providers/OpenMusicProvider.ts', 'r') as f:
    content = f.read()

# Fix moods
old_moods = """      const moods = [
        { id: 'bollywood', title: 'Bollywood Hits', color: '#E13300' },
        { id: 'punjabi', title: 'Punjabi Swag', color: '#1E3264' },
        { id: 'romance', title: 'Desi Romance', color: '#E8115B' },
        { id: 'indie', title: 'Indian Indie', color: '#148A08' },
      ];"""

new_moods = """      const moods = [
        { id: 'bollywood', name: 'Bollywood Hits', color: '#E13300', image: '', query: 'bollywood' },
        { id: 'punjabi', name: 'Punjabi Swag', color: '#1E3264', image: '', query: 'punjabi' },
        { id: 'romance', name: 'Desi Romance', color: '#E8115B', image: '', query: 'romance' },
        { id: 'indie', name: 'Indian Indie', color: '#148A08', image: '', query: 'indie' },
      ];"""

content = content.replace(old_moods, new_moods)

with open('server/providers/OpenMusicProvider.ts', 'w') as f:
    f.write(content)

