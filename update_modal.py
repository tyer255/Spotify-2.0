import re

with open('src/components/Common/ClonePlaylistModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the outer wrapper to motion.div for AnimatePresence exit to work
old_wrapper = '<div className="fixed inset-0 z-50 bg-[#111]/90 flex justify-center items-end font-sans relative overflow-hidden backdrop-blur-md">'
new_wrapper = '<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#111]/90 flex justify-center items-end font-sans relative overflow-hidden backdrop-blur-md">'
content = content.replace(old_wrapper, new_wrapper)

# Close the motion.div wrapper
old_closing = '''          </motion.div>
        </div>
      )}
    </AnimatePresence>'''
new_closing = '''          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>'''
content = content.replace(old_closing, new_closing)

# 2. Add drag functionality to the inner modal
old_frame = '''          {/* मोबाइल फ्रेम */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="w-full max-w-md relative flex flex-col justify-end z-10 sm:h-auto h-auto max-h-[90vh]"
          >'''
new_frame = '''          {/* मोबाइल फ्रेम */}
          <motion.div 
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
            className="w-full max-w-md relative flex flex-col justify-end z-10 sm:h-auto h-auto max-h-[90vh]"
          >'''
content = content.replace(old_frame, new_frame)

# 3. Mobile responsiveness
content = content.replace(
    '<div className="relative w-full h-[180px] flex items-center justify-center mb-8 shrink-0">',
    '<div className="relative w-full h-[140px] sm:h-[180px] flex items-center justify-center mb-6 sm:mb-8 shrink-0">'
)

content = content.replace(
    'className="absolute right-[15%] top-[15%] w-[110px] h-[110px] rounded-[24px]',
    'className="absolute right-[15%] top-[15%] w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] rounded-[24px]'
)

content = content.replace(
    'className="absolute left-[18%] top-[5%] w-[130px] h-[130px] rounded-[28px]',
    'className="absolute left-[18%] top-[5%] w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] rounded-[28px]'
)

content = content.replace(
    '<h1 className="text-white text-[22px] font-bold tracking-wide mb-8 drop-shadow-md text-center">',
    '<h1 className="text-white text-[18px] sm:text-[22px] font-bold tracking-wide mb-6 sm:mb-8 drop-shadow-md text-center">'
)

content = content.replace(
    '<form onSubmit={handleImport} className="flex flex-col gap-4">',
    '<form onSubmit={handleImport} className="flex flex-col gap-3 sm:gap-4 w-full">'
)

content = content.replace(
    'className="w-full h-[52px] bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#1DB954]/50 focus:bg-white/10 transition-all shadow-inner"',
    'className="w-full h-[48px] sm:h-[52px] bg-white/5 border border-white/10 rounded-2xl pl-11 sm:pl-12 pr-11 sm:pr-12 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#1DB954]/50 focus:bg-white/10 transition-all shadow-inner"'
)

content = content.replace(
    'className="relative w-full h-[52px] bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold rounded-2xl shadow-[0_0_20px_rgba(29,185,84,0.3)] transition-all flex items-center justify-center overflow-hidden active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"',
    'className="relative w-full h-[48px] sm:h-[52px] bg-[#1DB954] hover:bg-[#1ed760] text-black font-extrabold rounded-2xl shadow-[0_0_20px_rgba(29,185,84,0.3)] transition-all flex items-center justify-center overflow-hidden active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group text-sm"'
)

content = content.replace(
    '<div className="p-8 pb-10 flex flex-col items-center bg-[#0e0e14] sm:rounded-[32px] rounded-t-[32px] border-t border-x border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative z-20">',
    '<div className="p-6 sm:p-8 pb-8 sm:pb-10 flex flex-col items-center bg-[#0e0e14] sm:rounded-[32px] rounded-t-[32px] border-t border-x border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative z-20 overflow-y-auto max-h-full">'
)

with open('src/components/Common/ClonePlaylistModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

