const fs = require('fs');
let code = fs.readFileSync('src/components/Navigation/ProfileDrawer.tsx', 'utf8');

// Fix footer
const regexFooter = /\{activeSubModal === 'recents' \? \([\s\S]*?(?=\s*<\/div>\s*<\/motion\.div>\s*<\/div>\s*\)\}\s*<\/AnimatePresence>)/;

const replacementFooter = `{activeSubModal === 'recents' ? (
                  <>
                    <button
                      onClick={() => handleNavigate({ type: 'profile' })}
                      className="text-xs font-semibold text-[#1ed760] hover:underline cursor-pointer"
                    >
                      View all in Profile →
                    </button>
                    <button
                      onClick={() => setActiveSubModal(null)}
                      className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer active:scale-95"
                    >
                      Close
                    </button>
                  </>
                ) : activeSubModal === 'updates' ? (
                  <>
                    <span className="text-xs text-neutral-400">
                      {followedArtistsList.length} following
                    </span>
                    <button
                      onClick={() => setActiveSubModal(null)}
                      className="px-5 py-1.5 rounded-full bg-[#1ed760] hover:bg-[#1db954] text-xs font-bold text-black transition-all cursor-pointer active:scale-95"
                    >
                      Done
                    </button>
                  </>
                ) : (
                  <div className="w-full flex justify-end">
                    <button
                      onClick={() => setActiveSubModal(null)}
                      className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-all cursor-pointer active:scale-95"
                    >
                      Close
                    </button>
                  </div>
                )}`;
code = code.replace(regexFooter, replacementFooter);

// Fix loading overlay
const loadingOverlay = `
      {/* 3-Dot Loading Overlay for Account Switching */}
      <AnimatePresence>
        {isSwitchingAccount && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#121212] flex items-center justify-center"
          >
            <div className="flex gap-2 items-center">
              <motion.div
                animate={{ scale: [0.6, 1.2, 0.6] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                className="w-4 h-4 rounded-full bg-white"
              />
              <motion.div
                animate={{ scale: [0.6, 1.2, 0.6] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="w-4 h-4 rounded-full bg-white"
              />
              <motion.div
                animate={{ scale: [0.6, 1.2, 0.6] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                className="w-4 h-4 rounded-full bg-white"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
`;
code = code.replace(/<\/>,[\s\n]*document\.body/, loadingOverlay + '\n    </>,\n    document.body');

fs.writeFileSync('src/components/Navigation/ProfileDrawer.tsx', code);
console.log('Fixed ProfileDrawer.tsx');
