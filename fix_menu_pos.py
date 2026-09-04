with open('src/components/Navigation/CreateActionMenu.tsx', 'r') as f:
    content = f.read()

# Replace the transform origin
content = content.replace(
    "style={{ transformOrigin: typeof window !== 'undefined' && window.innerWidth >= 640 ? 'center' : 'bottom right' }}",
    "style={{ transformOrigin: 'bottom left' }}"
)

# Replace the classes
old_class = 'className="fixed bottom-[74px] right-3 left-3 sm:bottom-auto sm:right-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[380px] z-50 rounded-3xl bg-[#1c1c1e] border border-white/10 p-3 shadow-2xl backdrop-blur-2xl space-y-1.5 select-none overflow-hidden"'
new_class = 'className="fixed bottom-[74px] left-3 right-3 md:bottom-6 md:left-[272px] md:right-auto w-auto md:w-[380px] z-50 rounded-3xl bg-[#1c1c1e] border border-white/10 p-3 shadow-2xl backdrop-blur-2xl space-y-1.5 select-none overflow-hidden"'

content = content.replace(old_class, new_class)

with open('src/components/Navigation/CreateActionMenu.tsx', 'w') as f:
    f.write(content)
