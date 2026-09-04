with open('src/components/Common/ClonePlaylistModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the main wrapper height
old_frame = '''          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="w-full max-w-md relative flex flex-col justify-end z-10 sm:h-auto h-[90vh]"
          >'''

new_frame = '''          <motion.div 
            initial={{ opacity: 0, y: 300 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 800 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="w-full max-w-md relative flex flex-col justify-end z-10 h-auto max-h-[75vh] sm:max-h-[85vh] mt-auto"
          >'''

content = content.replace(old_frame, new_frame)

with open('src/components/Common/ClonePlaylistModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
