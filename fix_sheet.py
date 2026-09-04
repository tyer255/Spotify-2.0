import re

with open('src/components/Common/ClonePlaylistModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports for useDragControls
if "useDragControls" not in content:
    content = content.replace(
        "import { motion, AnimatePresence } from 'motion/react';",
        "import { motion, AnimatePresence, useDragControls } from 'motion/react';"
    )

# 2. Add useDragControls hook inside component
if "const dragControls = useDragControls();" not in content:
    content = content.replace(
        "const { showToast, createPlaylist } = useUser();",
        "const { showToast, createPlaylist } = useUser();\n  const dragControls = useDragControls();"
    )

# 3. Modify motion.div to use dragListener={false} and dragControls
old_motion = r'<motion\.div\s+initial=\{\{ opacity: 0, y: "100%" \}\}\s+animate=\{\{ opacity: 1, y: 0 \}\}\s+exit=\{\{ opacity: 0, y: "100%" \}\}\s+transition=\{\{ type: "spring", damping: 25, stiffness: 200 \}\}\s+drag="y"\s+dragConstraints=\{\{ top: 0 \}\}\s+dragElastic=\{\{ top: 0, bottom: 0\.8 \}\}\s+onDragEnd=\{\(e, info\) => \{\s+if \(info\.offset\.y > 80 \|\| info\.velocity\.y > 200\) \{\s+onClose\(\);\s+\}\s+\}\}\s+className="w-full max-w-md relative flex flex-col justify-end z-10 h-auto max-h-\[70vh\] sm:max-h-\[85vh\] mt-auto"\s*>'

new_motion = '''<motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 80 || info.velocity.y > 200) {
                onClose();
              }
            }}
            className="w-full max-w-md relative flex flex-col justify-end z-10 h-[75vh] mt-auto"
          >'''

content = re.sub(old_motion, new_motion, content)

# 4. Step 1: Update drag handle and container height
old_step1_container = r'<div className="relative bg-gradient-to-b from-\[#242424\] via-\[#151515\] to-\[#0a0a0a\] sm:rounded-\[32px\] rounded-t-\[32px\] pt-3 pb-8 px-6 border-t border-x border-white/10 shadow-\[0_-20px_50px_rgba\(0,0,0,0\.8\)\] flex flex-col items-center">'
new_step1_container = '<div className="relative bg-gradient-to-b from-[#242424] via-[#151515] to-[#0a0a0a] sm:rounded-[32px] rounded-t-[32px] pt-1 pb-8 px-6 border-t border-x border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex flex-col items-center h-full overflow-y-auto">'
content = re.sub(old_step1_container, new_step1_container, content)

old_handle_1 = r'\{\/\* ड्रैग हैंडल \*\/\}\s*<div className="w-12 h-1\.5 bg-zinc-600/80 rounded-full mb-6 shrink-0" \/>'
new_handle_1 = '''{/* ड्रैग हैंडल */}
                <div 
                  className="w-full pt-3 pb-5 flex justify-center cursor-grab active:cursor-grabbing shrink-0"
                  onPointerDown={(e) => dragControls.start(e)}
                  style={{ touchAction: 'none' }}
                >
                  <div className="w-12 h-1.5 bg-zinc-600/80 rounded-full" />
                </div>'''
content = re.sub(old_handle_1, new_handle_1, content)


# 5. Step 2: Update container height and add drag handle
old_step2_container = r'<div className="relative bg-\[#0e0e14\] sm:rounded-\[32px\] rounded-t-\[32px\] border-t border-x border-white/10 shadow-\[0_-20px_50px_rgba\(0,0,0,0\.8\)\] flex flex-col max-h-\[70vh\] overflow-hidden w-full">'
new_step2_container = '''<div className="relative bg-[#0e0e14] sm:rounded-[32px] rounded-t-[32px] border-t border-x border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex flex-col h-full overflow-hidden w-full">
                {/* ड्रैग हैंडल */}
                <div 
                  className="w-full pt-4 pb-2 flex justify-center cursor-grab active:cursor-grabbing shrink-0 bg-gradient-to-b from-emerald-950/25 to-transparent"
                  onPointerDown={(e) => dragControls.start(e)}
                  style={{ touchAction: 'none' }}
                >
                  <div className="w-12 h-1.5 bg-zinc-600/80 rounded-full" />
                </div>'''
content = re.sub(old_step2_container, new_step2_container, content)

with open('src/components/Common/ClonePlaylistModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
