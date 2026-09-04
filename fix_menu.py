with open('src/components/Navigation/CreateActionMenu.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'className="fixed bottom-[74px] right-3 sm:right-6 left-3 sm:left-auto sm:w-[380px] z-50 rounded-3xl bg-[#1c1c1e] border border-white/10 p-3 shadow-2xl backdrop-blur-2xl space-y-1.5 select-none overflow-hidden"',
    'className="fixed bottom-[74px] right-3 left-3 sm:bottom-auto sm:right-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[380px] z-50 rounded-3xl bg-[#1c1c1e] border border-white/10 p-3 shadow-2xl backdrop-blur-2xl space-y-1.5 select-none overflow-hidden"'
)

# And fix the animation to scale from center on desktop instead of bottom right
content = content.replace(
    "style={{ transformOrigin: 'bottom right' }}",
    "style={{ transformOrigin: typeof window !== 'undefined' && window.innerWidth >= 640 ? 'center' : 'bottom right' }}"
)

with open('src/components/Navigation/CreateActionMenu.tsx', 'w') as f:
    f.write(content)
